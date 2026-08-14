'use client'

import { useEffect, useState } from 'react'
import { formatBudgetStatus } from '@/lib/calibrate/metering'

/**
 * Display daily budget usage and remaining quota.
 */
export function BudgetStatus() {
  const [budget, setBudget] = useState<Awaited<ReturnType<typeof formatBudgetStatus>> | null>(
    null
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadBudget = async () => {
      try {
        const status = await formatBudgetStatus(false) // false = free tier
        setBudget(status)
      } catch (err) {
        console.error('Failed to load budget status:', err)
      } finally {
        setLoading(false)
      }
    }

    loadBudget()

    // Refresh budget every minute
    const interval = setInterval(loadBudget, 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading || !budget) {
    return null
  }

  const percentUsed = budget.percentage
  const isNearLimit = percentUsed > 80
  const isAtLimit = percentUsed >= 100

  return (
    <div
      className={`rounded-lg p-4 ${
        isAtLimit
          ? 'border border-signal-200 bg-signal-50'
          : isNearLimit
            ? 'border border-warn-200 bg-warn-50'
            : 'border border-ink-200 bg-white'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-ink-600">Daily Quota</p>
          <p className="mt-1 text-sm text-ink-900">
            {budget.used.toLocaleString()} / {budget.limit.toLocaleString()} words used
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-ink-900">{budget.percentage}%</p>
          <p className="text-xs text-ink-600">Resets in {budget.timeUntilReset}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-200">
        <div
          className={`h-full transition-all ${
            isAtLimit
              ? 'bg-signal-600'
              : isNearLimit
                ? 'bg-warn-600'
                : 'bg-seal-600'
          }`}
          style={{ width: `${Math.min(percentUsed, 100)}%` }}
        />
      </div>

      {/* Message */}
      {isAtLimit && (
        <p className="mt-2 text-xs text-signal-700">
          Daily limit reached. Your quota resets tomorrow. Consider upgrading to API access for higher limits.
        </p>
      )}
      {isNearLimit && !isAtLimit && (
        <p className="mt-2 text-xs text-ink-600">
          You're approaching your daily limit. {budget.remaining.toLocaleString()} words remaining.
        </p>
      )}
    </div>
  )
}
