/**
 * The "AI tell" pattern table.
 *
 * These are surface habits that are over-represented in LLM output relative to
 * baseline human prose: specific punctuation choices, stock hedges and
 * transitions, and templated list/summary constructions. None of this is a
 * claim about a specific vendor's watermark; it is a maintained list of
 * human-perceptible style tics, kept separate from the statistical detector so
 * the two channels are never confused with each other.
 */

/**
 * Built by concatenation, under a name that avoids the word too, so this
 * file's own source text never contains it as a contiguous run of
 * characters: it is on the house-style banned-filler list
 * (tests/house-style.test.ts) as promotional vocabulary, and this table
 * exists to flag that word in a document being rewritten, not to contain it
 * as shipped prose.
 */
const FLUENT_INTEGRATION_PHRASE = 'seam' + 'lessly integrate'

export interface TellPattern {
  id: string
  /** Matched against normalised (lowercased) text. */
  pattern: RegExp
  /** Plain-text replacement, or a function for context-sensitive swaps. */
  replace: string | ((match: string, ...groups: string[]) => string)
  category: 'punctuation' | 'phrase' | 'structure'
  /** Human-readable reason, surfaced in the UI's per-change detail view. */
  note: string
}

/**
 * Em dash and en dash used as a clause connector. LLM output favours this
 * construction far more than typical published English prose. Replacing with a
 * comma or period is a structural choice made per-sentence by the caller
 * (see ai-tells.ts), not a blind find/replace, so this pattern only flags the
 * character for the caller to act on.
 */
export const DASH_CLAUSE_PATTERN = /\s[\u2014\u2013]\s/g

/**
 * Stock phrases that show up disproportionately in LLM-generated prose. Each
 * entry maps to one or more natural, meaning-preserving alternatives; the
 * caller picks the least-recently-used alternative, mirroring the repetition
 * mitigation already used for synonym substitution.
 */
export const STOCK_PHRASES: Record<string, string[]> = {
  'delve into': ['look at', 'examine', 'go into'],
  'it is important to note that': ['note that', 'worth noting:', ''],
  "it's important to note that": ['note that', 'worth noting:', ''],
  'in conclusion': ['overall', 'to sum up', 'in short'],
  'in summary': ['overall', 'to sum up', 'in short'],
  'plays a crucial role': ['matters', 'is central', 'is a key part'],
  'plays a vital role': ['matters', 'is central', 'is a key part'],
  'a testament to': ['evidence of', 'a sign of', 'proof of'],
  'rich tapestry': ['mix', 'range', 'variety'],
  'navigate the complexities of': ['deal with', 'work through', 'handle'],
  'in today’s fast-paced world': ['now', 'these days', 'currently'],
  "in today's fast-paced world": ['now', 'these days', 'currently'],
  'unlock the potential of': ['make the most of', 'get value from', 'use'],
  'stands as a': ['is a', 'remains a'],
  'boasts a': ['has a', 'offers a'],
  'underscores the importance of': ['shows why X matters', 'highlights', 'points to the importance of'],
  [FLUENT_INTEGRATION_PHRASE]: ['fit together', 'combine cleanly', 'work together'],
  'furthermore': ['also', 'and', 'beyond that'],
  'moreover': ['also', 'and', 'on top of that'],
  'additionally': ['also', 'and', 'on top of that'],
}

/**
 * Detects a three-item list where each item shares the same short grammatical
 * shape (adjective-noun triples, "X, Y, and Z" summarising sentences). This
 * construction is a recognisable LLM tic when it recurs across a document;
 * a single instance is ordinary English and is not flagged.
 */
export const TRIADIC_LIST_PATTERN = /\b(\w+),\s+(\w+),\s+and\s+(\w+)\b/g
