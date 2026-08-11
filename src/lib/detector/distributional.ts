/**
 * The key-free channel: how far this document's measurable style sits from
 * contemporary prose in the same language.
 *
 * WHAT THIS IS NOT. It is not a provenance mark, it does not detect AI, and it
 * is not evidence of authorship. Every consumer of this result, whether the UI,
 * the API, the MCP tool or the evidence report, is required to carry that sentence,
 * because a single number labelled "distance" is the easiest thing in this
 * product to misread as a verdict, and being misread as a verdict is precisely
 * the harm MarkWitness exists to argue against.
 *
 * WHAT IT IS. A typicality measurement. Each feature is expressed as a signed
 * distance in standard deviations from the corpus mean for that language, and
 * the composite is the root-mean-square of those distances. Technical writing,
 * fiction, poetry, translated text and non-native prose all sit far from an
 * encyclopaedic reference, and legitimately so, because distance means "unlike the
 * reference corpus", which is a statement about register, not about a person.
 *
 * A NOTE ON WHY THERE IS NO sqrt(n) HERE. The obvious alternative statistic
 * divides by the standard ERROR rather than the standard deviation, testing
 * whether the document's mean differs from the corpus mean. That test is valid
 * and it is also useless here: its value grows with document length, so a
 * perfectly ordinary 5,000-word essay scores far higher than an identical
 * 500-word one and the user reads the length of their own document as evidence
 * against them. Effect size is the honest quantity for this question.
 */

import { chunkText, measureChunk, FEATURE_NAMES, MIN_CHUNK_TOKENS, type FeatureName } from './features'
import type { LanguageCode } from './languages'
import { quantile, seededRandom } from './stats'
import { splitSentences, tokenize } from './tokenize'

export interface Baseline {
  language: string
  builtAt: string
  corpus: { source: string; license: string; retrievedAt: string; documents: number; tokens: number }
  measurement: { chunks: number; tokensMeasured: number; chunkTokens: number; extractor: string }
  features: Record<string, { mean: number; sd: number }>
  functionWords: Record<string, { mean: number; sd: number }>
}

export interface FeatureDeviation {
  feature: string
  observed: number
  baselineMean: number
  baselineSd: number
  /** Signed distance in standard deviations. */
  z: number
}

export type DistributionalStatus = 'computed' | 'insufficient_data' | 'no_baseline'

export interface DistributionalResult {
  status: DistributionalStatus
  language: LanguageCode
  chunks: number
  tokens: number
  /** RMS of the feature deviations. Null when not computed. */
  compositeDeviation: number | null
  /** Percentile bootstrap interval on the composite. */
  compositeInterval: { low: number; high: number } | null
  features: FeatureDeviation[]
  /** RMS deviation across the language's function-word rates. */
  functionWordDeviation: number | null
  corpus: Baseline['corpus'] | null
  detail?: string
}

const BOOTSTRAP_REPLICATES = 200
/** Cap on tokens resampled per replicate, so a book-length document stays responsive. */
const BOOTSTRAP_TOKEN_CAP = 20_000

function rms(values: number[]): number | null {
  if (values.length === 0) return null
  let acc = 0
  for (const v of values) acc += v * v
  return Math.sqrt(acc / values.length)
}

function averageMeasurement(chunks: string[], language: LanguageCode) {
  const featureTotals = Object.fromEntries(FEATURE_NAMES.map((f) => [f, 0])) as Record<FeatureName, number>
  const functionWordTotals: Record<string, number> = {}
  let tokens = 0

  for (const chunk of chunks) {
    const m = measureChunk(chunk, language)
    tokens += m.tokenCount
    for (const f of FEATURE_NAMES) featureTotals[f] += m.features[f]
    for (const [word, rate] of Object.entries(m.functionWordRates)) {
      functionWordTotals[word] = (functionWordTotals[word] ?? 0) + rate
    }
  }

  const n = chunks.length || 1
  const features = Object.fromEntries(FEATURE_NAMES.map((f) => [f, featureTotals[f] / n])) as Record<FeatureName, number>
  const functionWords = Object.fromEntries(Object.entries(functionWordTotals).map(([w, t]) => [w, t / n]))
  return { features, functionWords, tokens }
}

