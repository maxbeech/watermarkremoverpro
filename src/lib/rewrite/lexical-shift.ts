/**
 * How much a rewrite reshuffled the document's own word-pair choices,
 * independent of whether anything was actually detected.
 *
 * Every other number the rewrite reports (evidence z, passages flagged) is
 * scoped to what the detector found. A reader asked a different, reasonable
 * question: even when nothing was found, how much did the wording actually
 * move, as a hedge against a watermark scheme this deployment holds no key
 * for? This measures that directly, in the same units the detector's own
 * green-list test scores in, by reusing `distinctBigrams` from
 * `detector/watermark.ts` rather than inventing a second notion of "word
 * pair" that could disagree with the one actually being tested against.
 */

import { tokenize } from '@/lib/detector/tokenize'
import { distinctBigrams } from '@/lib/detector/watermark'
import { alignParagraphs, diffStats, diffWords } from '@/lib/diff/words'

/**
 * Percentage of the two documents' combined distinct word-bigrams that
 * appears on only one side. 0 means the rewrite carried over every word pair
 * unchanged (nothing to report, however little text changed); 100 means the
 * two documents share no word pair at all. Symmetric (order of the two texts
 * doesn't matter), and 0 for two documents too short to form any bigram
 * rather than a division-by-zero NaN.
 */
export function lexicalShiftPercent(before: string, after: string): number {
  const a = new Set(distinctBigrams(tokenize(before)).map(([prev, cur]) => `${prev} ${cur}`))
  const b = new Set(distinctBigrams(tokenize(after)).map(([prev, cur]) => `${prev} ${cur}`))
  if (a.size === 0 && b.size === 0) return 0

  let shared = 0
  for (const pair of a) if (b.has(pair)) shared++
  const unionSize = a.size + b.size - shared
  return Math.round((1 - shared / unionSize) * 100)
}

/**
 * Share of the ORIGINAL document's words that did not survive into the result,
 * 0-100. This is the unit text-watermark vendors state their own robustness
 * results in ("replacing 10% of words with synonyms"), which is why it is
 * reported alongside the bigram measure above rather than instead of it: a
 * reader comparing this tool's output with a vendor's published figure should
 * be comparing like with like.
 *
 * Computed per paragraph when the rewrite preserved paragraph structure (it
 * does in every ordinary case, because passages are replaced in place), which
 * keeps the LCS table small and avoids `diffWords`'s whole-block fallback
 * overstating the change on a long document. Falls back to one whole-document
 * diff otherwise. Words inserted but not replacing anything do not raise the
 * number; only original words that went missing do.
 */
export function wordChangePercent(before: string, after: string): number {
  const alignment = alignParagraphs(before, after)
  const pairs = alignment.aligned
    ? alignment.pairs.map((p) => [p.before, p.after] as const)
    : ([[before, after]] as const)

  let removed = 0
  let unchanged = 0
  for (const [a, b] of pairs) {
    const stats = diffStats(diffWords(a, b))
    removed += stats.removed
    unchanged += stats.unchanged
  }
  const total = removed + unchanged
  return total === 0 ? 0 : Math.round((removed / total) * 100)
}
