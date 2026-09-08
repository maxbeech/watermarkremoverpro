import { describe, expect, it } from 'vitest'
import {
  PRO_TRIAL_RUNS_PER_WINDOW,
  PRO_TRIAL_WINDOW_DAYS,
  describeReset,
  proTrialStatus,
  recordProTrialRun,
  runsInWindow,
} from './pro-trial'

const at = (iso: string) => new Date(iso)
const NOW = at('2026-09-08T12:00:00.000Z')
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000).toISOString()

describe('proTrialStatus', () => {
  it('gives a brand-new visitor the full allowance', () => {
    const status = proTrialStatus([], NOW)
    expect(status.entitled).toBe(true)
    expect(status.remaining).toBe(PRO_TRIAL_RUNS_PER_WINDOW)
    expect(status.used).toBe(0)
    expect(status.resetsAt).toBeNull()
    expect(status.windowDays).toBe(PRO_TRIAL_WINDOW_DAYS)
  })

  it('withholds the engine once the allowance is spent inside the window', () => {
    const status = proTrialStatus([daysAgo(2)], NOW)
    expect(status.entitled).toBe(false)
    expect(status.remaining).toBe(0)
    expect(status.used).toBe(1)
  })

  it('names when the allowance comes back, exactly one window after the blocking run', () => {
    const run = daysAgo(2)
    const status = proTrialStatus([run], NOW)
    const expected = new Date(new Date(run).getTime() + PRO_TRIAL_WINDOW_DAYS * 86_400_000)
    expect(status.resetsAt).toBe(expected.toISOString())
  })

  it('rolls, rather than resetting on a calendar boundary', () => {
    // A run 7 days and one minute ago is outside the window; 6 days 23h is not.
    expect(proTrialStatus([daysAgo(7.001)], NOW).entitled).toBe(true)
    expect(proTrialStatus([daysAgo(6.9)], NOW).entitled).toBe(false)
  })

  it('ignores unparseable and future timestamps rather than trusting them', () => {
    const future = new Date(NOW.getTime() + 86_400_000).toISOString()
    expect(proTrialStatus(['not-a-date', future], NOW).entitled).toBe(true)
    expect(runsInWindow(['', 'banana', future], NOW)).toEqual([])
  })
})

describe('recordProTrialRun', () => {
  it('appends the run and spends the allowance', () => {
    const next = recordProTrialRun([], NOW)
    expect(next).toHaveLength(1)
    expect(proTrialStatus(next, NOW).entitled).toBe(false)
  })

  it('prunes runs that have aged out instead of growing without bound', () => {
    const stale = [daysAgo(400), daysAgo(90), daysAgo(30)]
    const next = recordProTrialRun(stale, NOW)
    expect(next).toEqual([NOW.toISOString()])
  })

  it('frees the allowance again once a full window has passed', () => {
    const spent = recordProTrialRun([], NOW)
    const laterSameWeek = new Date(NOW.getTime() + 3 * 86_400_000)
    const nextWeek = new Date(NOW.getTime() + (PRO_TRIAL_WINDOW_DAYS + 0.01) * 86_400_000)
    expect(proTrialStatus(spent, laterSameWeek).entitled).toBe(false)
    expect(proTrialStatus(spent, nextWeek).entitled).toBe(true)
  })
})

describe('describeReset', () => {
  it('returns null when nothing is pending', () => {
    expect(describeReset(null, NOW)).toBeNull()
    expect(describeReset(daysAgo(1), NOW)).toBeNull()
  })

  it('scales the unit to the distance', () => {
    const inMinutes = new Date(NOW.getTime() + 12 * 60_000).toISOString()
    const inHours = new Date(NOW.getTime() + 4 * 3_600_000).toISOString()
    const inDays = new Date(NOW.getTime() + 3 * 86_400_000).toISOString()
    expect(describeReset(inMinutes, NOW)).toBe('in 12 minutes')
    expect(describeReset(inHours, NOW)).toBe('in 4 hours')
    expect(describeReset(inDays, NOW)).toBe('in 3 days')
  })
})
