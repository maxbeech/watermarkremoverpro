/**
 * Shared proper-noun heuristic.
 *
 * A crude, deliberately conservative rule: a capitalised word that is not the
 * first word of a sentence is treated as a proper noun and left alone by
 * every substitution path (the rule-based backend's dictionary swap, the
 * calibrate module's frequency substituter, and fact-lock.ts's "was anything
 * dropped" check, which previously carried its own copy of this same regex).
 * Kept as one module so all three can never quietly drift apart on what
 * counts as a name.
 *
 * Deliberately not a full NER model: false positives here (a capitalised
 * common word treated as a name) just mean one fewer word gets substituted,
 * which is always safe. False negatives (an actual name substituted) are the
 * failure this exists to prevent, so the rule leans toward over-protecting
 * rather than under-protecting.
 */

const SENTENCE_START_RE = /(^|[.!?]\s+)([A-Z][a-zA-Z]{2,})/g

/** True if `raw` is a capitalised, purely-alphabetic word: the shape a proper noun takes. */
export function looksCapitalized(raw: string): boolean {
  return /^[A-Z][a-zA-Z]*$/.test(raw)
}

/** True if the character span [start, end) is the first word of a sentence in `text` (including the very start of the document). */
export function isSentenceStart(text: string, start: number, end: number): boolean {
  let i = start - 1
  while (i >= 0 && /\s/.test(text[i])) i--
  if (i < 0) return true
  return /[.!?"'‘’“”]/.test(text[i]) || start === 0 || end === 0
}

/**
 * Every word in `text` that recurs capitalised somewhere other than a
 * sentence start: reasonably strong evidence it is a genuine proper noun
 * rather than ordinary sentence-initial capitalisation. Mirrors the
 * conservative dropping rule `extractFacts` in fact-lock.ts already used, now
 * shared so a substitution path can consult the same set instead of only a
 * post-hoc "was it dropped" check.
 */
export function properNounSet(text: string): Set<string> {
  const candidates = new Set<string>()
  const sentenceStartWords = new Set<string>()

  SENTENCE_START_RE.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = SENTENCE_START_RE.exec(text)) !== null) {
    sentenceStartWords.add(match[2])
  }

  const wordRe = /\b[A-Z][a-zA-Z]{2,}\b/g
  wordRe.lastIndex = 0
  while ((match = wordRe.exec(text)) !== null) {
    candidates.add(match[0])
  }

  for (const word of sentenceStartWords) {
    const wordBoundary = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'g')
    const occurrences = (text.match(wordBoundary) ?? []).length
    if (occurrences <= 1) candidates.delete(word)
  }

  return candidates
}

/**
 * Whether the token at [start, end) in `text` should be treated as a
 * protected proper noun and left out of any substitution: capitalised, not a
 * sentence opener, and (for a word short enough to plausibly be an ordinary
 * capitalised common word used mid-sentence, e.g. a title-cased heading) one
 * that actually recurs capitalised elsewhere in the document per
 * `properNounSet`.
 */
export function isProtectedProperNoun(text: string, raw: string, start: number, end: number): boolean {
  if (!looksCapitalized(raw) || raw.length < 2) return false
  if (isSentenceStart(text, start, end)) return false
  return true
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
