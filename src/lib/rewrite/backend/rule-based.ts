/**
 * The rule-based backend.
 *
 * No model, no download, no inference latency: deterministic synonym
 * substitution (reusing the calibrate dictionary) layered over the AI-tell
 * pass, varied per candidate by a seeded, deterministic selection so multiple
 * candidates are lexically diverse without needing any randomness or network
 * access. This is what ships as the default "standard" tier and as the
 * always-available fallback when a model-backed backend (see the `advanced`
 * tier, designed in models.ts) is unavailable or still loading.
 *
 * `embed()` here is a lexical-overlap proxy (a hashed bag-of-words vector), not
 * a true semantic embedding. It is honest about that distinction (see the
 * `modelTier` field) rather than pretending to a fidelity it doesn't have. It
 * is genuinely useful for catching a candidate that has drifted in vocabulary
 * far from the original, which is the concrete failure mode the fact-lock and
 * this score are jointly guarding against.
 */

import { tokenize } from '@/lib/detector/tokenize'
import type { LanguageCode } from '@/lib/detector/languages'
import { applyEnglishVariant, type EnglishVariant } from '@/lib/detector/english-variant'
import { loadDictionary } from '@/lib/calibrate/dictionary'
import { preserveCase } from '@/lib/calibrate/substituter'
import { applyDeterministicPass, type TellLibrary } from '@/lib/calibrate/ai-tells'
import { normalizeExcludedTerms, isExcludedWord } from '@/lib/calibrate/excluded-terms'
import { isProtectedProperNoun } from '@/lib/calibrate/proper-nouns'
import type { GenerateOptions, RewriteBackend } from './types'

const EMBED_DIMS = 256

/** Deterministic string hash (FNV-1a), used to seed candidate variation without any randomness. */
function fnv1a(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

async function generateCandidate(
  passage: string,
  language: LanguageCode,
  seed: number,
  strength: GenerateOptions['strength'],
  library: TellLibrary,
  excludedWords: string[] | undefined,
  englishVariant: EnglishVariant | null | undefined,
): Promise<string> {
  const { text: tellSwapped } = applyDeterministicPass(passage, strength, library, excludedWords)
  const excluded = normalizeExcludedTerms(excludedWords)

  let dictionary
  try {
    dictionary = await loadDictionary(language)
  } catch {
    return tellSwapped // no dictionary for this language yet, but tell-swaps are still real work
  }

  const tokens = tokenize(tellSwapped)
  // "balanced" was 0.3, then 0.4: on a passage that IS targeted, 0.3 was
  // roughly one dictionary-eligible word in three changing, which on a short
  // passage reads as "basically one swap". The gap to "aggressive" was then
  // too narrow to notice ("Strong" vs "Rewrite all" barely differed), so the
  // top two strengths are now spread further apart: "aggressive" earns its
  // name (well past halfway) and "regenerate" earns its promise of touching
  // nearly every eligible word, not a modest bump over "aggressive". See
  // BASELINE_SAMPLE_EVERY in ./targeting.ts for the matching change to how
  // many passages get targeted at all.
  const substitutionRate =
    strength === 'preserve' ? 0.15 : strength === 'balanced' ? 0.4 : strength === 'aggressive' ? 0.6 : 0.85

  let result = ''
  let lastEnd = 0
  for (const token of tokens) {
    const protectedNoun = isProtectedProperNoun(tellSwapped, token.raw, token.start, token.end)
    const variants =
      protectedNoun || isExcludedWord(excluded, token.norm) ? null : dictionary.getVariants(token.norm)
    result += tellSwapped.slice(lastEnd, token.start)

    if (variants && variants.length > 0) {
      // Deterministic pseudo-random gate + selection, both seeded by the
      // token's position and the candidate seed, so the same (passage, seed)
      // always yields the same output, and different seeds yield genuinely
      // different, reproducible candidates.
      const gate = fnv1a(`${token.norm}:${token.start}:${seed}`) % 100
      if (gate < substitutionRate * 100) {
        const variantIndex = fnv1a(`${token.norm}:${seed}:pick`) % variants.length
        const chosen = applyEnglishVariant(variants[variantIndex], englishVariant ?? null)
        result += preserveCase(chosen, token.raw)
      } else {
        result += tellSwapped.slice(token.start, token.end)
      }
    } else {
      result += tellSwapped.slice(token.start, token.end)
    }
    lastEnd = token.end
  }
  result += tellSwapped.slice(lastEnd)
  return result
}

function hashedBagOfWordsEmbed(text: string): number[] {
  const vec = new Array(EMBED_DIMS).fill(0)
  const tokens = tokenize(text.toLowerCase())
  if (tokens.length === 0) return vec

  for (const token of tokens) {
    if (token.norm.length === 0) continue
    const bucket = fnv1a(token.norm) % EMBED_DIMS
    vec[bucket] += 1
  }
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0))
  return norm === 0 ? vec : vec.map((v) => v / norm)
}

/**
 * @param library which AI-tell table per-passage candidates use. Pro passes
 *   'extended' (PLANS.pro.rewrite.tellLibrary), free gets 'core'.
 */
export function createRuleBasedBackend(
  language: LanguageCode = 'en',
  library: TellLibrary = 'core',
): RewriteBackend {
  return {
    id: 'rule-based',
    modelTier: 'rule-based',
    async generate(passage, options: GenerateOptions) {
      const count = Math.max(1, options.count)
      const candidates = await Promise.all(
        Array.from({ length: count }, (_, i) =>
          generateCandidate(
            passage,
            (options.language as LanguageCode) ?? language,
            i,
            options.strength,
            library,
            options.excludedWords,
            options.englishVariant,
          ),
        ),
      )
      // De-duplicate: a passage with no dictionary hits produces identical
      // candidates across seeds, and the caller shouldn't see false diversity.
      return Array.from(new Set(candidates))
    },
    async embed(text: string) {
      return hashedBagOfWordsEmbed(text)
    },
  }
}
