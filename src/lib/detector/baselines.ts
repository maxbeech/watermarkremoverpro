/**
 * Baseline loading.
 *
 * Each language's baseline is loaded through a dynamic import so the browser
 * downloads only the one it needs. A user checking an English document should
 * not pay to download the German, Spanish, French and Portuguese reference
 * statistics, and on the free path the whole analysis happens in their browser,
 * so bundle weight is a real cost to a real person, not a build-time nicety.
 *
 * A language whose baseline file is missing is UNSUPPORTED. It is never
 * substituted with another language's numbers: comparing Portuguese prose to a
 * Spanish reference would produce deviations that look like findings and are
 * artefacts of the substitution.
 */

import type { Baseline } from './distributional'
import type { LanguageCode } from './languages'

const cache = new Map<LanguageCode, Baseline>()

/**
 * Static map of loaders. Written out rather than built from a template string
 * because bundlers must see each import literally to code-split them.
 */
const loaders: Record<LanguageCode, () => Promise<{ default: unknown }>> = {
  en: () => import('./baselines/en'),
  es: () => import('./baselines/es'),
  fr: () => import('./baselines/fr'),
  de: () => import('./baselines/de'),
  pt: () => import('./baselines/pt'),
}

export async function loadBaseline(language: LanguageCode): Promise<Baseline> {
  const cached = cache.get(language)
  if (cached) return cached

  const loader = loaders[language]
  if (!loader) throw new Error(`No baseline loader registered for language "${language}".`)

  const mod = await loader()
  const baseline = (mod.default ?? mod) as Baseline
  assertUsable(baseline, language)
  cache.set(language, baseline)
  return baseline
}

/**
 * Refuse a baseline that cannot support a measurement.
 *
 * A malformed or empty baseline file would otherwise produce z scores against
 * zeros and NaNs, numbers that render perfectly and mean nothing.
 */
function assertUsable(baseline: Baseline, language: LanguageCode): void {
  if (!baseline || typeof baseline !== 'object') {
    throw new Error(`Baseline for "${language}" is missing or malformed.`)
  }
  if (!baseline.features || Object.keys(baseline.features).length === 0) {
    throw new Error(`Baseline for "${language}" carries no feature statistics.`)
  }
  if (!baseline.corpus?.retrievedAt) {
    throw new Error(`Baseline for "${language}" has no corpus provenance; it cannot be cited on an evidence report.`)
  }
}

export async function loadAllBaselines(
  languages: LanguageCode[],
): Promise<Partial<Record<LanguageCode, Baseline>>> {
  const out: Partial<Record<LanguageCode, Baseline>> = {}
  for (const lang of languages) out[lang] = await loadBaseline(lang)
  return out
}
