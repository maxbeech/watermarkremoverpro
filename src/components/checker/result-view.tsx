'use client'

import type { AnalysisResult } from '@/lib/detector'
import { ALPHA } from '@/lib/detector'
import { Band } from '@/components/brand/band'
import { LimitNote } from '@/components/brand/ui'
import { PassageBreakdown } from './passage-breakdown'
import { KeyMeasure, MeasureHeader, Stat, Verdict, featureLabel, fmt } from './measures'

/**
 * Rendering rules, which are product rules and not styling preferences:
 *
 *  - A null statistic renders as the reason it is null. Never as 0, never as a
 *    dash, never omitted. The user has to be able to tell "we measured this and
 *    it was zero" from "we could not measure this".
 *  - The watermark verdict is always shown with its coverage notice attached.
 *  - The style figure is always shown with the sentence saying it is not a
 *    provenance mark. It is the single most misreadable number in the product.
 *
 * The measurement blocks come from ./measures, which the marketing site renders
 * too, so a visitor is shown the real thing before they run a check.
 */
export function ResultView({ result }: { result: AnalysisResult }) {
  if (result.status !== 'ok') {
    return (
      <section className="rounded-[var(--radius-panel)] border border-ink-200 bg-white p-5 shadow-[var(--shadow-panel)]">
        <h2 className="t-heading text-ink-900">No result was produced</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">{result.detail}</p>
        {result.status === 'language_undetermined' && (
          <p className="mt-3 text-sm text-ink-500">
            Pick the language from the menu above and run the check again.
          </p>
        )}
      </section>
    )
  }

  const computed = result.watermark.results.filter((r) => r.status === 'computed')
  const detections = computed.filter((r) => r.pValue !== null && r.pValue < ALPHA)
  const dist = result.distribution

  return (
    <div className="mw-rise space-y-5">
      {/* ---------------------------------------------------------------- */}
      <section className="overflow-hidden rounded-[var(--radius-panel)] border border-ink-200 bg-white shadow-[var(--shadow-panel)]">
        <MeasureHeader
          eyebrow="Channel one"
          title="Provenance mark"
          note="A keyed statistical test, run once for each detection key this page holds."
        />

        <div className="px-5 py-5">
          <Verdict result={result} />

          <div className="mt-5 space-y-4">
            {result.watermark.results.map((r) => (
              <KeyMeasure
                key={r.keyId}
                result={r}
                detected={
                  detections.some((d) => d.keyId === r.keyId)
                }
                animate
              />
            ))}
          </div>

          <p className="mt-5 border-l-2 border-seal-500 bg-seal-50 px-4 py-3 text-sm leading-relaxed text-seal-700">
            {result.watermark.coverageNotice}
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="overflow-hidden rounded-[var(--radius-panel)] border border-ink-200 bg-white shadow-[var(--shadow-panel)]">
        <MeasureHeader
          eyebrow="Channel two"
          title="Style measurement"
          note="How far this document sits from contemporary reference prose in the same language."
        />

        <div className="px-5 py-5">
          {dist && dist.status === 'computed' ? (
            <>
              <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
                <Stat label="Distance from reference">
                  <span className="figure text-2xl leading-none">
                    {fmt(dist.compositeDeviation, 2)} <span className="text-base text-ink-400">SD</span>
                  </span>
                </Stat>
                <Stat label="Function-word distance">
                  <span className="figure text-2xl leading-none">
                    {fmt(dist.functionWordDeviation, 2)}{' '}
                    <span className="text-base text-ink-400">SD</span>
                  </span>
                </Stat>
                <Stat label="Measured over">
                  <span className="figure text-2xl leading-none">
                    {dist.tokens.toLocaleString()}
                  </span>
                  <span className="mt-1 block text-xs text-ink-400">
                    words in {dist.chunks} chunks
                  </span>
                </Stat>
              </div>

              <div className="mt-6">
                <Band
                  value={dist.compositeDeviation}
                  low={dist.compositeInterval?.low}
                  high={dist.compositeInterval?.high}
                  reference={0}
                  min={0}
                  max={5}
                  tone="seal"
                  height={12}
                  animate
                  title={`Style distance ${fmt(dist.compositeDeviation, 2)} standard deviations from reference`}
                />
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="t-eyebrow text-ink-400">0 SD</span>
                  <span className="t-eyebrow text-ink-400">
                    {dist.compositeInterval
                      ? `interval ${fmt(dist.compositeInterval.low, 2)} to ${fmt(dist.compositeInterval.high, 2)} SD`
                      : 'too few sentences to resample for a band'}
                  </span>
                  <span className="t-eyebrow text-ink-400">5 SD</span>
                </div>
              </div>

              <h3 className="t-eyebrow mt-8 text-ink-400">Largest deviations</h3>
              <ul className="mt-3 divide-y divide-ink-100 text-sm">
                {dist.features.slice(0, 5).map((f) => (
                  <li
                    key={f.feature}
                    className="flex items-baseline justify-between gap-4 py-2.5 transition-colors duration-150 hover:bg-ink-50"
                  >
                    <span className="text-ink-600">{featureLabel(f.feature)}</span>
                    <span className="figure text-ink-800">
                      {f.observed.toFixed(2)}{' '}
                      <span className="text-ink-400">
                        (reference {f.baselineMean.toFixed(2)}, {f.z > 0 ? '+' : ''}
                        {f.z.toFixed(2)} SD)
                      </span>
                    </span>
                  </li>
                ))}
              </ul>

              {dist.corpus && (
                <p className="mt-5 text-xs leading-relaxed text-ink-400">
                  Reference: {dist.corpus.documents.toLocaleString()} documents /{' '}
                  {dist.corpus.tokens.toLocaleString()} words of {dist.corpus.source},{' '}
                  {dist.corpus.license}, retrieved {dist.corpus.retrievedAt.slice(0, 10)}.
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-ink-600">{dist?.detail ?? 'No style measurement was made.'}</p>
          )}

          <div className="mt-5">
            <LimitNote>
              This is a measure of register, not of provenance. It does not detect AI and it is not
              evidence of who wrote the document. Technical writing, fiction, translated text and
              non-native prose all sit far from an encyclopaedic reference for entirely ordinary
              reasons.
            </LimitNote>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="overflow-hidden rounded-[var(--radius-panel)] border border-ink-200 bg-white shadow-[var(--shadow-panel)]">
        <MeasureHeader
          eyebrow="Channel three · heuristic"
          title="AI-style likelihood"
          note="Surface habits common in LLM output: dash-clause connectors, stock phrasing, elevated vocabulary and sentence-length uniformity. Not a statistical test and not a provenance mark."
        />

        <div className="px-5 py-5">
          {result.aiLikelihood?.status === 'computed' ? (
            <>
              <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
                <Stat label="AI-style likelihood">
                  <span
                    className={
                      'figure text-3xl leading-none ' +
                      (result.aiLikelihood.band === 'high' || result.aiLikelihood.band === 'elevated'
                        ? 'text-signal-700'
                        : 'text-ink-900')
                    }
                  >
                    {result.aiLikelihood.score}
                    <span className="text-base text-ink-400"> / 100</span>
                  </span>
                </Stat>
                <Stat label="Band">
                  <span className="text-base font-medium capitalize text-ink-800">
                    {result.aiLikelihood.band}
                  </span>
                </Stat>
                <Stat label="Measured over">
                  <span className="figure text-base">{result.aiLikelihood.wordsScored.toLocaleString()}</span>
                  <span className="ml-1 text-ink-400">words</span>
                </Stat>
              </div>

              <div className="mt-6">
                <Band
                  value={result.aiLikelihood.score}
                  reference={0}
                  min={0}
                  max={100}
                  tone={
                    result.aiLikelihood.band === 'high' || result.aiLikelihood.band === 'elevated'
                      ? 'signal'
                      : 'seal'
                  }
                  height={12}
                  animate
                  title={`AI-style likelihood ${result.aiLikelihood.score} of 100, band ${result.aiLikelihood.band}`}
                />
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="t-eyebrow text-ink-400">0 · low</span>
                  <span className="t-eyebrow text-ink-400">100 · high</span>
                </div>
              </div>

              <h3 className="t-eyebrow mt-8 text-ink-400">Signals measured</h3>
              <ul className="mt-3 divide-y divide-ink-100 text-sm">
                {result.aiLikelihood.signals.map((s) => (
                  <li key={s.id} className="py-2.5">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-ink-600">{s.label}</span>
                      <span className="figure text-ink-800">
                        {s.count.toLocaleString()}{' '}
                        <span className="text-ink-400">
                          ({s.ratePer500.toFixed(2)} per 500 words)
                        </span>
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-ink-400">{s.detail}</p>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-ink-600">
              {result.aiLikelihood?.detail ?? 'No AI-style likelihood score was produced.'}
            </p>
          )}

          <div className="mt-5">
            <LimitNote>
              This score is a heuristic, tuned to flag more real AI writing at the cost of
              occasionally flagging human writing that shares these surface habits. It is not a
              statistical test, it is not a provenance mark, and it carries none of the guarantees
              the channels above do. Treat a high score as a reason to look closer, not as a
              finding.
            </LimitNote>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <PassageBreakdown result={result} />

      {/* ---------------------------------------------------------------- */}
      <section className="overflow-hidden rounded-[var(--radius-panel)] border border-ink-200 bg-white shadow-[var(--shadow-panel)]">
        <MeasureHeader eyebrow="Attached to every result" title="Stated limits" />
        <ul className="space-y-3.5 px-5 py-5 text-sm leading-relaxed text-ink-600">
          {result.limits.map((limit, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-[9px] h-[3px] w-[3px] shrink-0 bg-ink-400" />
              <span>{limit}</span>
            </li>
          ))}
        </ul>
        <div className="border-t border-ink-100 bg-ink-50/60 px-5 py-4 text-xs text-ink-400">
          <p>
            Document SHA-256 <span className="figure break-all">{result.documentHash}</span>
          </p>
          <p className="mt-1">
            Analysed {result.analyzedAt} · engine {result.engineVersion} · language{' '}
            {result.language.name}{' '}
            ({result.language.determinedBy === 'caller' ? 'you chose it' : 'measured'})
          </p>
        </div>
      </section>
    </div>
  )
}
