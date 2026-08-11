/**
 * Deterministic tokenisation and passage segmentation.
 *
 * Intl.Segmenter is deliberately NOT used. It is ICU-backed, so its word
 * boundaries can shift between browser versions and Node releases — and a check
 * that segments differently on two machines produces two different z scores for
 * the same document, which would quietly destroy the reproducibility an evidence
 * report depends on. The regexes below are fixed and behave identically anywhere
 * a modern JS engine runs.
 */

export interface Token {
  /** Surface form as it appeared in the document. */
  raw: string
  /** Lowercased, apostrophes normalised — the form used for all keyed lookups. */
  norm: string
  /** Character offset of the token in the source text. */
  start: number
  end: number
}

export interface Passage {
  index: number
  text: string
  start: number
  end: number
}

/**
 * Word characters, plus the marks and joiners that belong inside a word in the
 * supported languages (é, ñ, ß, hyphenated compounds, elided articles like
 * l'homme, possessives).
 */
const WORD_RE = /\p{L}[\p{L}\p{M}’'-]*/gu

export function tokenize(text: string): Token[] {
  const tokens: Token[] = []
  WORD_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = WORD_RE.exec(text)) !== null) {
    const raw = m[0]
    tokens.push({
      raw,
      norm: normalizeToken(raw),
      start: m.index,
      end: m.index + raw.length,
    })
  }
  return tokens
}

export function normalizeToken(raw: string): string {
  return raw.toLowerCase().replace(/’/g, "'").replace(/^[-']+|[-']+$/g, '')
}

export function countWords(text: string): number {
  WORD_RE.lastIndex = 0
  let n = 0
  while (WORD_RE.exec(text) !== null) n++
  return n
}

/**
 * Abbreviations that end in a period without ending a sentence. Splitting after
 * these inflates the sentence count and deflates measured sentence-length
 * variance, which is one of the distributional features — so getting this wrong
 * would bias a reported statistic, not just the display.
 */
const ABBREVIATIONS = new Set([
  'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr', 'st', 'vs', 'etc', 'eg', 'ie', 'fig', 'no', 'vol',
  'al', 'ca', 'cf', 'ed', 'esp', 'inc', 'ltd', 'co', 'univ', 'dept', 'approx',
  // es / pt
  'sra', 'srta', 'ud', 'uds', 'ejemplo', 'av', 'depto',
  // fr
  'mme', 'mlle', 'bd', 'env',
  // de
  'bzw', 'ggf', 'usw', 'zb', 'evtl', 'nr', 'abb', 'hrsg',
])

/** Split into sentences. Used for per-passage attribution and burstiness. */
export function splitSentences(text: string): Passage[] {
  const passages: Passage[] = []
  const terminator = /[.!?…]+["'”’)\]]*(\s+|$)/g
  let cursor = 0
  let m: RegExpExecArray | null

  while ((m = terminator.exec(text)) !== null) {
    const endOfSentence = m.index + m[0].length
    const candidate = text.slice(cursor, endOfSentence)

    // Don't split on a known abbreviation, or on an initial like "J. R. R."
    const beforeDot = candidate.trimEnd().replace(/[.!?…"'”’)\]]+$/, '')
    const lastWord = beforeDot.split(/[\s(]+/).pop() ?? ''
    const lastWordNorm = normalizeToken(lastWord)
    if (ABBREVIATIONS.has(lastWordNorm) || /^\p{Lu}$/u.test(lastWord)) continue

    pushPassage(passages, text, cursor, endOfSentence)
    cursor = endOfSentence
  }
  if (cursor < text.length) pushPassage(passages, text, cursor, text.length)
  return passages
}

/** Split into paragraphs on blank lines — the coarser attribution granularity. */
export function splitParagraphs(text: string): Passage[] {
  const passages: Passage[] = []
  const re = /\n\s*\n/g
  let cursor = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    pushPassage(passages, text, cursor, m.index)
    cursor = m.index + m[0].length
  }
  if (cursor < text.length) pushPassage(passages, text, cursor, text.length)
  return passages
}

function pushPassage(into: Passage[], text: string, start: number, end: number): void {
  const slice = text.slice(start, end)
  const trimmedStart = start + (slice.length - slice.trimStart().length)
  const trimmed = slice.trim()
  if (trimmed.length === 0) return
  into.push({
    index: into.length,
    text: trimmed,
    start: trimmedStart,
    end: trimmedStart + trimmed.length,
  })
}

/** Punctuation counts used by the distributional channel. */
export function punctuationCounts(text: string): Record<string, number> {
  const counts: Record<string, number> = {
    comma: 0, semicolon: 0, colon: 0, dash: 0, quote: 0, exclamation: 0, question: 0, parenthesis: 0,
  }
  for (const ch of text) {
    switch (ch) {
      case ',': counts.comma++; break
      case ';': counts.semicolon++; break
      case ':': counts.colon++; break
      case '-': case '–': case '—': counts.dash++; break
      case '"': case '“': case '”': case '«': case '»': counts.quote++; break
      case '!': counts.exclamation++; break
      case '?': counts.question++; break
      case '(': counts.parenthesis++; break
    }
  }
  return counts
}
