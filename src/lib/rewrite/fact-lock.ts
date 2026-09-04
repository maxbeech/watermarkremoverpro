/**
 * The fact lock.
 *
 * Rule-based (no model) verification that a rewrite candidate hasn't silently
 * changed the meaning of a passage in a way a semantic-similarity score alone
 * can miss: a swapped number, a flipped negation, a dropped proper noun. A
 * candidate that fails any of these is excluded outright by the scorer. This
 * is a hard gate, not a weighted penalty (see scoring.ts).
 *
 * Deliberately not a full NER model: the job here is narrow (did this specific
 * fact survive), not general entity typing, and a rule-based check is fast,
 * has no download cost, and is exactly as auditable as the rest of the
 * detector it sits beside.
 */

const NUMBER_RE = /-?\d[\d,]*(\.\d+)?%?/g
const NEGATION_CUES = [
  'not',
  "n't",
  'never',
  'no ',
  'none',
  'nothing',
  'nobody',
  'neither',
  'nor',
  'without',
  'cannot',
]
/** A crude, deliberately conservative proper-noun heuristic: capitalised words that are not the first word of a sentence. */
const PROPER_NOUN_RE = /\b[A-Z][a-zA-Z]{2,}\b/g
const SENTENCE_START_RE = /(^|[.!?]\s+)([A-Z][a-zA-Z]{2,})/g

export interface ExtractedFacts {
  numbers: string[]
  negationCount: number
  properNouns: Set<string>
}

export function extractFacts(text: string): ExtractedFacts {
  const numbers = text.match(NUMBER_RE) ?? []
  const lower = text.toLowerCase()
  let negationCount = 0
  for (const cue of NEGATION_CUES) {
    negationCount += countOccurrences(lower, cue)
  }

  const properNouns = new Set<string>()
  const sentenceStartWords = new Set<string>()
  SENTENCE_START_RE.lastIndex = 0
  let startMatch: RegExpExecArray | null
  while ((startMatch = SENTENCE_START_RE.exec(text)) !== null) {
    sentenceStartWords.add(startMatch[2])
  }

  PROPER_NOUN_RE.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = PROPER_NOUN_RE.exec(text)) !== null) {
    // Keep a word flagged as a sentence-start capital only if it recurs
    // capitalised somewhere NOT at a sentence start, which is reasonably
    // strong evidence it is a genuine proper noun rather than ordinary
    // sentence-initial capitalisation.
    properNouns.add(match[0])
  }
  // Words that only ever appear capitalised at a sentence start, and nowhere
  // else in the passage, are ambiguous; drop them to keep the lock
  // conservative (a false positive here would block a perfectly safe rewrite).
  for (const word of sentenceStartWords) {
    const occurrences = countOccurrences(text, word)
    const capitalOccurrences = (text.match(new RegExp(`\\b${escapeRegExp(word)}\\b`, 'g')) ?? []).length
    if (occurrences === capitalOccurrences && occurrences <= 1) properNouns.delete(word)
  }

  return { numbers, negationCount, properNouns }
}

export interface FactLockResult {
  passed: boolean
  detail?: string
}

/**
 * Verifies that a candidate rewrite preserves the facts extracted from the
 * original passage. Conservative by design: it only fails a candidate for a
 * concrete, checkable discrepancy (a missing number, a negation-count
 * mismatch, a missing proper noun), never for a stylistic difference.
 */
export function verifyFacts(original: ExtractedFacts, candidateText: string): FactLockResult {
  const candidate = extractFacts(candidateText)

  const missingNumbers = original.numbers.filter((n) => !candidate.numbers.includes(n))
  if (missingNumbers.length > 0) {
    return { passed: false, detail: `Number(s) from the original are missing or changed: ${missingNumbers.join(', ')}.` }
  }

  if (original.negationCount !== candidate.negationCount) {
    return {
      passed: false,
      detail: `Negation count changed (${original.negationCount} → ${candidate.negationCount}); a "not" may have been added or dropped, which can invert meaning.`,
    }
  }

  const missingNouns = [...original.properNouns].filter((n) => !candidateText.includes(n))
  if (missingNouns.length > 0) {
    return { passed: false, detail: `Named term(s) from the original are missing: ${missingNouns.join(', ')}.` }
  }

  return { passed: true }
}

function countOccurrences(haystack: string, needle: string): number {
  if (needle.length === 0) return 0
  let count = 0
  let pos = haystack.indexOf(needle)
  while (pos !== -1) {
    count++
    pos = haystack.indexOf(needle, pos + needle.length)
  }
  return count
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
