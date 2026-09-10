import { analyzeDocument, resolveLanguage, type AnalysisResult } from '@/lib/detector'
import { loadBaseline } from '@/lib/detector/baselines'
import { loadDetectionKeys, type DetectionKey } from '@/lib/detector/keys'
import type { Baseline } from '@/lib/detector/distributional'
import type { LanguageCode } from '@/lib/detector/languages'

/**
 * The server-side entry point shared by the JSON API, the MCP server and the
 * evidence report.
 *
 * The SAME engine as the browser runs, called the same way. The only difference
 * is the key set: the server can hold vendor or institution keys from
 * WATERMARKREMOVERPRO_DETECTION_KEYS, which by definition cannot be shipped to
 * a browser without publishing them.
 */

let keys: DetectionKey[] | null = null
const baselines: Partial<Record<LanguageCode, Baseline>> = {}

export function serverKeys(): DetectionKey[] {
  // Not cached across a misconfiguration: loadDetectionKeys throws on malformed
  // input, and that must keep throwing until it is fixed rather than being
  // swallowed once at startup.
  if (!keys) keys = loadDetectionKeys(process.env as Record<string, string | undefined>)
  return keys
}

export async function analyzeOnServer(
  text: string,
  options: { language?: string; granularity?: 'sentence' | 'paragraph'; fdr?: number } = {},
): Promise<AnalysisResult> {
  const { language } = resolveLanguage(text, options.language)

  if (language && !baselines[language]) {
    try {
      baselines[language] = await loadBaseline(language)
    } catch {
      // The style channel reports 'no_baseline' with its reason. The watermark
      // test is unaffected and still runs. Refusing the whole request because
      // one channel is unavailable would withhold a result we can compute.
    }
  }

  return analyzeDocument(text, {
    keys: serverKeys(),
    language: options.language,
    granularity: options.granularity,
    fdr: options.fdr,
    baselines,
  })
}
