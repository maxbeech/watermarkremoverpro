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
