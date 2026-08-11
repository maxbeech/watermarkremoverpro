'use client'

import { useState } from 'react'
import type { AnalysisResult } from '@/lib/detector'
import { MeasureHeader, PassageRow } from './measures'

/**
 * Per-passage attribution.
 *
 * The honest version of this feature is much quieter than the usual "AI
 * highlighter". Two rules make it defensible:
 *
 *  1. A passage is only presented as a finding if it survives the
 *     false-discovery-rate correction across every passage tested. On a
 *     1,000-word document that is dozens of simultaneous tests, and the
 *     uncorrected version would light up two or three sentences of anybody's
 *     writing, which is exactly the false accusation this product exists to
 *     help people answer.
 *
 *  2. Passages that were tested and did NOT survive are still shown, greyed,
 *     with their numbers. Hiding them would leave the user unable to see how
 *     little separates a "finding" from the rest of their document.
 */
export function PassageBreakdown({ result }: { result: AnalysisResult }) {
  const [showAll, setShowAll] = useState(false)
  const correction = result.passageCorrection
  const flagged = result.passages.filter((p) => p.survivesCorrection)
  const visible = showAll ? result.passages : flagged.length > 0 ? flagged : result.passages.slice(0, 5)

  return (
    <section className="overflow-hidden rounded-[4px] border border-ink-200 bg-white shadow-[var(--shadow-panel)]">
      <MeasureHeader
        eyebrow="Attribution"
        title="Per-passage breakdown"
        note={
          correction
            ? `${correction.tested} passages tested. ${correction.survived} survived false-discovery-rate correction at ${correction.fdr} (${correction.method}).`
            : 'No passage was long enough to carry its own test. Nothing is attributed.'
        }
      />

      <div className="divide-y divide-ink-100">
        {visible.map((p) => (
          <PassageRow key={p.index} passage={p} />
        ))}
      </div>

      {result.passages.length > visible.length && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="w-full border-t border-ink-100 px-5 py-3.5 text-sm text-ink-500 transition-colors duration-150 hover:bg-seal-50 hover:text-seal-700"
        >
          Show all {result.passages.length} passages and their numbers
        </button>
      )}
    </section>
  )
}
