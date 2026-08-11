'use client'

import { useState } from 'react'
import type { AnalysisResult } from '@/lib/detector'

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
 *     writing — which is exactly the false accusation this product exists to
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
    <section className="rounded-lg border border-ink-200 bg-white">
      <header className="border-b border-ink-100 px-5 py-4">
        <h2 className="font-serif text-lg text-ink-900">Per-passage breakdown</h2>
        {correction ? (
          <p className="mt-1 text-sm text-ink-500">
            {correction.tested} passages tested. {correction.survived} survived
            false-discovery-rate correction at {correction.fdr} ({correction.method}).
          </p>
        ) : (
          <p className="mt-1 text-sm text-ink-500">
            No passage was long enough to carry its own test. Nothing is attributed.
          </p>
        )}
      </header>

      <div className="divide-y divide-ink-100">
        {visible.map((p) => (
          <div key={p.index} className="px-5 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-xs uppercase tracking-wide text-ink-400">
                Passage {p.index + 1} · <span className="figure">{p.words}</span> words
              </span>
              <span
                className={
                  p.survivesCorrection
                    ? 'rounded bg-signal-100 px-2 py-0.5 text-xs font-medium text-signal-700'
                    : 'text-xs text-ink-400'
                }
              >
                {p.survivesCorrection ? 'carries signal after correction' : 'no finding'}
              </span>
            </div>

            <p
              className={
                p.survivesCorrection
                  ? 'mt-2 border-l-2 border-signal-500 bg-signal-100/40 py-1 pl-3 font-serif text-[15px] leading-relaxed text-ink-800'
                  : 'mt-2 font-serif text-[15px] leading-relaxed text-ink-500'
              }
            >
              {p.text}
            </p>

            <p className="mt-2 text-xs text-ink-400">
              watermark z <span className="figure">{num(p.watermarkZ)}</span> · p{' '}
              <span className="figure">{num(p.watermarkP, 4)}</span> · style distance{' '}
              <span className="figure">{num(p.styleDeviation)}</span>
              {p.styleDeviation === null && ' (passage too short to measure)'}
            </p>
          </div>
        ))}
      </div>

      {result.passages.length > visible.length && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="w-full border-t border-ink-100 px-5 py-3 text-sm text-ink-500 hover:bg-ink-50 hover:text-ink-800"
        >
          Show all {result.passages.length} passages and their numbers
        </button>
      )}
    </section>
  )
}

function num(value: number | null, digits = 2): string {
  return value === null || !Number.isFinite(value) ? 'not computed' : value.toFixed(digits)
}
