/**
 * The weekly Pro-engine trial.
 *
 * The Pro rewrite engine is a real local language model. It costs this product
 * nothing to run (it downloads once from the Hugging Face CDN and executes on
 * the caller's own hardware) so the allowance below is a commercial boundary,
 * not a capacity one, and it is written to be generous enough that anyone can
 * see what they would be paying for before deciding.
 *
 * EVERY visitor, signed in or not, gets PRO_TRIAL_RUNS_PER_WINDOW run(s) of the
 * Pro engine per rolling PRO_TRIAL_WINDOW_DAYS. Past that they fall back to the
 * Standard engine, which stays unlimited on every plan, forever, and is never
 * withheld. A Pro subscriber skips this module entirely.
 *
 * ROLLING, not calendar. "One a week" measured against the start of a calendar
 * week hands someone two runs in twenty minutes if they arrive on a Sunday
 * evening, then nothing for seven days. A rolling window is what the sentence
 * actually means.
 *
 * Pure functions over an array of ISO timestamps, so the same arithmetic backs
 * the device-local store and the account-level one and neither can drift.
 */

export const PRO_TRIAL_WINDOW_DAYS = 7
export const PRO_TRIAL_RUNS_PER_WINDOW = 1

const WINDOW_MS = PRO_TRIAL_WINDOW_DAYS * 24 * 60 * 60 * 1000

export interface ProTrialStatus {
  /** True when a Pro-engine run may start right now. */
  entitled: boolean
  /** Runs left in the current window. Never negative. */
  remaining: number
  limit: number
  windowDays: number
  /**
   * When the next run becomes available, as an ISO timestamp. Null when one is
   * available now, because a reset time on an unspent allowance would be a number
   * with no meaning.
   */
  resetsAt: string | null
  /** Runs counted inside the window. Exposed so a caller can show "1 of 1 used". */
  used: number
}

/** Timestamps still inside the window, oldest first. Anything unparseable is dropped. */
export function runsInWindow(runs: readonly string[], now: Date): number[] {
  const cutoff = now.getTime() - WINDOW_MS
  return runs
    .map((iso) => new Date(iso).getTime())
    .filter((ms) => Number.isFinite(ms) && ms > cutoff && ms <= now.getTime())
    .sort((a, b) => a - b)
}

export function proTrialStatus(runs: readonly string[], now: Date = new Date()): ProTrialStatus {
  const live = runsInWindow(runs, now)
  const used = live.length
  const remaining = Math.max(0, PRO_TRIAL_RUNS_PER_WINDOW - used)
  const entitled = remaining > 0

  // The allowance frees up when the run that pushed it over the limit ages out.
  const blocking = live[Math.max(0, used - PRO_TRIAL_RUNS_PER_WINDOW)]
  return {
    entitled,
    remaining,
    used,
    limit: PRO_TRIAL_RUNS_PER_WINDOW,
    windowDays: PRO_TRIAL_WINDOW_DAYS,
    resetsAt: entitled || blocking === undefined ? null : new Date(blocking + WINDOW_MS).toISOString(),
  }
}

/**
 * Record a run, returning the timestamps to persist.
 *
 * Old entries outside the window are dropped here rather than accumulating
 * forever in someone's localStorage or in a database row nobody prunes.
 */
export function recordProTrialRun(runs: readonly string[], now: Date = new Date()): string[] {
  return [...runsInWindow(runs, now), now.getTime()]
    .sort((a, b) => a - b)
    .map((ms) => new Date(ms).toISOString())
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
