/**
 * A green-list marker, used to prove the detector detects.
 *
 * This constructs text that CARRIES a mark under a given key, by doing at word
 * granularity what a watermarked language model does at token granularity:
 * at each step, prefer a continuation whose bigram falls in the green list.
 *
 * It exists for two reasons, both of them about trust:
 *
 *  - The test suite uses it for a known-answer test. A detector that has never
 *    been shown a positive is not a detector; it is a function that returns
 *    small numbers. `watermark.test.ts` marks a passage under a key and asserts
 *    the statistic moves, then asserts it does NOT move under a different key.
 *
 *  - The /verify page uses it so a user can watch the same thing happen with
 *    their own eyes, on the open reference key, in their own browser.
 *
 * NOTE ON SCOPE — this adds a mark. There is no inverse anywhere in this
 * codebase and there will not be one. Removing, weakening or paraphrasing
 * around a provenance mark is the one thing MarkWitness does not do, on any
 * tier, for any caller. See docs/NO_REMOVAL.md.
 */

import type { DetectionKey } from './keys'
import { seededRandom } from './stats'
import { isGreen, distinctBigrams } from './watermark'
import { tokenize } from './tokenize'

export interface SimulationResult {
  text: string
  /** Fraction of distinct bigrams in the output that are green under the key. */
  greenFraction: number
  /** How many words were swapped for a green-list alternative. */
  substitutions: number
}

/**
 * Rewrite `source` so that its word bigrams tend to land in the green list.
 *
 * Each word is replaced by whichever of its supplied alternatives keeps the
 * bigram green, mirroring a marked sampler choosing among plausible next tokens.
 * When no alternative is green, the original word stands — exactly as a real
 * marked generator leaves a token red rather than emitting nonsense.
 */
export function applyGreenListMark(
  source: string,
  key: DetectionKey,
  alternatives: Record<string, string[]>,
  seed = 1,
): SimulationResult {
  const rand = seededRandom(seed)
  const words = source.split(/(\s+)/)
  let previous = ''
  let substitutions = 0

  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    if (/^\s*$/.test(word) || word.length === 0) continue

    const lead = word.match(/^[^\p{L}]*/u)?.[0] ?? ''
    const trail = word.match(/[^\p{L}]*$/u)?.[0] ?? ''
    const core = word.slice(lead.length, word.length - trail.length)
    if (core.length === 0) continue

    const norm = core.toLowerCase()
    if (previous !== '') {
      if (!isGreen(key, previous, norm)) {
        const options = (alternatives[norm] ?? []).filter((o) => isGreen(key, previous, o))
        if (options.length > 0) {
          const pick = options[Math.floor(rand() * options.length)]
          words[i] = lead + matchCase(core, pick) + trail
          substitutions++
          previous = pick
          continue
        }
      }
    }
    previous = norm
  }

  const text = words.join('')
  const bigrams = distinctBigrams(tokenize(text))
  let green = 0
  for (const [p, c] of bigrams) if (isGreen(key, p, c)) green++

  return {
    text,
    greenFraction: bigrams.length > 0 ? green / bigrams.length : 0,
    substitutions,
  }
}

function matchCase(original: string, replacement: string): string {
  if (original[0] === original[0]?.toUpperCase() && original[0] !== original[0]?.toLowerCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1)
  }
  return replacement
}

/**
 * Build a marked passage from a vocabulary directly — the cleanest positive
 * control, since every position has a green option available.
 */
export function generateMarkedText(key: DetectionKey, vocabulary: string[], wordCount: number, seed = 7): string {
  const rand = seededRandom(seed)
  const out: string[] = [vocabulary[Math.floor(rand() * vocabulary.length)]]

  for (let i = 1; i < wordCount; i++) {
    const previous = out[i - 1].toLowerCase()
    const greenOptions = vocabulary.filter((w) => isGreen(key, previous, w.toLowerCase()))
    const pool = greenOptions.length > 0 ? greenOptions : vocabulary
    out.push(pool[Math.floor(rand() * pool.length)])
  }

  // Punctuate into sentences so the passage segmenter has something to work with.
  const sentences: string[] = []
  for (let i = 0; i < out.length; i += 12) {
    const chunk = out.slice(i, i + 12)
    if (chunk.length === 0) continue
    chunk[0] = chunk[0].charAt(0).toUpperCase() + chunk[0].slice(1)
    sentences.push(chunk.join(' ') + '.')
  }
  return sentences.join(' ')
}
