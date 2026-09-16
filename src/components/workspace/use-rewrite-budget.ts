'use client'

import { useCallback, useEffect, useState } from 'react'
import { canAffordRewrite, type RewriteBudgetStatus } from '@/lib/entitlements/rewrite-budget'
import { readRewriteBudget, spendRewriteBudget } from '@/lib/entitlements/rewrite-budget-store'
import { track } from '@/lib/openhelm-analytics'

export interface RewriteBudgetHandle {
  /** Null until the first read resolves, so the UI can say "checking" rather than guess. */
  status: RewriteBudgetStatus | null
  /** True for a paying subscriber: the budget does not apply to them at all. */
  unlimited: boolean
  loading: boolean
  /**
   * Charge a rewrite of `tokens` tokens. Returns whether it may proceed.
   *
   * Called at the moment a rewrite actually starts, never on page load, so
   * opening the workspace does not silently spend someone's allowance.
   */
  spend: (tokens: number) => boolean
}

/**
 * The free weekly correction budget, for whoever is looking at the page.
 *
 * Read on mount from this browser's own ledger (see rewrite-budget-store), and
 * short-circuited entirely for a subscriber, who has no budget to read. There
 * is no request here and no loading state that depends on one: `loading` is
 * true only for the single tick before the first synchronous read lands, which
 * exists so the UI never renders a full allowance it has not actually read.
 *
 * Checking is not metered anywhere in this hook or anything it calls. Only
 * correction is.
 */
export function useRewriteBudget({ subscriber }: { subscriber: boolean }): RewriteBudgetHandle {
  const [status, setStatus] = useState<RewriteBudgetStatus | null>(null)
  const [loading, setLoading] = useState(!subscriber)

  useEffect(() => {
    if (subscriber) {
      setStatus(null)
      setLoading(false)
      return
    }
    // localStorage is not available during server rendering, so the first read
    // happens here rather than in the initial state.
    setStatus(readRewriteBudget())
    setLoading(false)
  }, [subscriber])

  const spend = useCallback(
    (tokens: number): boolean => {
      if (subscriber) return true

      const before = readRewriteBudget()
      if (!canAffordRewrite(before, tokens)) {
        setStatus(before)
        track('rewrite_budget_exhausted')
        return false
      }

      setStatus(spendRewriteBudget(tokens))
      return true
    },
    [subscriber],
  )

  return { status, unlimited: subscriber, loading, spend }
}
