/**
 * What a workspace run is, and the pure functions that shape one.
 *
 * Kept separate from the IndexedDB layer next door so the parts that decide
 * what gets stored, what a run is called and which runs get dropped are
 * testable without a browser. `history.ts` is the only file that talks to the
 * database, and it does no thinking of its own.
 */

import type { RewriteResult } from '@/lib/rewrite'
import type { Strength } from '@/lib/rewrite'
import type { EngineId } from '@/components/workspace/settings'

/** How many runs a browser keeps. Older ones are dropped oldest-first. */
export const MAX_RUNS = 25

export interface RunSettings {
  language: string
  strength: Strength
  engineId: EngineId
  excludedWords: string[]
}

export type RunStatus = 'pending' | 'running' | 'done' | 'error'

/** What produced a version: which action in the workspace replaced the text. */
export type VersionSource = 'rewrite' | 'rerun' | 'paragraph' | 'edit' | 'restore'

export interface RunVersion {
  id: string
  text: string
  createdAt: string
  source: VersionSource
  /** The heuristic AI-style likelihood score measured on this exact text, or null when this version was captured without a fresh measurement. Never a stale figure carried over from an earlier version. */
  likelihood: number | null
}

/** How many versions a single run keeps. Older ones are dropped oldest-first, same discipline as MAX_RUNS. */
export const MAX_VERSIONS = 12

/** The label used wherever there is room for a sentence: the preview banner, a tooltip. */
export const VERSION_SOURCE_LABELS: Record<VersionSource, string> = {
  rewrite: 'First rewrite',
  rerun: 'Rewritten again',
  paragraph: 'Paragraph rewritten',
  edit: 'Edited by hand',
  restore: 'Restored version',
}

/**
 * The same five sources, for a chip.
 *
 * A version strip has to fit several of these across a column, and the long
 * labels above wrapped to two lines each and turned the strip into a paragraph.
 * Both maps are here rather than one being derived from the other by truncation,
 * because "Paragraph rewritten" truncated is "Paragraph rewri…", which is worse
 * than a word chosen for the space.
 */
export const VERSION_SOURCE_SHORT: Record<VersionSource, string> = {
  rewrite: 'Rewrite',
  rerun: 'Re-run',
  paragraph: 'Paragraph',
  edit: 'Edit',
  restore: 'Restore',
}

/**
 * "3 minutes ago", "2 hours ago". Same now-injectable pattern as
 * describeReset in src/lib/entitlements/rewrite-budget.ts, for the same reason:
 * testable without mocking the system clock.
 */
export function describeVersionAge(createdAt: string, now: Date = new Date()): string {
  const ms = now.getTime() - new Date(createdAt).getTime()
  if (!Number.isFinite(ms) || ms < 30_000) return 'just now'
  const minutes = Math.round(ms / 60_000)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export interface RunRecord {
  id: string
  createdAt: string
  updatedAt: string
  /** First words of the draft, for the sidebar. */
  title: string
  status: RunStatus
  error: string | null
  /** Exactly what the visitor put in. Never overwritten, so "run it all again" has an origin. */
  originalText: string
  revisedText: string
  settings: RunSettings
  engineUsed: string | null
  downgraded: string | null
  words: number
  result: RewriteResult | null
  /** Paragraph index to how many times it has been rephrased on its own since the first pass. */
  rephrased: Record<number, number>
  /** Bumped every time the whole document is rewritten again. */
  revision: number
  /**
   * Every distinct text this run has held, oldest first, including the current
   * one: the first rewrite, then every paragraph rephrase, restore, manual
   * edit and full rerun after it. This is what the center column's version
   * history reads from a run doesn't reconstruct history from `revision` and
   * `rephrased` alone because neither says what the text actually was at each
   * step, only how many times something happened to it.
   */
  versions: RunVersion[]
}

export const runId = (): string => `run_${globalThis.crypto.randomUUID()}`

/**
 * Appends a version, unless `text` is exactly what the last version already
 * holds (a rerun that reproduces the same output, or a blur with no edit,
 * is not a new version). Capped at MAX_VERSIONS, oldest dropped first: this is
 * a browser-local convenience for jumping back a few steps, not a full undo
 * log, and an unbounded one would grow with every keystroke's debounced save
 * on a long editing session.
 */
export function appendVersion(
  versions: RunVersion[],
  text: string,
  source: VersionSource,
  likelihood: number | null,
): RunVersion[] {
  const last = versions[versions.length - 1]
  if (last && last.text === text) return versions
  const next = [
    ...versions,
    { id: globalThis.crypto.randomUUID(), text, source, likelihood, createdAt: new Date().toISOString() },
  ]
  return next.length > MAX_VERSIONS ? next.slice(next.length - MAX_VERSIONS) : next
}

/**
 * The sidebar label.
 *
 * The first line of the draft, because that is what the writer recognises. A
 * document with no text yet gets a stated placeholder rather than an empty row
 * that looks like a bug.
 */
export function runTitle(text: string): string {
  const firstLine = text
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0)
  if (!firstLine) return 'Empty draft'
  const cleaned = firstLine.replace(/\s+/g, ' ')
  return cleaned.length <= 60 ? cleaned : `${cleaned.slice(0, 57).trimEnd()}…`
}

