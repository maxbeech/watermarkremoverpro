/**
 * The free weekly correction budget.
 *
 * CHECKING IS FREE AND UNLIMITED, on every plan, forever. It always was: the
 * detector runs in the visitor's own tab, so there is no server cost to meter
 * and no honest reason to withhold it. What this module meters is CORRECTION,
 * the rewrite itself, which is the thing the product actually sells.
 *
 * A free visitor gets REWRITE_TOKENS_PER_WINDOW tokens of rewriting per rolling
 * REWRITE_WINDOW_DAYS. A Pro subscriber has no budget at all and never touches
 * this module.
 *
 * WHAT A TOKEN IS HERE. Not an estimate and not a third party's tokenizer: it
 * is the count returned by this product's own `tokenize()` (see
 * src/lib/detector/tokenize.ts), the same deterministic tokenizer every
 * measurement in the detector is built on. The same document therefore costs
 * the same on every machine, and a visitor can reconcile the number they are
 * charged against the word count the app already shows them.
 *
 * ROLLING, not calendar. A budget measured against the start of a calendar week
 * hands someone a full allowance twice within an hour if they arrive on a Sunday
 * evening, then nothing for seven days. A rolling window is what "per week"
 * actually means to the person spending it.
 *
 * WHERE IT IS COUNTED. On the device, in localStorage, and nowhere else (see
 * ./rewrite-budget-store.ts). Counting it per account would mean posting a
 * measurement of the visitor's document to a server on every rewrite, which
 * would contradict the one promise this product makes and is asserted against
 * in tests/product-constraints.test.ts. A budget someone can reset by clearing
 * their site data is the price of that promise, and it is the right trade: the
 * rewrite costs this product nothing to run, so the boundary is commercial
 * rather than a capacity limit being defended.
 *
 * Pure functions over a ledger, so the store and the UI share one arithmetic
 * and cannot drift.
 */

import { countWords } from '@/lib/detector/tokenize'

export const REWRITE_WINDOW_DAYS = 7
export const REWRITE_TOKENS_PER_WINDOW = 20_000

const WINDOW_MS = REWRITE_WINDOW_DAYS * 24 * 60 * 60 * 1000

/**
 * What rewriting `text` costs, and the single definition of the unit.
 *
 * One token is one word-token from `tokenize()`. It is not an estimate of some
 * other vendor's subword count, and the UI says so wherever it shows a figure:
 * a unit nobody can reproduce is a unit nobody can check, and this one can be
 * counted by hand. Every caller charges through here so the number a visitor is
 * shown before a rewrite is the number they are charged after it.
 */
export function tokensIn(text: string): number {
  return countWords(text)
}

/** One rewrite, and what it cost. */
export interface RewriteSpend {
  /** ISO timestamp of the rewrite. */
  at: string
  /** Tokens charged, as counted by `tokenize()`. */
  tokens: number
}

export interface RewriteBudgetStatus {
  /** True when a rewrite may start right now. */
  entitled: boolean
  /** Tokens spent inside the current window. */
  used: number
  limit: number
  /** Tokens left. Never negative, even after a document larger than the whole budget. */
  remaining: number
  windowDays: number
  /**
   * When the oldest spend in the window ages out and some allowance returns, as
   * an ISO timestamp. Null while there is allowance left, because a reset time
   * on an unspent budget is a number with no meaning.
   */
  resetsAt: string | null
}

/** Spends still inside the window, oldest first. Anything unparseable is dropped. */
export function spendsInWindow(
  spends: readonly RewriteSpend[],
  now: Date,
): { at: number; tokens: number }[] {
  const cutoff = now.getTime() - WINDOW_MS
  return spends
    .map((s) => ({ at: new Date(s.at).getTime(), tokens: Math.max(0, Math.round(Number(s.tokens))) }))
    .filter((s) => Number.isFinite(s.at) && Number.isFinite(s.tokens) && s.at > cutoff && s.at <= now.getTime())
    .sort((a, b) => a.at - b.at)
}

export function rewriteBudgetStatus(
  spends: readonly RewriteSpend[],
  now: Date = new Date(),
): RewriteBudgetStatus {
  const live = spendsInWindow(spends, now)
  const used = live.reduce((sum, s) => sum + s.tokens, 0)
  const remaining = Math.max(0, REWRITE_TOKENS_PER_WINDOW - used)
  const entitled = remaining > 0

  return {
    entitled,
    used,
    remaining,
    limit: REWRITE_TOKENS_PER_WINDOW,
    windowDays: REWRITE_WINDOW_DAYS,
    resetsAt:
      entitled || live.length === 0 ? null : new Date(live[0].at + WINDOW_MS).toISOString(),
  }
}

/**
 * Whether a rewrite of `tokens` tokens may start.
 *
 * Deliberately "is there anything left at all" rather than "is there enough".
 * A document larger than the whole weekly budget would otherwise be permanently
 * un-rewritable on the free plan: the visitor would be told to come back next
 * week and find exactly the same refusal waiting. Any remaining allowance buys
 * the run, the run is charged in full, and the budget goes to zero. `tokens` is
 * still taken so a caller cannot accidentally ask this question without knowing
 * what it is about to spend.
 */
export function canAffordRewrite(status: RewriteBudgetStatus, tokens: number): boolean {
  return status.entitled && tokens >= 0
}

/**
 * Record a rewrite, returning the ledger to persist.
 *
 * Spends outside the window are dropped here rather than accumulating forever
 * in someone's localStorage.
 */
export function recordRewriteSpend(
  spends: readonly RewriteSpend[],
  tokens: number,
  now: Date = new Date(),
): RewriteSpend[] {
  const charge = Math.max(0, Math.round(Number(tokens) || 0))
  return [
    ...spendsInWindow(spends, now).map((s) => ({ at: new Date(s.at).toISOString(), tokens: s.tokens })),
    { at: now.toISOString(), tokens: charge },
  ]
}

/** "in 3 days", "in 4 hours", "in 12 minutes". Used in the UI, so it lives with the arithmetic. */
export function describeReset(resetsAt: string | null, now: Date = new Date()): string | null {
  if (!resetsAt) return null
  const ms = new Date(resetsAt).getTime() - now.getTime()
  if (!Number.isFinite(ms) || ms <= 0) return null
  const minutes = Math.round(ms / 60000)
  if (minutes < 60) return `in ${minutes} minute${minutes === 1 ? '' : 's'}`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `in ${hours} hour${hours === 1 ? '' : 's'}`
  const days = Math.round(hours / 24)
  return `in ${days} day${days === 1 ? '' : 's'}`
}
