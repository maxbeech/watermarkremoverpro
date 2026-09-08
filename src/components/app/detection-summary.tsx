'use client'

import type { RewriteResult } from '@/lib/rewrite'
import { Band } from '@/components/brand/band'
import { summariseRun } from '@/lib/workspace/runs'

/**
 * How much AI evidence was found, and how much of it is left.
 *
 * This is the whole of the measurement that stays on screen. Everything else
 * (the keyed watermark tests, the style-distance channel, the per-signal
 * breakdown, the per-passage arithmetic) is real and is one click away in the
 * deep dive, but it is not what someone who just pasted a draft is asking, and
 * putting four panels of statistics above the text was the single biggest
 * reason the old result screen read as a lab report.
 *
 * Every figure below comes from `summariseRun`, which reads the result the
 * engine returned. A figure that could not be measured renders as the reason it
 * could not be measured, never as a zero.
 */
export function DetectionSummary({ result }: { result: RewriteResult }) {
  const summary = summariseRun(result)
  const likelihood = summary.likelihoodAfter
  const detail = result.documentAfter?.aiLikelihood?.detail ?? null

  return (
    <section className="overflow-hidden rounded-[var(--radius-panel)] border border-ink-200 bg-white">
      <header className="border-b border-ink-100 px-5 py-3.5">
        <h2 className="t-heading text-ink-900">What the detector finds now</h2>
        <p className="mt-0.5 text-[13px] text-ink-500">
          Measured on the rewritten text, by the same engine that decided what to change.
        </p>
      </header>

      <div className="grid gap-6 px-5 py-5 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        {/* --------------------------------------------------- the headline */}
        <div>
          <p className="t-eyebrow text-ink-500">AI-style likelihood</p>
          {likelihood === null ? (
            <>
              <p className="figure mt-2 text-2xl text-ink-500">not computed</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                {detail ?? 'This document is too short for the sentence-rhythm and per-word rates this channel is built on.'}
              </p>
            </>
          ) : (
            <>
              <p className="mt-1.5 flex items-baseline gap-2">
                <span
                  className={
                    'figure text-5xl leading-none ' +
                    (summary.band === 'high' || summary.band === 'elevated'
                      ? 'text-signal-700'
                      : 'text-mint-700')
                  }
                >
                  {likelihood}
                </span>
                <span className="text-lg text-ink-400">/ 100</span>
                <span className="rounded-full bg-ink-100 px-2.5 py-1 text-[12px] font-semibold uppercase tracking-wide text-ink-700">
                  {summary.band}
                </span>
              </p>

              <Band
                value={likelihood}
                reference={0}
                min={0}
                max={100}
                tone={summary.band === 'high' || summary.band === 'elevated' ? 'signal' : 'seal'}
                className="mt-4"
                title={`AI-style likelihood ${likelihood} of 100`}
              />

              {summary.likelihoodBefore !== null && (
                <p className="figure mt-3 text-sm text-ink-600">
                  {summary.likelihoodBefore} before the rewrite{' '}
                  <span aria-hidden="true">→</span> {likelihood} after
                  {summary.likelihoodBefore > likelihood
                    ? `, down ${summary.likelihoodBefore - likelihood} points`
                    : summary.likelihoodBefore === likelihood
                      ? ', unchanged'
                      : `, up ${likelihood - summary.likelihoodBefore} points`}
                </p>
              )}

              <p className="mt-3 text-[13px] leading-relaxed text-ink-500">
                A count of surface habits common in current model output, deliberately tuned to
                flag rather than to clear. It is a prompt to look closer, not a verdict about how
                anything was written.
              </p>
            </>
          )}
        </div>

        {/* ------------------------------------------------------ the rest */}
        <dl className="grid gap-3 sm:grid-cols-2">
          <Figure
            label="Provenance mark"
            value={
              result.documentAfter
                ? summary.markDetected
                  ? 'found'
                  : 'none found'
                : 'not computed'
            }
            tone={summary.markDetected ? 'signal' : 'ink'}
            note={
              result.documentAfter
                ? `Under the ${result.documentAfter.watermark.keysTested.length} key${result.documentAfter.watermark.keysTested.length === 1 ? '' : 's'} this page holds. No model vendor publishes theirs.`
                : 'No analysis was produced for the rewritten text.'
            }
          />
          <Figure
            label="Passages a detector would flag"
            value={
              summary.survivedAfter === null
                ? 'not computed'
                : summary.survivedBefore === null
                  ? String(summary.survivedAfter)
                  : `${summary.survivedBefore} → ${summary.survivedAfter}`
            }
            tone={summary.survivedAfter ? 'signal' : 'mint'}
            note="Surviving correction for multiple comparisons across every passage."
          />
          <Figure
            label="Watermark signal (z)"
            value={
              summary.watermarkAfter === null
                ? 'not computed'
                : summary.watermarkBefore === null
                  ? summary.watermarkAfter.toFixed(2)
                  : `${summary.watermarkBefore.toFixed(2)} → ${summary.watermarkAfter.toFixed(2)}`
            }
            tone="ink"
            note="Zero is where the statistic sits when there is nothing to find."
          />
          <Figure
            label="What the rewrite changed"
            value={
              summary.passagesInDocument === null
                ? `${summary.passagesRewritten} passages`
                : `${summary.passagesRewritten} of ${summary.passagesInDocument} passages`
            }
            tone="mint"
            note={`Plus ${summary.tellSwaps.toLocaleString()} AI-tell swap${summary.tellSwaps === 1 ? '' : 's'} across the whole document, in ${
              summary.processingTimeMs < 1000
                ? `${Math.round(summary.processingTimeMs)}ms`
                : `${(summary.processingTimeMs / 1000).toFixed(1)}s`
            } on this device.`}
          />
        </dl>
      </div>
    </section>
  )
}

const FIGURE_TONES = {
  ink: 'border-ink-200 bg-ink-50 text-ink-800',
  mint: 'border-mint-200 bg-mint-100/60 text-mint-700',
  signal: 'border-signal-200 bg-signal-50 text-signal-800',
} as const

function Figure({
  label,
  value,
  note,
  tone,
}: {
  label: string
  value: string
  note: string
  tone: keyof typeof FIGURE_TONES
}) {
  return (
    <div className={`rounded-[var(--radius-control)] border px-4 py-3 ${FIGURE_TONES[tone]}`}>
      <dt className="t-eyebrow opacity-80">{label}</dt>
      <dd>
        <p className="figure mt-1 text-lg font-semibold">{value}</p>
        <p className="mt-1 text-[12px] leading-relaxed opacity-80">{note}</p>
      </dd>
    </div>
  )
}
