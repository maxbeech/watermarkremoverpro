/**
 * Carrying a draft from the marketing page to the workspace.
 *
 * The draft cannot go in the URL: it is the document, and putting a document
 * in a query string writes it into browser history, into any referrer header
 * the next navigation sends, and into the address bar over someone's shoulder.
 * It travels in memory instead, which survives the client-side navigation that
 * `router.push` performs, alongside a copy written to the browser's own
 * database so a reload still finds it.
 *
 * Module state, deliberately: this is a single-tab handoff that lasts one
 * navigation, and anything longer-lived belongs in ./history where the visitor
 * can see it and delete it.
 */

import type { RunRecord } from './runs'

let pending: RunRecord | null = null

export function stageRun(record: RunRecord): void {
  pending = record
}

/** Take the staged run, if the id matches. Reading it clears it. */
export function takeStagedRun(id: string): RunRecord | null {
  if (!pending || pending.id !== id) return null
  const record = pending
  pending = null
  return record
}