function composite(
  features: Record<FeatureName, number>,
  baseline: Baseline,
): { deviations: FeatureDeviation[]; value: number | null } {
  const deviations: FeatureDeviation[] = []
  for (const f of FEATURE_NAMES) {
    const ref = baseline.features[f]
    if (!ref || !(ref.sd > 0)) continue
    deviations.push({
      feature: f,
      observed: features[f],
      baselineMean: ref.mean,
      baselineSd: ref.sd,
      z: (features[f] - ref.mean) / ref.sd,
    })
  }
  return { deviations, value: rms(deviations.map((d) => d.z)) }
}

/**
 * Percentile bootstrap over the document's own sentences.
 *
 * Resampling sentences rather than chunks means an interval can be produced for
 * a short document too, since the free tier's cap leaves only three or four chunks,
 * and reporting a point estimate with no interval there would break the
 * product's own rule that a confidence figure is never a bare number.
 *
 * Seeded, so the interval printed on a dated evidence report reproduces exactly.
 */
function bootstrapInterval(
  text: string,
  language: LanguageCode,
  baseline: Baseline,
  totalTokens: number,
  chunkCount: number,
): { low: number; high: number } | null {
  const sentences = splitSentences(text).map((s) => s.text)
  if (sentences.length < 8) return null

  const sentenceTokens = sentences.map((s) => tokenize(s).length)
  const targetTokens = Math.min(totalTokens, BOOTSTRAP_TOKEN_CAP)
  const rand = seededRandom(0x4d57 ^ totalTokens ^ chunkCount)
  const composites: number[] = []

  for (let r = 0; r < BOOTSTRAP_REPLICATES; r++) {
    const picked: string[] = []
    let tokens = 0
    while (tokens < targetTokens) {
      const i = Math.floor(rand() * sentences.length)
      picked.push(sentences[i])
      tokens += sentenceTokens[i]
      if (picked.length > sentences.length * 12) break
    }
    const replicateChunks = chunkText(picked.join(' '))
    if (replicateChunks.length === 0) continue
    const { features } = averageMeasurement(replicateChunks, language)
    const { value } = composite(features, baseline)
    if (value !== null) composites.push(value)
  }

  if (composites.length < BOOTSTRAP_REPLICATES / 2) return null
  composites.sort((a, b) => a - b)
  return { low: quantile(composites, 0.05), high: quantile(composites, 0.95) }
}

/**
 * The result when no baseline was available for the document's language.
 *
 * This is a distinct status rather than a null field, so a caller rendering the
 * style panel has to say "not measured, and here is why" instead of silently
 * showing nothing where a measurement was expected.
 */
export function noBaselineResult(language: LanguageCode, tokens: number): DistributionalResult {
  return {
    status: 'no_baseline',
    language,
    chunks: 0,
    tokens,
    compositeDeviation: null,
    compositeInterval: null,
    features: [],
    functionWordDeviation: null,
    corpus: null,
    detail: `No measured reference corpus for "${language}" was supplied to the engine, so no style measurement was made. Nothing is estimated in its place.`,
  }
}

export function analyzeDistribution(
  text: string,
  language: LanguageCode,
  baseline: Baseline,
): DistributionalResult {
  const chunks = chunkText(text)
  const tokenCount = tokenize(text).length

  if (chunks.length === 0) {
    return {
      status: 'insufficient_data',
      language,
      chunks: 0,
      tokens: tokenCount,
      compositeDeviation: null,
      compositeInterval: null,
      features: [],
      functionWordDeviation: null,
      corpus: baseline.corpus,
      detail: `The document holds ${tokenCount} words; at least ${MIN_CHUNK_TOKENS} are needed for a style measurement. Nothing is reported rather than reporting an unreliable figure.`,
    }
  }

  const measured = averageMeasurement(chunks, language)
  const { deviations, value } = composite(measured.features, baseline)

  const functionWordZs: number[] = []
  for (const [word, rate] of Object.entries(measured.functionWords)) {
    const ref = baseline.functionWords[word]
    if (!ref || !(ref.sd > 0)) continue
    functionWordZs.push((rate - ref.mean) / ref.sd)
  }

  return {
    status: 'computed',
    language,
    chunks: chunks.length,
    tokens: measured.tokens,
    compositeDeviation: value,
    compositeInterval: bootstrapInterval(text, language, baseline, measured.tokens, chunks.length),
    features: deviations.sort((a, b) => Math.abs(b.z) - Math.abs(a.z)),
    functionWordDeviation: rms(functionWordZs),
    corpus: baseline.corpus,
  }
}
