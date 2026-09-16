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
 *
 * The caller's excluded-words list (src/lib/calibrate/excluded-terms.ts) is
 * treated as a fact too: a protected term present in the original is exactly
 * as non-negotiable as a number or a name, so a model-backed candidate that
 * drops or rewords it is rejected here rather than merely discouraged in
 * scoring. The rule-based backend already never touches these terms at
 * generation time; this is the equivalent hard gate for the model-backed
 * backends, which generate free text an exact-match check can't otherwise
 * constrain.
 */

import { normalizeExcludedTerms, termOccursIn, allExcludedTerms } from '@/lib/calibrate/excluded-terms'
import { properNounSet } from '@/lib/calibrate/proper-nouns'

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

export interface ExtractedFacts {
  numbers: string[]
  negationCount: number
  properNouns: Set<string>
  /** Excluded terms (from the caller's excludedWords) that actually occur in the original passage. */
  excludedTermsPresent: string[]
}

export function extractFacts(text: string, excludedWords?: string[]): ExtractedFacts {
  const excludedTermsPresent = allExcludedTerms(normalizeExcludedTerms(excludedWords)).filter((term) =>
    termOccursIn(term, text),
  )
  const numbers = text.match(NUMBER_RE) ?? []
  const lower = text.toLowerCase()
  let negationCount = 0
  for (const cue of NEGATION_CUES) {
    negationCount += countOccurrences(lower, cue)
  }

  const properNouns = properNounSet(text)

  return { numbers, negationCount, properNouns, excludedTermsPresent }
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

  const droppedExclusions = original.excludedTermsPresent.filter((term) => !termOccursIn(term, candidateText))
  if (droppedExclusions.length > 0) {
    return {
      passed: false,
      detail: `Protected term(s) from the never-swap list are missing or changed: ${droppedExclusions.join(', ')}.`,
    }
  }

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
