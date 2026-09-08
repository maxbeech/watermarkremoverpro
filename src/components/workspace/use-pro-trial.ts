'use client'

import { useCallback, useEffect, useState } from 'react'
import { proTrialStatus, type ProTrialStatus } from '@/lib/entitlements/pro-trial'
import {
  claimAccountTrialRun,
  claimDeviceTrialRun,
  deviceTrialStatus,
  fetchAccountTrial,
  type TrialScope,
} from '@/lib/entitlements/pro-trial-store'

export interface ProTrialHandle {
  /** Null until the first read resolves, so the UI can say "checking" rather than guess. */
  status: ProTrialStatus | null
  scope: TrialScope
  /** True for a paying subscriber; the allowance does not apply to them at all. */
  unlimited: boolean
  loading: boolean
  /**
   * Spend a run. Returns whether the Pro engine may proceed. Called at the
   * moment a Pro rewrite actually starts, never on page load, so opening the
   * page does not silently burn someone's weekly allowance.
   */
  claim: () => Promise<boolean>
}

/**
 * The weekly Pro-engine allowance, resolved for whoever is currently looking
 * at the page.
 *
 * Prefers the account scope when the visitor is signed in and the endpoint
 * answers, because that allowance follows them between devices; falls back to
 * the device scope otherwise. `subscriber` short-circuits both: someone paying
 * for Pro never touches the trial ledger.
 */
export function useProTrial({ subscriber }: { subscriber: boolean }): ProTrialHandle {
  const [status, setStatus] = useState<ProTrialStatus | null>(null)
  const [scope, setScope] = useState<TrialScope>('device')
  const [unlimited, setUnlimited] = useState(subscriber)
  const [loading, setLoading] = useState(!subscriber)

  useEffect(() => {
    if (subscriber) {
      setUnlimited(true)
      setLoading(false)
      return
    }

    let live = true
    void (async () => {
      const account = await fetchAccountTrial()
      if (!live) return
      if (account && account.scope === 'account') {
        setScope('account')
        setUnlimited(Boolean(account.unlimited))
        setStatus(account.status)
      } else {
        setScope('device')
        setStatus(deviceTrialStatus())
      }
      setLoading(false)
    })()

    return () => {
      live = false
    }
  }, [subscriber])

  const claim = useCallback(async (): Promise<boolean> => {
    if (subscriber || unlimited) return true

    if (scope === 'account') {
      const result = await claimAccountTrialRun()
      if (result && result.scope === 'account') {
        setUnlimited(Boolean(result.unlimited))
        setStatus(result.status)
        return Boolean(result.unlimited) || result.granted === true
      }
      // The endpoint failed rather than refused. Fall through to the device
      // count instead of denying a run over an outage the visitor did not cause.
    }

    const before = deviceTrialStatus()
    if (!before.entitled) {
      setStatus(before)
      return false
    }
    setStatus(claimDeviceTrialRun())
    return true
  }, [scope, subscriber, unlimited])

  return { status, scope, unlimited, loading, claim }
}

/** Exported for the tests: the status a fresh visitor should see. */
export const freshTrialStatus = (): ProTrialStatus => proTrialStatus([])
