/**
 * Deterministic "AI tell" pass.
 *
 * Swaps punctuation and phrasing habits that read as machine-written, without
 * any model inference: em-dash clause connectors, a maintained list of stock
 * LLM phrases, and detection (not auto-rewriting, see the note on
 * TRIADIC_LIST_PATTERN below) of templated triadic lists.
 *
 * This runs before the model-backed rewrite pass in the orchestrator (see
 * `src/lib/rewrite/orchestrator.ts`) because it is instant, free of any
 * meaning-preservation risk (every swap here is a closed, hand-reviewed table,
 * not a generated alternative), and often removes enough surface signal on its
 * own that a passage no longer needs a heavier rewrite.
 */

import {
  CORE_STOCK_PHRASES,
  DASH_CLAUSE_PATTERN,
  ELEVATED_VOCABULARY,
  EXTENDED_STOCK_PHRASES,
  NEGATIVE_PARALLELISM_PATTERN,
  TRIADIC_LIST_PATTERN,
} from './patterns'

/**
 * Which phrase table to run.
 *
 * 'core' ships on every tier. 'extended' is the Pro tier's deeper coverage
 * (PLANS.pro.rewrite.tellLibrary in src/lib/site.ts) and adds the
 * announcement/marketing register current models actually write in.
 */
export type TellLibrary = 'core' | 'extended'


export interface TellChange {
  /**
   * Offsets into the text AS IT STOOD immediately before this specific change
   * was applied, not into the original input as a whole. The pass runs
   * multiple sequential swaps, each of which can change the string's length.
   * Consumers that need a stable original-vs-final diff should diff
   * `text` against the original input directly rather than composing these
   * offsets across steps.
   */
  start: number
  end: number
  original: string
  replacement: string
  category: 'punctuation' | 'phrase'
  note: string
}

export interface FlaggedStructure {
  start: number
  end: number
  text: string
  kind: 'triadic-list' | 'negative-parallelism'
  note: string
}

export interface DeterministicPassResult {
  text: string
  changes: TellChange[]
  /**
   * Constructions detected but deliberately not auto-rewritten, because the
   * right rewrite depends on what the sentence is actually saying and a
   * find/replace cannot know that. Surfaced for the reader to act on.
   */
  flaggedStructures: FlaggedStructure[]
  /**
   * Words whose frequency rises sharply in LLM-assisted prose but which are
   * ordinary English on their own. Counted, never replaced: the density
   * across a document is the signal, not any single occurrence.
   */
  elevatedVocabulary: Array<{ word: string; count: number }>
}

/**
 * How aggressively to run the deterministic pass. Mirrors the rewrite engine's
 * Strength levels one-to-one so a single slider drives both layers.
 */
export type TellStrength = 'preserve' | 'balanced' | 'aggressive' | 'regenerate'

function shouldSwapDashes(strength: TellStrength): boolean {
  return strength !== 'preserve'
}

function shouldSwapPhrases(): boolean {
  return true // phrase swaps are meaning-preserving at every strength; always safe
}

/**
 * Replaces an em/en dash clause connector with a comma or period, alternating
 * so the same document doesn't just trade one repeated tic for another.
 */
function swapDashes(text: string): { text: string; changes: TellChange[] } {
  const changes: TellChange[] = []
  let useComma = true
  let result = ''
  let lastEnd = 0

  DASH_CLAUSE_PATTERN.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = DASH_CLAUSE_PATTERN.exec(text)) !== null) {
    const start = match.index
    const end = start + match[0].length
    const replacement = useComma ? ', ' : '. '
    useComma = !useComma

    result += text.slice(lastEnd, start) + replacement
    changes.push({
      start,
      end,
      original: match[0],
      replacement,
      category: 'punctuation',
      note: 'Em/en dash used as a clause connector, a construction over-represented in LLM output relative to typical published prose.',
    })
    lastEnd = end
  }
  result += text.slice(lastEnd)
  return { text: result, changes }
}

/**
 * Case-insensitively swaps stock phrases for a rotating natural alternative.
 * Uses a per-document usage counter so a phrase that appears three times
 * doesn't collapse to the same replacement three times, which would just
 * install a new, equally detectable tic.
 */
