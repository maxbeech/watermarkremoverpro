'use client'

/**
 * Where a visitor's Pro-engine trial usage is remembered.
 *
 * Two scopes, one shared arithmetic (./pro-trial):
 *
 *   device   localStorage on this browser. What an anonymous visitor gets.
 *            Honest about what it is: it survives a reload, not a new
 *            browser. That is an acceptable trade for a free trial of a
 *            feature that costs the product nothing to serve, and it is the
 *            only option that keeps an anonymous run entirely on-device.
 *
 *   account  a row per run in Postgres, read and written through
 *            /api/v1/pro-trial. Authoritative, and follows the person across
 *            devices, which is why a signed-in visitor uses it in preference.
 *
 * NOTHING ABOUT THE DOCUMENT CROSSES EITHER BOUNDARY. The account calls send
 * an empty body and receive a count; there is no text, no hash and no word
 * count anywhere in this module. tests/product-constraints.test.ts asserts it.
 */

import { proTrialStatus, recordProTrialRun, type ProTrialStatus } from './pro-trial'

const STORAGE_KEY = 'wmrp.pro-trial.runs.v1'

export type TrialScope = 'device' | 'account'

export interface TrialSnapshot {
  scope: TrialScope
  status: ProTrialStatus
}

/* ------------------------------------------------------------------ device */

function readDeviceRuns(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
  } catch {
    // Private mode, disabled storage, or a corrupted value. Treat as "no runs
    // recorded", which errs toward giving the visitor their trial rather than
    // withholding it over a storage failure that is not their fault.
    return []
  }
}

function writeDeviceRuns(runs: string[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(runs))
  } catch {
    // Nothing useful to do. The run happens either way; it just is not counted.
  }
}

export function deviceTrialStatus(now: Date = new Date()): ProTrialStatus {
  return proTrialStatus(readDeviceRuns(), now)
}

export function claimDeviceTrialRun(now: Date = new Date()): ProTrialStatus {
  const next = recordProTrialRun(readDeviceRuns(), now)
  writeDeviceRuns(next)
  return proTrialStatus(next, now)
}

/* ----------------------------------------------------------------- account */

/** The response /api/v1/pro-trial returns. Kept here so the route and the caller agree. */
export interface ProTrialResponse {
  scope: TrialScope
  /** True for a paying subscriber: the weekly allowance does not apply to them. */
  unlimited?: boolean
  /**
   * Whether THIS request was allowed to spend a run. Only present on POST, and
   * stated explicitly because the remaining counts look identical after a
   * successful claim and after a refusal.
   */
  granted?: boolean
  status: ProTrialStatus
}

const isTrialResponse = (value: unknown): value is ProTrialResponse =>
  typeof value === 'object' &&
  value !== null &&
  'status' in value &&
  typeof (value as ProTrialResponse).status?.entitled === 'boolean'

/**
 * Read the account-scoped allowance.
 *
 * Returns null, not a fabricated allowance, when the endpoint is
 * unreachable, unauthenticated or this deployment has no database. The caller
 * then falls back to the device scope, which is the correct behaviour for a
 * visitor who is not signed in and the safe behaviour for one who is.
 */
export async function fetchAccountTrial(): Promise<ProTrialResponse | null> {
  try {
    const res = await fetch('/api/v1/pro-trial', { method: 'GET', cache: 'no-store' })
    if (!res.ok) return null
    const body: unknown = await res.json()
    return isTrialResponse(body) ? body : null
  } catch {
    return null
  }
}

/**
 * Spend one account-scoped run.
 *
 * 429 is read, not discarded: it is the server saying definitively that the
 * allowance is spent, and its body carries the reset time. Only a genuine
 * failure (network, 5xx, an unrecognisable body) returns null, which is the
 * caller's signal to fall back to the device scope rather than to assume
 * either outcome.
 */
export async function claimAccountTrialRun(): Promise<ProTrialResponse | null> {
  try {
    const res = await fetch('/api/v1/pro-trial', { method: 'POST', cache: 'no-store' })
    if (!res.ok && res.status !== 429) return null
    const body: unknown = await res.json()
    return isTrialResponse(body) ? body : null
  } catch {
    return null
  }
}
