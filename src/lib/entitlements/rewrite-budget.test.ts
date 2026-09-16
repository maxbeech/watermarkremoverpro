import { describe, expect, it } from 'vitest'
import {
  REWRITE_TOKENS_PER_WINDOW,
  REWRITE_WINDOW_DAYS,
  canAffordRewrite,
  describeReset,
  recordRewriteSpend,
  rewriteBudgetStatus,
  spendsInWindow,
  type RewriteSpend,
} from './rewrite-budget'

const NOW = new Date('2026-09-10T12:00:00.000Z')
const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString()

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

describe('rewriteBudgetStatus', () => {
  it('gives a fresh visitor the whole allowance', () => {
    const status = rewriteBudgetStatus([], NOW)
    expect(status.entitled).toBe(true)
    expect(status.used).toBe(0)
    expect(status.remaining).toBe(REWRITE_TOKENS_PER_WINDOW)
    expect(status.limit).toBe(REWRITE_TOKENS_PER_WINDOW)
    expect(status.windowDays).toBe(REWRITE_WINDOW_DAYS)
    expect(status.resetsAt).toBeNull()
  })

  it('sums the tokens spent inside the window', () => {
    const spends: RewriteSpend[] = [
      { at: ago(2 * DAY), tokens: 1200 },
      { at: ago(HOUR), tokens: 800 },
    ]
    const status = rewriteBudgetStatus(spends, NOW)
    expect(status.used).toBe(2000)
    expect(status.remaining).toBe(REWRITE_TOKENS_PER_WINDOW - 2000)
    expect(status.entitled).toBe(true)
  })

  it('ignores spends that have aged out of the rolling window', () => {
    const spends: RewriteSpend[] = [
      { at: ago(8 * DAY), tokens: REWRITE_TOKENS_PER_WINDOW },
      { at: ago(HOUR), tokens: 500 },
    ]
    expect(rewriteBudgetStatus(spends, NOW).used).toBe(500)
  })

  it('refuses once the allowance is spent, and says when it comes back', () => {
    const spends: RewriteSpend[] = [{ at: ago(3 * DAY), tokens: REWRITE_TOKENS_PER_WINDOW }]
    const status = rewriteBudgetStatus(spends, NOW)
    expect(status.entitled).toBe(false)
    expect(status.remaining).toBe(0)
    // The blocking spend ages out four days after `now`.
    expect(status.resetsAt).toBe(new Date(NOW.getTime() + 4 * DAY).toISOString())
  })

  it('never reports a negative remainder after a document larger than the budget', () => {
    const spends: RewriteSpend[] = [{ at: ago(HOUR), tokens: REWRITE_TOKENS_PER_WINDOW * 3 }]
    const status = rewriteBudgetStatus(spends, NOW)
    expect(status.remaining).toBe(0)
    expect(status.used).toBe(REWRITE_TOKENS_PER_WINDOW * 3)
  })

  it('drops unparseable and future-dated entries rather than counting them', () => {
    const spends = [
      { at: 'not a date', tokens: 900 },
      { at: new Date(NOW.getTime() + HOUR).toISOString(), tokens: 900 },
      { at: ago(HOUR), tokens: 100 },
    ] as RewriteSpend[]
    expect(rewriteBudgetStatus(spends, NOW).used).toBe(100)
  })
})

describe('spendsInWindow', () => {
  it('returns live spends oldest first', () => {
    const spends: RewriteSpend[] = [
      { at: ago(HOUR), tokens: 10 },
      { at: ago(3 * DAY), tokens: 20 },
    ]
    expect(spendsInWindow(spends, NOW).map((s) => s.tokens)).toEqual([20, 10])
  })
})

describe('canAffordRewrite', () => {
  it('allows a run while any allowance is left', () => {
    expect(canAffordRewrite(rewriteBudgetStatus([], NOW), 500)).toBe(true)
  })

  it('allows a document larger than the whole remaining allowance rather than dead-ending it', () => {
    // Otherwise a document bigger than a week's budget could never be rewritten
    // on the free plan: the visitor would come back next week to the same refusal.
    const nearlySpent: RewriteSpend[] = [
      { at: ago(HOUR), tokens: REWRITE_TOKENS_PER_WINDOW - 1 },
    ]
    const status = rewriteBudgetStatus(nearlySpent, NOW)
    expect(status.remaining).toBe(1)
    expect(canAffordRewrite(status, 50_000)).toBe(true)
  })

  it('refuses once nothing is left', () => {
    const spent: RewriteSpend[] = [{ at: ago(HOUR), tokens: REWRITE_TOKENS_PER_WINDOW }]
    expect(canAffordRewrite(rewriteBudgetStatus(spent, NOW), 1)).toBe(false)
  })
})

describe('recordRewriteSpend', () => {
  it('appends the charge and keeps the ledger', () => {
    const next = recordRewriteSpend([{ at: ago(HOUR), tokens: 300 }], 450, NOW)
    expect(next).toHaveLength(2)
    expect(next[1]).toEqual({ at: NOW.toISOString(), tokens: 450 })
    expect(rewriteBudgetStatus(next, NOW).used).toBe(750)
  })

  it('prunes entries that have left the window instead of growing forever', () => {
    const next = recordRewriteSpend([{ at: ago(9 * DAY), tokens: 5000 }], 100, NOW)
    expect(next).toHaveLength(1)
    expect(next[0].tokens).toBe(100)
  })

  it('rounds a fractional charge and never records a negative one', () => {
    expect(recordRewriteSpend([], 12.6, NOW)[0].tokens).toBe(13)
    expect(recordRewriteSpend([], -40, NOW)[0].tokens).toBe(0)
  })
})

describe('describeReset', () => {
  it('returns null when there is nothing to wait for', () => {
    expect(describeReset(null, NOW)).toBeNull()
    expect(describeReset(ago(HOUR), NOW)).toBeNull()
  })

  it('scales the unit to the distance', () => {
    expect(describeReset(new Date(NOW.getTime() + 12 * 60000).toISOString(), NOW)).toBe('in 12 minutes')
    expect(describeReset(new Date(NOW.getTime() + 4 * HOUR).toISOString(), NOW)).toBe('in 4 hours')
    expect(describeReset(new Date(NOW.getTime() + 3 * DAY).toISOString(), NOW)).toBe('in 3 days')
  })
})