function swapStockPhrases(text: string, library: TellLibrary): { text: string; changes: TellChange[] } {
  const changes: TellChange[] = []
  const usage = new Map<string, number>()
  const table = library === 'extended' ? EXTENDED_STOCK_PHRASES : CORE_STOCK_PHRASES
  let result = text

  // Longest phrases first, so "it's important to note that" matches before a
  // shorter substring of itself could.
  const phrases = Object.keys(table).sort((a, b) => b.length - a.length)

  for (const phrase of phrases) {
    const alternatives = table[phrase]
    const re = new RegExp(escapeRegExp(phrase), 'gi')
    let match: RegExpExecArray | null
    // Rebuild result incrementally; offsets below are into `result` as it
    // stood at the start of this phrase's own pass (see TellChange's doc).
    let cursor = 0
    let next = ''
    re.lastIndex = 0
    while ((match = re.exec(result)) !== null) {
      const idx = usage.get(phrase) ?? 0
      const replacement = alternatives[idx % alternatives.length]
      usage.set(phrase, idx + 1)

      next += result.slice(cursor, match.index) + applyCase(match[0], replacement)
      changes.push({
        start: match.index,
        end: match.index + match[0].length,
        original: match[0],
        replacement,
        category: 'phrase',
        note: `"${phrase}" is a stock transition/hedge disproportionately common in LLM output.`,
      })
      cursor = match.index + match[0].length
    }
    next += result.slice(cursor)
    result = next
  }

  return { text: result, changes }
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function applyCase(original: string, replacement: string): string {
  if (replacement.length === 0) return replacement
  if (original[0] === original[0].toUpperCase() && /[A-Za-z]/.test(original[0])) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1)
  }
  return replacement
}

function flagStructures(text: string): FlaggedStructure[] {
  const flagged: FlaggedStructure[] = []

  TRIADIC_LIST_PATTERN.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = TRIADIC_LIST_PATTERN.exec(text)) !== null) {
    flagged.push({
      start: match.index,
      end: match.index + match[0].length,
      text: match[0],
      kind: 'triadic-list',
      note: 'Three-item list. Ordinary once; a recognisable tic when it recurs through a document.',
    })
  }

  NEGATIVE_PARALLELISM_PATTERN.lastIndex = 0
  while ((match = NEGATIVE_PARALLELISM_PATTERN.exec(text)) !== null) {
    flagged.push({
      start: match.index,
      end: match.index + match[0].length,
      text: match[0],
      kind: 'negative-parallelism',
      note: '"Not just X, but Y" construction, one of the most reliable structural tells in current model output.',
    })
  }

  return flagged.sort((a, b) => a.start - b.start)
}

/**
 * Counts high-frequency "AI vocabulary" without touching it.
 *
 * Whole-word, case-insensitive. A single "robust" means nothing; six of them
 * in eight hundred words is worth telling a writer about, and that judgement
 * belongs to the writer rather than to a find/replace.
 */
function countElevatedVocabulary(text: string): Array<{ word: string; count: number }> {
  const counts: Array<{ word: string; count: number }> = []
  for (const word of ELEVATED_VOCABULARY) {
    const re = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'gi')
    const found = text.match(re)
    if (found && found.length > 0) counts.push({ word, count: found.length })
  }
  return counts.sort((a, b) => b.count - a.count)
}

/**
 * Runs the full deterministic pass. Pure function: same input always produces
 * the same output, which is what lets this run without a model and without
 * any semantic-preservation check: every possible output is pre-approved by
 * the pattern table itself.
 */
export function applyDeterministicPass(
  text: string,
  strength: TellStrength = 'balanced',
  library: TellLibrary = 'core',
): DeterministicPassResult {
  let current = text
  const allChanges: TellChange[] = []

  if (shouldSwapPhrases()) {
    const { text: swapped, changes } = swapStockPhrases(current, library)
    current = swapped
    allChanges.push(...changes)
  }

  if (shouldSwapDashes(strength)) {
    const { text: swapped, changes } = swapDashes(current)
    current = swapped
    allChanges.push(...changes)
  }

  return {
    text: current,
    changes: allChanges,
    flaggedStructures: flagStructures(current),
    elevatedVocabulary: countElevatedVocabulary(current),
  }
}
