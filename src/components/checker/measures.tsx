import type { AnalysisResult, WatermarkChannelResult } from '@/lib/detector'
import type { PassageFinding } from '@/lib/detector'
import { Band } from '@/components/brand/band'
import { Eyebrow } from '@/components/brand/ui'

/**
 * The presentational vocabulary for a measurement.
 *
 * These components are the single source of truth for how a MarkWitness figure
 * looks, and they are used by BOTH the real result view in the app and the
 * specimen exhibits on the marketing site. That is deliberate: it makes it
 * impossible to show a visitor a marketing screenshot that the product cannot
 * actually produce, because the marketing screenshot IS the product's own
 * component rendering a real analysis.
 *
 * None of these use hooks, so a server component can render them at build time.
 *
 * The rendering rules below are product rules, not styling preferences:
 *  - A null statistic renders as the reason it is null. Never as 0, never as a
 *    dash, never omitted. "We measured this and it was zero" has to be
 *    distinguishable from "we could not measure this".
 *  - A band with no computed interval draws no hatched region.
 *  - Colour is meaning: signal amber appears if and only if a mark was found.
 */

/* -------------------------------------------------------------- formatting */

export function fmt(value: number | null | undefined, digits: number): string {
  return value === null || value === undefined || !Number.isFinite(value)
    ? 'not computed'
    : value.toFixed(digits)
}

export function fmtPct(value: number | null | undefined): string {
  return value === null || value === undefined || !Number.isFinite(value)
    ? 'not computed'
    : `${(value * 100).toFixed(1)}%`
}

export function fmtP(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'not computed'
  if (value < 1e-6) return '< 0.000001'
  return value.toFixed(6)
}

/* ------------------------------------------------------------------ pieces */

export function Stat({
  label,
  children,
  className = '',
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <dt className="t-eyebrow text-ink-400">{label}</dt>
      <dd className="mt-1.5 text-ink-800">{children}</dd>
    </div>
  )
}

/**
 * One detection key's result, rendered as the signature band with its figures.
 * This is the single most important block in the product.
 */
export function KeyMeasure({
  result,
  detected,
  animate = false,
}: {
  result: WatermarkChannelResult
  detected: boolean
  animate?: boolean
}) {
  const tone = detected ? 'signal' : 'seal'

  return (
    <div
      className={
        'rounded-[3px] border p-4 sm:p-5 ' +
        (detected ? 'border-signal-200 bg-signal-100/35' : 'border-ink-200 bg-ink-50/70')
      }
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-sm font-medium text-ink-800">{result.keyLabel}</p>
        <p className="t-eyebrow text-ink-400">
          {result.vendorPublished ? 'vendor-published key' : 'not a vendor key'}
        </p>
      </div>

      {result.status === 'computed' ? (
        <>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div>
              <p className="t-eyebrow text-ink-400">Green-list rate</p>
              <p
                className={
                  'figure mt-1.5 text-3xl leading-none ' +
                  (detected ? 'text-signal-700' : 'text-ink-900')
                }
              >
                {fmtPct(result.greenRate)}
              </p>
            </div>
            <dl className="flex flex-wrap gap-x-6 gap-y-3">
              <Stat label="Expected by chance">
                <span className="figure text-base">{fmtPct(result.expectedGreenRate)}</span>
              </Stat>
              <Stat label="z">
                <span className="figure text-base">{fmt(result.z, 2)}</span>
              </Stat>
              <Stat label="p (one-sided)">
                <span className="figure text-base">{fmtP(result.pValue)}</span>
              </Stat>
            </dl>
          </div>

          <div className="mt-5">
            <Band
              value={result.greenRate}
              low={result.greenRateInterval?.low}
              high={result.greenRateInterval?.high}
              reference={result.expectedGreenRate}
              min={0.25}
              max={0.85}
              tone={tone}
              height={12}
              animate={animate}
              title={`Green-list rate ${fmtPct(result.greenRate)} against ${fmtPct(
                result.expectedGreenRate,
              )} expected by chance`}
            />
            <div className="mt-2 flex items-baseline justify-between">
              <span className="t-eyebrow text-ink-300">25%</span>
              <span className="t-eyebrow text-ink-300">85%</span>
            </div>
            <p className="t-eyebrow mt-2.5 text-ink-400">
              {result.greenRateInterval
                ? `interval ${fmtPct(result.greenRateInterval.low)} to ${fmtPct(result.greenRateInterval.high)}`
                : 'no interval could be computed'}
            </p>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-ink-500">
            Measured over <span className="figure">{result.trials?.toLocaleString()}</span> distinct
            word pairs. Repeated pairs are counted once. The thin vertical line is the rate this
            statistic takes when no mark is present.
          </p>
        </>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-ink-600">{result.detail}</p>
      )}
    </div>
  )
}

