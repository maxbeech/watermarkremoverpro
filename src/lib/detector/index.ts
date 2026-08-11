/**
 * The engine entry point.
 *
 * One `analyzeDocument` serves every surface: the browser (free check, where the
 * text never leaves the device), the JSON API, the MCP tool and the evidence
 * report. There is no second implementation anywhere, which is what lets the
 * evidence report claim it shows the same computation the user saw.
 *
 * The result type is built so that "not computed" is unrepresentable as a
 * number. Every statistic is `number | null` beside a status and a human
 * readable reason, so a caller cannot render a fabricated zero by accident —
 * they have to handle the null.
 */

import {
  analyzeDistribution,
  noBaselineResult,
  type Baseline,
  type DistributionalResult,
} from './distributional'
import { sha256Hex } from './crypto'
import {
  identifyLanguage,
  isSupportedLanguage,
  LANGUAGE_NAMES,
  SUPPORTED_LANGUAGES,
  type LanguageCode,
} from './languages'
import { describeKey, type DetectionKey, type KeyRegistryEntry } from './keys'
import { benjaminiHochberg } from './stats'
import { splitParagraphs, splitSentences, tokenize, type Passage } from './tokenize'
import {
  MIN_TRIALS,
  testWatermark,
  testWatermarkPassage,
  type WatermarkChannelResult,
} from './watermark'

export const ENGINE_VERSION = '1.0.0'

export type AnalysisStatus = 'ok' | 'language_undetermined' | 'unsupported_language' | 'empty_document'

export interface PassageFinding {
  index: number
  text: string
  start: number
  end: number
  words: number
  /** Best (highest) watermark z across keys for this passage, null if not testable. */
  watermarkZ: number | null
  watermarkP: number | null
  watermarkKeyId: string | null
  /** True only after false-discovery-rate correction across all passages. */
  survivesCorrection: boolean
  /** Style distance for this passage, in SDs. Null when the passage is too short. */
  styleDeviation: number | null
}

export interface AnalysisResult {
  engineVersion: ENGINE_VERSION_TYPE
  status: AnalysisStatus
  analyzedAt: string
  /** SHA-256 of the exact text analysed — the anchor on an evidence report. */
  documentHash: string
  words: number
  characters: number
  language: {
    code: LanguageCode | null
    name: string | null
    determinedBy: 'caller' | 'measurement'
    scores: Record<string, number>
    margin: number
  }
  /** One entry per detection key held by this deployment. */
  watermark: {
    keysTested: KeyRegistryEntry[]
    results: WatermarkChannelResult[]
    /** True when any key's test is significant after correction. */
    anyDetected: boolean
    /** Always present. The sentence that stops a null result being over-read. */
    coverageNotice: string
  }
  distribution: DistributionalResult | null
  passages: PassageFinding[]
  passageCorrection: {
    method: 'benjamini-hochberg'
    fdr: number
    tested: number
    survived: number
  } | null
  limits: string[]
  detail?: string
}

type ENGINE_VERSION_TYPE = typeof ENGINE_VERSION

export interface AnalyzeOptions {
  /** Force a language instead of measuring it. */
  language?: string
  keys: DetectionKey[]
  /** Passage granularity for attribution. */
  granularity?: 'sentence' | 'paragraph'
  /** False discovery rate for the per-passage correction. */
  fdr?: number
  /** Supply baselines explicitly (the browser bundle passes only what it loaded). */
  baselines?: Partial<Record<LanguageCode, Baseline>>
}

/** Significance threshold for calling a watermark result a detection. */
export const ALPHA = 0.01

/**
 * The stated limits. These are attached to every result, in every channel, and
 * are reproduced on the evidence report. They are part of the output, not
 * marketing copy that a caller can drop.
 */
