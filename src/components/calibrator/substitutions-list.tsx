'use client'

import { useState } from 'react'
import type { Substitution } from '@/lib/calibrate'

/**
 * List view of all substitutions for review and bulk actions.
 */
export function SubstitutionsList({
  substitutions,
  appliedCount,
}: {
  substitutions: Substitution[]
  appliedCount: number
}) {
  const [expanded, setExpanded] = useState(false)

  const applied = substitutions.filter((s) => s.reason === 'synonym')
  const skipped = substitutions.filter((s) => s.reason !== 'synonym')

  if (substitutions.length === 0) {
    return null
  }

  return (
    <div className="rounded-lg border border-ink-200 bg-white shadow-[var(--shadow-panel)]">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-5 hover:bg-ink-50"
      >
        <div className="text-left">
          <p className="text-sm font-medium text-ink-900">
            {applied.length} substitution{applied.length !== 1 ? 's' : ''} found
          </p>
          <p className="text-xs text-ink-600">
            {appliedCount} accepted • {applied.length - appliedCount} declined
          </p>
        </div>
        <span className={`text-lg text-ink-600 transition-transform ${expanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* Details */}
      {expanded && (
        <div className="space-y-1 border-t border-ink-200 p-5">
          {applied.map((subst, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded px-3 py-2 hover:bg-ink-50"
            >
              <div className="flex-1 font-mono text-xs">
                <span className="text-ink-400">{subst.original}</span>
                <span className="text-ink-300"> → </span>
                <span className="font-medium text-seal-700">{subst.replacement}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-xs font-medium text-ink-600">
                    {(subst.confidence * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="w-12 rounded-full bg-ink-200">
                  <div
                    className="h-1.5 rounded-full bg-seal-600"
                    style={{ width: `${subst.confidence * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Skipped info */}
          {skipped.length > 0 && (
            <div className="mt-4 border-t border-ink-200 pt-3">
              <p className="text-xs font-medium text-ink-600">
                {skipped.length} word{skipped.length !== 1 ? 's' : ''} skipped
              </p>
              <ul className="mt-2 space-y-1 text-xs text-ink-500">
                {skipped.slice(0, 3).map((subst, idx) => (
                  <li key={idx} className="ml-2">
                    • <span className="font-mono">{subst.original}</span> ({subst.reason})
                  </li>
                ))}
                {skipped.length > 3 && (
                  <li className="ml-2">• +{skipped.length - 3} more</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