/**
 * One passage row. Hovering surfaces its numbers slightly, which is the only
 * interaction in the result view: a reader scanning the document should be able
 * to move along it and read what each part measured.
 */
export function PassageRow({ passage }: { passage: PassageFinding }) {
  const flagged = passage.survivesCorrection
  return (
    <div
      className={
        'group px-5 py-4 transition-colors duration-150 ' +
        (flagged ? 'bg-signal-100/25 hover:bg-signal-100/45' : 'hover:bg-ink-50')
      }
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="t-eyebrow text-ink-400">
          Passage {passage.index + 1} · <span className="figure">{passage.words}</span> words
        </span>
        <span
          className={
            flagged
              ? 'rounded-[2px] bg-signal-500 px-2 py-0.5 text-[11px] font-medium tracking-wide text-white'
              : 't-eyebrow text-ink-300'
          }
        >
          {flagged ? 'carries signal after correction' : 'no finding'}
        </span>
      </div>

      <div className="mt-2.5 flex gap-3">
        <span
          aria-hidden="true"
          className={
            'w-[3px] shrink-0 rounded-[1px] transition-colors duration-150 ' +
            (flagged ? 'bg-signal-500' : 'bg-ink-200 group-hover:bg-seal-300')
          }
        />
        <p
          className={
            'font-serif text-[15px] leading-relaxed ' + (flagged ? 'text-ink-800' : 'text-ink-500')
          }
        >
          {passage.text}
        </p>
      </div>

      <p className="mt-2.5 pl-6 text-xs text-ink-400 transition-colors duration-150 group-hover:text-ink-600">
        watermark z <span className="figure">{fmt(passage.watermarkZ, 2)}</span> · p{' '}
        <span className="figure">{fmt(passage.watermarkP, 4)}</span> · style distance{' '}
        <span className="figure">{fmt(passage.styleDeviation, 2)}</span>
        {passage.styleDeviation === null && ' (passage too short to measure)'}
      </p>
    </div>
  )
}

/** The one-sentence verdict, with the count of keys it rests on. */
export function Verdict({ result }: { result: AnalysisResult }) {
  const computed = result.watermark.results.filter((r) => r.status === 'computed')
  const detected = result.watermark.anyDetected
  const n = result.watermark.results.filter(
    (r) => r.status === 'computed' && r.pValue !== null && r.pValue < 0.01,
  ).length

  return (
    <div className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className={
          'mt-[0.55rem] h-2 w-2 shrink-0 rounded-full ' +
          (detected ? 'bg-signal-500' : computed.length > 0 ? 'bg-seal-500' : 'bg-ink-300')
        }
      />
      <p className="t-heading text-ink-900">
        {detected
          ? `A mark was detected under ${n === 1 ? 'one key' : `${n} keys`}.`
          : computed.length > 0
            ? 'No mark was detected under the keys tested.'
            : 'The test could not run on this document.'}
      </p>
    </div>
  )
}

/** A labelled panel header used across every block of a result. */
export function MeasureHeader({
  eyebrow,
  title,
  note,
}: {
  eyebrow: string
  title: string
  note?: string
}) {
  return (
    <header className="border-b border-ink-100 px-5 py-4">
      <Eyebrow className="mb-2.5">{eyebrow}</Eyebrow>
      <h2 className="t-heading text-ink-900">{title}</h2>
      {note && <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{note}</p>}
    </header>
  )
}
