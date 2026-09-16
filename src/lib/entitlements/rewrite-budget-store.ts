'use client'

/**
 * Where the free weekly correction budget is remembered: this browser, and
 * nowhere else.
 *
 * There is deliberately no account scope and no endpoint. Counting the budget
 * per account would mean posting a measurement of the visitor's document (its
 * token count) to a server on every single rewrite, and "nothing about your
 * document ever leaves this tab" is the one promise the whole product is built
 * on. tests/product-constraints.test.ts asserts that no module on the
 * document-holding path makes a network call at all, and this module is on that
 * path.
 *
 * The consequence is stated rather than hidden: someone who clears their site
 * data gets a fresh allowance. That is acceptable. The rewrite runs on their
 * hardware and costs this product nothing to serve, so the budget is a
 * commercial boundary rather than a capacity limit under defence, and a paying
 * subscriber never reaches this module at all.
 */

import {
  recordRewriteSpend,
  rewriteBudgetStatus,
  type RewriteBudgetStatus,
  type RewriteSpend,
} from './rewrite-budget'

const STORAGE_KEY = 'wmrp.rewrite-budget.v1'

const isSpend = (value: unknown): value is RewriteSpend =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as RewriteSpend).at === 'string' &&
  typeof (value as RewriteSpend).tokens === 'number'

function readLedger(): RewriteSpend[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isSpend) : []
  } catch {
    // Private mode, disabled storage, or a corrupted value. Treated as "nothing
    // spent", which errs toward giving the visitor their allowance rather than
    // withholding it over a storage failure that is not their fault.
    return []
  }
}

function writeLedger(spends: RewriteSpend[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(spends))
  } catch {
    // Nothing useful to do. The rewrite happens either way; it just is not counted.
  }
}

export function readRewriteBudget(now: Date = new Date()): RewriteBudgetStatus {
  return rewriteBudgetStatus(readLedger(), now)
}

/** Charge `tokens` against the budget and return what is left. */
export function spendRewriteBudget(tokens: number, now: Date = new Date()): RewriteBudgetStatus {
  const next = recordRewriteSpend(readLedger(), tokens, now)
  writeLedger(next)
  return rewriteBudgetStatus(next, now)
}
