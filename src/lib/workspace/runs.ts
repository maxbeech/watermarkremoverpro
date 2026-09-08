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
}

export type RunStatus = 'pending' | 'running' | 'done' | 'error'

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
}

export const runId = (): string => `run_${globalThis.crypto.randomUUID()}`

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
  processingTimeMs: number
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
    passagesRewritten: result.passages.filter((p) => p.chosen !== null).length,
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
    processingTimeMs: result.processingTimeMs,
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
