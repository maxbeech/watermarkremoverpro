/**
 * Alternative words/phrases for a span the diff view highlights as changed.
 *
 * Drawn from the exact tables the rewrite engine itself swaps from
 * (`calibrate/dictionary.ts`'s synonym table, `calibrate/patterns.ts`'s
 * elevated-vocabulary downshifts and stock-phrase table) rather than invented
 * on the spot. A word the rewrite changed by some other means (the LLM-backed
 * backend has no table entry for its own word choices) simply has no known
 * alternative, and this says so rather than fabricating one: an alternative
 * this module cannot vouch for is worse than none.
 *
 * Keyed by the ORIGINAL word/phrase, the direction every table here is built
 * for (an AI-ish or elevated original mapping to plainer variants), which is
 * also the direction a reader clicking a changed word wants: "what else could
 * this have become instead of what it did."
 */

import { EN_SYNONYMS } from '@/lib/calibrate/dictionary'
import { EXTENDED_STOCK_PHRASES, REGISTER_DOWNSHIFT } from '@/lib/calibrate/patterns'

/** How many alternatives to offer beyond the original and the current word, at most. */
const MAX_ALTERNATIVES = 2

/**
 * Copies the original's case pattern onto a (lowercase) replacement, the same
 * rule `ai-tells.ts` and `substituter.ts` already apply when they perform a
 * swap: repeated here rather than imported, since it is three lines and
 * importing it would mean exporting an internal helper from a module whose
 * job is the deterministic pass, not case utilities.
 */
function applyCase(original: string, replacement: string): string {
  if (replacement.length === 0) return replacement
  if (original === original.toUpperCase() && original.length > 1 && /[A-Za-z]/.test(original)) {
    return replacement.toUpperCase()
  }
  if (original[0] === original[0].toUpperCase() && /[A-Za-z]/.test(original[0])) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1)
  }
  return replacement
}

/**
 * The diff view's atoms are whitespace-delimited, not word-delimited, so a
 * changed span routinely carries its trailing comma or period as part of the
 * same string ("robust," not "robust"). Every table this module looks up is
 * keyed on the bare word, so looking up "robust," literally would silently
 * miss every real entry. Split off the leading/trailing non-letter run once,
 * here, so both the lookup key and the case check operate on the actual word.
 */
function splitEdgePunctuation(text: string): { lead: string; core: string; trail: string } {
  const lead = text.match(/^[^A-Za-z']+/)?.[0] ?? ''
  const trail = text.slice(lead.length).match(/[^A-Za-z']+$/)?.[0] ?? ''
  const core = text.slice(lead.length, text.length - trail.length)
  return { lead, core, trail }
}

/**
 * Up to `MAX_ALTERNATIVES` real alternatives for `original`, excluding
 * whatever the rewrite actually chose (`current`) and the original itself.
 * Empty when `original`'s core word (punctuation and whitespace stripped) is
 * not a key in any of the tables this looks up. Case-matched to `original`,
 * but NOT punctuation-matched: a caller splicing one of these back into text
 * that had a trailing comma on the span being replaced should wrap the
 * result with `withEdgePunctuationOf` below, since a bare table entry knows
 * nothing about the punctuation the specific span it is replacing carried.
 */
export function lookupWordAlternatives(original: string, current: string): string[] {
  const { core: originalCore } = splitEdgePunctuation(original.trim())
  const key = originalCore.toLowerCase()
  if (key.length === 0) return []
  const { core: currentCore } = splitEdgePunctuation(current.trim())

  const pool = new Set<string>()
  for (const variant of EN_SYNONYMS[key] ?? []) pool.add(variant)
  for (const variant of REGISTER_DOWNSHIFT[key] ?? []) pool.add(variant)
  for (const variant of EXTENDED_STOCK_PHRASES[key] ?? []) pool.add(variant)

  pool.delete(key)
  pool.delete(currentCore.toLowerCase())

  return [...pool].slice(0, MAX_ALTERNATIVES).map((alt) => applyCase(originalCore, alt))
}

/**
 * Wraps a bare alternative (from `lookupWordAlternatives`, which returns
 * plain words with no punctuation of their own) with whatever leading and
 * trailing punctuation `referenceText` carries, so choosing "sturdy" for a
 * span that reads "strong," produces "sturdy," rather than silently dropping
 * the comma that belongs to the sentence around it.
 */
export function withEdgePunctuationOf(core: string, referenceText: string): string {
  const { lead, trail } = splitEdgePunctuation(referenceText)
  return `${lead}${core}${trail}`
}
