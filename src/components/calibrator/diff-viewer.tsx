'use client'

import { useMemo, useState } from 'react'
import type { Substitution } from '@/lib/calibrate'
import { tokenize } from '@/lib/detector/tokenize'
import { SubstitutionDetail } from './substitution-detail'

/**
 * Side-by-side diff viewer showing original vs. calibrated text.
 * Highlights changed words with color-coded confidence levels.
 * Allows interactive selection and alternative synonym choices.
 */
export function DiffViewer({
  original,
  substitutions,
  onSubstitutionChange,
}: {
  original: string
  substitutions: Substitution[]
  onSubstitutionChange?: (index: number, newReplacement: string) => void
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  // Build substitution map for quick lookup
  const substMap = useMemo(() => {
    const map = new Map<number, Substitution>()
    substitutions.forEach((sub) => {
      if (sub.reason === 'synonym') {
        map.set(sub.index, sub)
      }
    })
    return map
  }, [substitutions])

  const tokens = useMemo(() => tokenize(original), [original])

  // Determine line breaks for synchronized display
  const lineGroups = useMemo(() => {
    const groups: number[][] = [[]]
    let lineLength = 0

    for (let i = 0; i < tokens.length; i++) {
      groups[groups.length - 1].push(i)
      lineLength += tokens[i].raw.length

      // Break at ~60 characters or newlines
      if (lineLength > 60 || tokens[i].raw.includes('\n')) {
        groups.push([])
        lineLength = 0
      }
    }

    return groups.filter((g) => g.length > 0)
  }, [tokens])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <p className="t-eyebrow mb-2">Comparison</p>
        <h3 className="t-heading text-ink-900">What changed</h3>
      </div>

      {/* Diff Container */}
      <div className="overflow-hidden rounded-lg border border-ink-200 bg-white shadow-[var(--shadow-panel)]">
        <div className="grid grid-cols-1 divide-y divide-ink-200 md:grid-cols-2 md:divide-x md:divide-y-0">
          {/* Left: Original */}
          <div className="overflow-x-auto p-4">
            <p className="mb-3 text-xs font-medium text-ink-600">ORIGINAL</p>
            <div className="font-mono text-sm leading-relaxed text-ink-900">
              {lineGroups.map((lineTokens, lineIdx) => (
                <div key={lineIdx} className="flex flex-wrap gap-1">
                  {lineTokens.map((tokenIdx) => {
                    const token = tokens[tokenIdx]
                    return (
                      <span
                        key={tokenIdx}
                        className="inline-flex items-baseline"
                        onMouseEnter={() => setHoveredIndex(tokenIdx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      >
                        <span className="text-ink-900">{token.raw}</span>
                        {tokenIdx < lineTokens.length - 1 && <span className="w-1" />}
                      </span>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Revised */}
          <div className="overflow-x-auto p-4">
            <p className="mb-3 text-xs font-medium text-ink-600">CALIBRATED</p>
            <div className="font-mono text-sm leading-relaxed text-ink-900">
              {lineGroups.map((lineTokens, lineIdx) => (
                <div key={lineIdx} className="flex flex-wrap gap-1">
                  {lineTokens.map((tokenIdx) => {
                    const token = tokens[tokenIdx]
                    const subst = substMap.get(tokenIdx)
                    const isHovered = hoveredIndex === tokenIdx
                    const isSelected = selectedIndex === tokenIdx

                    return (
                      <span key={tokenIdx} className="inline-flex items-baseline">
                        <button
                          onClick={() => setSelectedIndex(isSelected ? null : tokenIdx)}
                          onMouseEnter={() => setHoveredIndex(tokenIdx)}
                          onMouseLeave={() => setHoveredIndex(null)}
                          className={`px-1 transition-colors ${
                            subst
                              ? `cursor-pointer rounded ${
                                  isSelected
                                    ? 'bg-seal-200 text-seal-900'
                                    : isHovered
                                      ? 'bg-seal-100 text-seal-900'
                                      : 'bg-seal-50 text-seal-700'
                                }`
                              : 'text-ink-400'
                          }`}
                          title={subst ? `Changed from: ${subst.original}` : ''}
                        >
                          {subst ? subst.replacement : token.raw}
                        </button>
                        {tokenIdx < lineTokens.length - 1 && <span className="w-1" />}
                      </span>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Selection Detail Panel */}
      {selectedIndex !== null && substMap.get(selectedIndex) && (
        <SubstitutionDetail
          substitution={substMap.get(selectedIndex)!}
          onApply={(newValue) => {
            onSubstitutionChange?.(selectedIndex, newValue)
            setSelectedIndex(null)
          }}
          onClose={() => setSelectedIndex(null)}
        />
      )}

      {/* Legend */}
      <div className="flex gap-4 text-xs text-ink-600">
        <div className="flex items-center gap-2">
          <span className="inline-block h-4 w-8 rounded bg-seal-100" />
          <span>Changed words (click to review)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-4 w-8 rounded bg-ink-50" />
          <span>Unchanged</span>
        </div>
      </div>
    </div>
  )
}

