'use client'

import { useState } from 'react'
import type { Substitution } from '@/lib/calibrate'

/**
 * Detail panel for a single substitution.
 * Shows alternatives and allows selection.
 */
export function SubstitutionDetail({
  substitution,
  onApply,
  onClose,
}: {
  substitution: Substitution
  onApply: (value: string) => void
  onClose: () => void
}) {
  const [selected, setSelected] = useState(substitution.replacement)

  const allOptions = [
    substitution.original,
    substitution.replacement,
    ...(substitution.alternatives || []),
  ].filter((v, i, a) => a.indexOf(v) === i) // Unique

  return (
    <div className="rounded-[var(--radius-panel)] border border-seal-200 bg-seal-50 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-seal-600">SUBSTITUTION REVIEW</p>
          <p className="mt-2 font-mono text-sm text-seal-900">
            <span className="line-through opacity-50">{substitution.original}</span> →{' '}
            <span className="font-bold">{substitution.replacement}</span>
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-seal-600 hover:text-seal-700"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Confidence indicator */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-seal-700">
          <span>Confidence</span>
          <span>{(substitution.confidence * 100).toFixed(0)}%</span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-seal-200">
          <div
            className="h-full bg-seal-600 transition-all"
            style={{ width: `${substitution.confidence * 100}%` }}
          />
        </div>
      </div>

      {/* Alternatives */}
      {allOptions.length > 1 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-seal-700">Other options</p>
          <div className="mt-2 space-y-2">
            {allOptions.map((option) => (
              <label key={option} className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="substitution"
                  value={option}
                  checked={selected === option}
                  onChange={(e) => setSelected(e.target.value)}
                  className="cursor-pointer"
                />
                <span
                  className={`text-sm ${
                    selected === option
                      ? 'font-medium text-seal-900'
                      : 'text-seal-700'
                  }`}
                >
                  {option}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onApply(selected)}
          className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] bg-seal-600 px-4 py-2 text-xs font-medium text-white shadow-[var(--shadow-panel)] transition-[background-color,box-shadow] hover:bg-seal-700 hover:shadow-[var(--shadow-raised)] active:translate-y-[0.5px]"
        >
          Accept
        </button>
        <button
          onClick={() => {
            setSelected(substitution.original)
            onApply(substitution.original)
          }}
          className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] border border-ink-200 bg-white px-4 py-2 text-xs font-medium text-ink-700 shadow-[var(--shadow-panel)] transition-[background-color,border-color] hover:border-seal-300 hover:bg-seal-50 hover:text-seal-700"
        >
          Revert
        </button>
      </div>
    </div>
  )
}
