/**
 * Word-level diff, and paragraph alignment between a draft and its rewrite.
 *
 * The workspace has to answer two questions the old result panel could not:
 * "what exactly did it change in this sentence" and "rewrite that paragraph
 * again, not the whole document". Both need the same thing underneath, a
 * stable correspondence between the text that went in and the text that came
 * out, so both are computed here rather than in the component that draws them.
 *
 * Pure, synchronous and dependency-free, so it is testable without a DOM and
 * cheap enough to run on every render of a long document.
 */

import { splitParagraphs, type Passage } from '@/lib/detector/tokenize'

export type DiffOp = 'equal' | 'insert' | 'delete'

export interface DiffPart {
  op: DiffOp
  /** The words, joined with the whitespace that separated them in the source. */
  text: string
}

/**
 * Split into diffable atoms: runs of whitespace and runs of non-whitespace,
 * kept separate so rejoining the parts reproduces the input character for
 * character. A diff that cannot round-trip its own input is a diff that will
 * eventually show a change that is not there.
 */
function atoms(text: string): string[] {
  return text.match(/\s+|[^\s]+/g) ?? []
}

/**
 * Above this many atoms on either side, the quadratic table is not worth
 * building: a 4,000-word paragraph is not a paragraph, and the memory cost
 * grows with the product of the two lengths. The caller gets a whole-block
 * replace instead, which is accurate, just less granular.
 */
const MAX_ATOMS = 1500

/**
 * A word-level diff of two strings.
 *
 * Longest-common-subsequence over whitespace-preserving atoms, with common
 * prefixes and suffixes peeled off first. The peel is what makes this fast in
 * the case that actually happens here: a rewrite usually leaves most of a
 * paragraph alone, so the table is built over the handful of atoms in the
 * middle that genuinely differ.
 */
export function diffWords(before: string, after: string): DiffPart[] {
  if (before === after) return before.length === 0 ? [] : [{ op: 'equal', text: before }]

  const a = atoms(before)
  const b = atoms(after)

  let head = 0
  while (head < a.length && head < b.length && a[head] === b[head]) head++

  let tail = 0
  while (
    tail < a.length - head &&
    tail < b.length - head &&
    a[a.length - 1 - tail] === b[b.length - 1 - tail]
  ) {
    tail++
  }

  const midA = a.slice(head, a.length - tail)
  const midB = b.slice(head, b.length - tail)

  const parts: DiffPart[] = []
  const push = (op: DiffOp, text: string) => {
    if (text.length === 0) return
    const last = parts[parts.length - 1]
    if (last && last.op === op) last.text += text
    else parts.push({ op, text })
  }

  push('equal', a.slice(0, head).join(''))

  if (midA.length > MAX_ATOMS || midB.length > MAX_ATOMS) {
    push('delete', midA.join(''))
    push('insert', midB.join(''))
  } else {
    for (const part of lcsDiff(midA, midB)) push(part.op, part.text)
  }

  push('equal', a.slice(a.length - tail).join(''))
  return parts
}

/** Classic dynamic-programming LCS, walked back into a part list. */
function lcsDiff(a: string[], b: string[]): DiffPart[] {
  const rows = a.length + 1
  const cols = b.length + 1
  const table = new Uint32Array(rows * cols)

  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i * cols + j] =
        a[i] === b[j]
          ? table[(i + 1) * cols + j + 1] + 1
          : Math.max(table[(i + 1) * cols + j], table[i * cols + j + 1])
    }
  }

  const parts: DiffPart[] = []
  const push = (op: DiffOp, text: string) => {
    if (text.length === 0) return
    const last = parts[parts.length - 1]
    if (last && last.op === op) last.text += text
    else parts.push({ op, text })
  }

  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      push('equal', a[i])
      i++
      j++
    } else if (table[(i + 1) * cols + j] >= table[i * cols + j + 1]) {
      push('delete', a[i])
      i++
    } else {
      push('insert', b[j])
      j++
    }
  }
  while (i < a.length) push('delete', a[i++])
  while (j < b.length) push('insert', b[j++])

  return parts
}

/** How many words the diff added, removed and left alone. */
export function diffStats(parts: DiffPart[]): { added: number; removed: number; unchanged: number } {
  const words = (text: string) => (text.match(/[^\s]+/g) ?? []).length
  let added = 0
  let removed = 0
  let unchanged = 0
  for (const part of parts) {
    if (part.op === 'insert') added += words(part.text)
    else if (part.op === 'delete') removed += words(part.text)
    else unchanged += words(part.text)
  }
  return { added, removed, unchanged }
}

export interface ParagraphPair {
  index: number
  before: string
  after: string
  /** Offsets of this paragraph in the REVISED text, so it can be replaced in place. */
  start: number
  end: number
  changed: boolean
}

export interface ParagraphAlignment {
  /**
   * False when the rewrite did not preserve the paragraph structure, which is
   * the only case where a per-paragraph action would edit the wrong paragraph.
   * The caller shows a whole-document diff and says why instead of guessing.
   */
  aligned: boolean
  pairs: ParagraphPair[]
  reason?: string
}

/**
 * Line up the paragraphs of the draft with the paragraphs of the rewrite.
 *
 * The engine replaces passages in place inside the document string, so
 * paragraph structure survives a rewrite in every ordinary case, and a
 * positional alignment is exactly right when the counts match. When they do
 * not, this refuses to guess: a mis-alignment would mean the "rephrase this
 * paragraph again" button silently rewrote a different paragraph, which is
 * worse than not offering it.
 */
export function alignParagraphs(before: string, after: string): ParagraphAlignment {
  const a: Passage[] = splitParagraphs(before)
  const b: Passage[] = splitParagraphs(after)

  if (a.length !== b.length) {
    return {
      aligned: false,
      pairs: [],
      reason: `The draft has ${a.length} paragraph${a.length === 1 ? '' : 's'} and the rewrite has ${b.length}, so they cannot be matched up one to one.`,
    }
  }

  return {
    aligned: true,
    pairs: a.map((paragraph, index) => ({
      index,
      before: paragraph.text,
      after: b[index].text,
      start: b[index].start,
      end: b[index].end,
      changed: paragraph.text !== b[index].text,
    })),
  }
}

/** Replace one paragraph of `text` with `replacement`, using offsets from the alignment. */
export function replaceRange(text: string, start: number, end: number, replacement: string): string {
  return text.slice(0, start) + replacement + text.slice(end)
}