/**
 * What actually gets written to disk.
 *
 * `passages[].candidates` is every rewrite the engine generated and scored for
 * every targeted passage, which on a long document is far larger than the
 * document itself and is not read by anything that renders a stored run. It is
 * dropped on the way in rather than carried around forever in a browser
 * database with a storage quota.
 */
export function trimResultForStorage(result: RewriteResult): RewriteResult {
  return {
    ...result,
    passages: result.passages.map((passage) => ({ ...passage, candidates: [] })),
  }
}

/** A fresh run, queued but not yet processed. The workspace runs it on arrival. */
export function newRun(text: string, settings: RunSettings): RunRecord {
  const now = new Date().toISOString()
  return {
    id: runId(),
    createdAt: now,
    updatedAt: now,
    title: runTitle(text),
    status: 'pending',
    error: null,
    originalText: text,
    revisedText: '',
    settings,
    engineUsed: null,
    downgraded: null,
    words: 0,
    result: null,
    rephrased: {},
    revision: 0,
    versions: [],
  }
}

export interface RunSummary {
  passagesRewritten: number
  passagesInDocument: number | null
  tellSwaps: number
  /** 0-100 heuristic AI-style likelihood, before and after. Null where not computable. */
  likelihoodBefore: number | null
  likelihoodAfter: number | null
  band: string | null
  /** Best watermark z across keys, before and after. Null where not testable. */
  watermarkBefore: number | null
  watermarkAfter: number | null
  survivedBefore: number | null
  survivedAfter: number | null
  markDetected: boolean
  markDetectedBefore: boolean
  processingTimeMs: number
  /** 0-100. See RewriteResult.lexicalShiftPercent: how much word-pair choice moved, regardless of what was detected. */
  lexicalShift: number
}

/**
 * The headline numbers, read off the result rather than recomputed.
 *
 * Every field is nullable and stays null when the engine could not measure it.
 * Nothing here substitutes a zero for "not measured"; the components render
 * the null as the reason it is null.
 */
export function summariseRun(result: RewriteResult): RunSummary {
  const before = result.documentBefore
  const after = result.documentAfter
  return {
    /*
      A passage counts as rewritten when the text actually changed, not when a
      candidate was merely chosen.

      The orchestrator sets `chosen` to the winning candidate, and the winner is
      sometimes byte-identical to the passage it replaced (see pickBest: the
      original can score best). Counting those produced the contradiction of a
      panel reporting "1 of 8 passages rewritten" beside a diff correctly
      reporting that nothing changed, which is the kind of figure that makes a
      reader stop believing the other ones.
    */
    passagesRewritten: result.passages.filter((p) => p.chosen !== null && p.chosen !== p.original)
      .length,
    passagesInDocument: before?.passages.length ?? after?.passages.length ?? null,
    tellSwaps: result.tellChangeCount,
    likelihoodBefore: before?.aiLikelihood?.score ?? null,
    likelihoodAfter: after?.aiLikelihood?.score ?? null,
    band: after?.aiLikelihood?.band ?? null,
    watermarkBefore: before?.watermark.results[0]?.z ?? null,
    watermarkAfter: after?.watermark.results[0]?.z ?? null,
    survivedBefore: before?.passageCorrection?.survived ?? null,
    survivedAfter: after?.passageCorrection?.survived ?? null,
    markDetected: after?.watermark.anyDetected ?? false,
    markDetectedBefore: before?.watermark.anyDetected ?? false,
    processingTimeMs: result.processingTimeMs,
    // `?? 0` guards a run stored in this browser before this field existed:
    // localStorage/IndexedDB data isn't migrated on a schema change, so an
    // old RewriteResult genuinely has no lexicalShiftPercent property at all
    // rather than a null one. 0 reads as "nothing to report" here, which is
    // an honest enough default for a run this old rather than "undefined%".
    lexicalShift: result.lexicalShiftPercent ?? 0,
  }
}

/** Newest first, capped at MAX_RUNS. The overflow is what the caller deletes. */
export function pruneRuns(records: RunRecord[], max: number = MAX_RUNS): {
  keep: RunRecord[]
  drop: RunRecord[]
} {
  const sorted = [...records].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  return { keep: sorted.slice(0, max), drop: sorted.slice(max) }
}