export function statedLimits(keys: DetectionKey[]): string[] {
  const vendorKeys = keys.filter((k) => k.vendorPublished)
  return [
    'A detected mark is not proof of authorship. A mark can be present in text a person wrote with assistance, quoted, translated, or edited.',
    'An absent mark is not proof of human authorship. Marks survive editing poorly, are not applied by every system, and cannot be detected at all without the key used to apply them.',
    vendorKeys.length === 0
      ? 'This deployment holds no detection key published by a model vendor. It tested only the keys listed in this report, so it cannot make any statement about marks applied by a vendor whose key is not public.'
      : `Vendor-published keys held by this deployment: ${vendorKeys.map((k) => k.label).join(', ')}.`,
    'The watermark test operates on word pairs, not on a model’s own subword vocabulary. A vendor’s own detector has access to that vocabulary and can therefore reach a different conclusion on the same document.',
    'The style measurement compares this document to contemporary reference prose in the same language. Distance from that reference reflects register, subject and translation, and is not evidence of how the document was produced.',
  ]
}

export function analyzeDocument(text: string, options: AnalyzeOptions): AnalysisResult {
  const analyzedAt = new Date().toISOString()
  const documentHash = sha256Hex(text)
  const tokens = tokenize(text)
  const limits = statedLimits(options.keys)
  const keysTested = options.keys.map(describeKey)

  const empty: AnalysisResult = {
    engineVersion: ENGINE_VERSION,
    status: 'empty_document',
    analyzedAt,
    documentHash,
    words: tokens.length,
    characters: text.length,
    language: { code: null, name: null, determinedBy: 'measurement', scores: {}, margin: 0 },
    watermark: { keysTested, results: [], anyDetected: false, coverageNotice: coverageNotice(options.keys) },
    distribution: null,
    passages: [],
    passageCorrection: null,
    limits,
  }

  if (tokens.length === 0) {
    return { ...empty, detail: 'No words were found in the submitted text.' }
  }

  // --- Language -----------------------------------------------------------
  const identification = identifyLanguage(tokens)
  let language: LanguageCode | null = null
  let determinedBy: 'caller' | 'measurement' = 'measurement'

  if (options.language) {
    if (!isSupportedLanguage(options.language)) {
      return {
        ...empty,
        status: 'unsupported_language',
        language: {
          code: null,
          name: null,
          determinedBy: 'caller',
          scores: identification.scores,
          margin: identification.margin,
        },
        detail: `Language "${options.language}" has no measured baseline in this build. Supported: ${SUPPORTED_LANGUAGES.join(', ')}. No analysis is reported rather than analysing against the wrong reference.`,
      }
    }
    language = options.language
    determinedBy = 'caller'
  } else {
    language = identification.language
  }

  if (language === null) {
    return {
      ...empty,
      status: 'language_undetermined',
      language: { code: null, name: null, determinedBy, scores: identification.scores, margin: identification.margin },
      detail:
        'The language could not be determined confidently from the text, and analysing against the wrong language baseline would produce a real-looking number that means nothing. Choose the language explicitly and run the check again.',
    }
  }

  // --- Watermark channel --------------------------------------------------
  const watermarkResults = options.keys.map((key) => testWatermark(tokens, key))
  const anyDetected = watermarkResults.some(
    (r) => r.status === 'computed' && r.pValue !== null && r.pValue < ALPHA,
  )

  // --- Distributional channel --------------------------------------------
  const baseline = options.baselines?.[language] ?? null
  const distribution: DistributionalResult = baseline
    ? analyzeDistribution(text, language, baseline)
    : noBaselineResult(language, tokens.length)

  // --- Per-passage attribution -------------------------------------------
  const granularity = options.granularity ?? 'sentence'
  const rawPassages: Passage[] = granularity === 'paragraph' ? splitParagraphs(text) : splitSentences(text)
  const fdr = options.fdr ?? 0.05

  const passages: PassageFinding[] = rawPassages.map((p) => {
    const passageTokens = tokenize(p.text)
    let bestZ: number | null = null
    let bestP: number | null = null
    let bestKey: string | null = null

    for (const key of options.keys) {
      const r = testWatermarkPassage(passageTokens, key)
      if (r.z === null) continue
      if (bestZ === null || r.z > bestZ) {
        bestZ = r.z
        bestP = r.p
        bestKey = key.id
      }
    }

    let styleDeviation: number | null = null
    if (baseline && passageTokens.length >= 40) {
      const d = analyzeDistribution(p.text, language, baseline)
      styleDeviation = d.compositeDeviation
    }

    return {
      index: p.index,
      text: p.text,
      start: p.start,
      end: p.end,
      words: passageTokens.length,
      watermarkZ: bestZ,
      watermarkP: bestP,
      watermarkKeyId: bestKey,
      survivesCorrection: false,
      styleDeviation,
    }
  })

  // A long document runs one test per passage, so some will look significant by
  // chance alone. Only corrected discoveries are ever shown as findings.
  const testable = passages.filter((p) => p.watermarkP !== null)
  let passageCorrection: AnalysisResult['passageCorrection'] = null
  if (testable.length > 0) {
    const survivors = benjaminiHochberg(
      testable.map((p) => p.watermarkP as number),
      fdr,
    )
    for (const i of survivors) {
      const target = passages.find((p) => p.index === testable[i].index)
      if (target) target.survivesCorrection = true
    }
    passageCorrection = {
      method: 'benjamini-hochberg',
      fdr,
      tested: testable.length,
      survived: survivors.length,
    }
  }

  return {
    engineVersion: ENGINE_VERSION,
    status: 'ok',
    analyzedAt,
    documentHash,
    words: tokens.length,
    characters: text.length,
    language: {
      code: language,
      name: LANGUAGE_NAMES[language],
      determinedBy,
      scores: identification.scores,
      margin: identification.margin,
    },
    watermark: {
      keysTested,
      results: watermarkResults,
      anyDetected,
      coverageNotice: coverageNotice(options.keys),
    },
    distribution,
    passages,
    passageCorrection,
    limits,
  }
}

/**
 * The sentence that makes a null watermark result honest.
 *
 * Without it, "no mark detected" reads as "your document is clean", which is a
 * claim this product is not in a position to make about any key it does not
 * hold — and cannot be in a position to make, since the whole construction is
 * keyed.
 */
export function coverageNotice(keys: DetectionKey[]): string {
  const names = keys.map((k) => k.label).join(', ')
  const vendor = keys.filter((k) => k.vendorPublished)
  if (vendor.length === 0) {
    return `Tested against ${keys.length} key${keys.length === 1 ? '' : 's'} (${names}). None of these is a model vendor's published detection key, because no vendor publishes one. A result of "no mark detected" means no mark was found under these keys — it is not a statement about marks applied with a key nobody outside the vendor holds.`
  }
  return `Tested against ${keys.length} key${keys.length === 1 ? '' : 's'} (${names}), of which ${vendor.length} ${vendor.length === 1 ? 'is' : 'are'} vendor-published. A result of "no mark detected" applies only to the keys listed.`
}

/**
 * Determine which language a document will be analysed as, without analysing it.
 *
 * Exported because the async wrapper below has to know which single baseline to
 * fetch before it can run, and because the UI needs to tell the user which
 * language it is about to use — and to ask, when the answer is ambiguous.
 */
export function resolveLanguage(
  text: string,
  explicit?: string,
): { language: LanguageCode | null; reason: 'caller' | 'measured' | 'ambiguous' | 'unsupported' } {
  if (explicit) {
    return isSupportedLanguage(explicit)
      ? { language: explicit, reason: 'caller' }
      : { language: null, reason: 'unsupported' }
  }
  const id = identifyLanguage(tokenize(text))
  return id.language ? { language: id.language, reason: 'measured' } : { language: null, reason: 'ambiguous' }
}

/**
 * Analyse a document, fetching the one baseline it needs.
 *
 * This is what every caller should use. The synchronous `analyzeDocument` exists
 * for callers that already hold their baselines (the API route, which loads them
 * once per process rather than once per request).
 */
export async function checkDocument(
  text: string,
  options: Omit<AnalyzeOptions, 'baselines'>,
): Promise<AnalysisResult> {
  const { language } = resolveLanguage(text, options.language)
  let baselines: Partial<Record<LanguageCode, Baseline>> = {}

  if (language) {
    const { loadBaseline } = await import('./baselines')
    try {
      baselines = { [language]: await loadBaseline(language) }
    } catch {
      // Leave baselines empty. analyzeDocument then reports the style channel as
      // 'no_baseline' with a reason, which is the honest outcome — far better
      // than aborting a watermark test that is perfectly able to run.
      baselines = {}
    }
  }

  return analyzeDocument(text, { ...options, baselines })
}

export { MIN_TRIALS }
export type { WatermarkChannelResult, DistributionalResult, Baseline, DetectionKey, KeyRegistryEntry }
