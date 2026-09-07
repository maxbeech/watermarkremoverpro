import type { AnalysisResult } from '@/lib/detector'
import { KeyMeasure, PassageRow, Verdict, fmt } from '@/components/checker/measures'
import { Band } from '@/components/brand/band'
import { Eyebrow } from '@/components/brand/ui'

/**
 * A product screen, framed.
 *
 * The contents are the app's own components rendering a real analysis computed
 * at build time, not an image and not a hand-written table. The frame is browser
 * chrome so a visitor reads it as "a screen of the thing" rather than as a
 * decorative panel, and the URL in the chrome is the route that would produce it.
 */
export function ExhibitFrame({
  url = 'watermarkremoverpro.com/check',
  caption,
  children,
  className = '',
  tilt = false,
}: {
  url?: string
  caption?: React.ReactNode
  children: React.ReactNode
  className?: string
  tilt?: boolean
}) {
  return (
    <figure className={`group/exhibit ${className}`}>
      <div
        className={
          'overflow-hidden rounded-[6px] border border-ink-200 bg-white shadow-[var(--shadow-exhibit)] ' +
          'transition-transform duration-500 ease-out ' +
          (tilt ? 'group-hover/exhibit:-translate-y-1' : '')
        }
      >
        {/* chrome */}
        <div className="flex items-center gap-3 border-b border-ink-200 bg-ink-100/80 px-3 py-2.5">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-ink-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-ink-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-ink-300" />
          </div>
          <div className="flex min-w-0 flex-1 items-center rounded-[3px] border border-ink-200 bg-white px-2.5 py-1">
            <span className="figure truncate text-[11px] text-ink-400">{url}</span>
          </div>
        </div>

        <div className="bg-white">{children}</div>
      </div>

      {caption && (
        <figcaption className="mt-3 text-xs leading-relaxed text-ink-400">{caption}</figcaption>
      )}
    </figure>
  )
}

/**
 * The result screen, compressed to the part that matters, rendered from a real
 * analysis. Used in the hero and in the feature sections.
 */
export function ResultExhibit({
  result,
  passages = 2,
  animate = false,
}: {
  result: AnalysisResult
  passages?: number
  animate?: boolean
}) {
  const key = result.watermark.results[0]
  const detected = result.watermark.anyDetected
  // Show the passages that actually survived correction first. An exhibit whose
  // verdict says a mark was found but whose passage list reads "no finding"
  // twice is a worse advertisement than no exhibit at all, and it also
  // misrepresents what the screen looks like in that case.
  const flagged = result.passages.filter((p) => p.survivesCorrection)
  const shown = [...flagged, ...result.passages.filter((p) => !p.survivesCorrection)].slice(
    0,
    passages,
  )

  return (
    <div>
      <div className="border-b border-ink-100 px-5 py-4">
        <Eyebrow tone={detected ? 'signal' : 'seal'}>Provenance mark</Eyebrow>
        <div className="mt-3">
          <Verdict result={result} />
        </div>
      </div>

      <div className="px-5 py-5">
        {key && <KeyMeasure result={key} detected={detected} animate={animate} />}
      </div>

      {shown.length > 0 && (
        <div className="border-t border-ink-100">
          <div className="px-5 pt-4">
            <Eyebrow tone="ink">
              Per-passage breakdown
              {result.passageCorrection
                ? ` · ${result.passageCorrection.survived} of ${result.passageCorrection.tested} survive correction`
                : ''}
            </Eyebrow>
          </div>
          <div className="mt-2 divide-y divide-ink-100">
            {shown.map((p) => (
              <PassageRow key={p.index} passage={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * The style channel, on its own. A second screen with a different shape, so the
 * marketing page is not three copies of the same exhibit.
 */
export function StyleExhibit({ result }: { result: AnalysisResult }) {
  const dist = result.distribution
  if (!dist || dist.status !== 'computed') {
    return (
      <div className="px-5 py-6">
        <p className="text-sm text-ink-600">{dist?.detail ?? 'No style measurement was made.'}</p>
      </div>
    )
  }

  return (
    <div className="px-5 py-5">
      <Eyebrow tone="ink">Style measurement · not a provenance mark</Eyebrow>

      <div className="mt-4 flex items-end gap-6">
        <div>
          <p className="figure text-3xl leading-none text-ink-900">
            {fmt(dist.compositeDeviation, 2)} <span className="text-lg text-ink-400">SD</span>
          </p>
          <p className="mt-1.5 text-xs text-ink-400">from contemporary reference prose</p>
        </div>
      </div>

      <div className="mt-5">
        <Band
          value={dist.compositeDeviation}
          low={dist.compositeInterval?.low}
          high={dist.compositeInterval?.high}
          reference={0}
          min={0}
          max={5}
          tone="seal"
          height={12}
          title={`Style distance ${fmt(dist.compositeDeviation, 2)} standard deviations from reference`}
        />
        <div className="mt-2 flex justify-between">
          <span className="t-eyebrow text-ink-300">0 SD</span>
          <span className="t-eyebrow text-ink-300">5 SD</span>
        </div>
      </div>

      <ul className="mt-5 divide-y divide-ink-100 text-sm">
        {dist.features.slice(0, 3).map((f) => (
          <li key={f.feature} className="flex items-baseline justify-between gap-4 py-2">
            <span className="text-ink-600">{f.feature}</span>
            <span className="figure text-ink-800">
              {f.observed.toFixed(2)}{' '}
              <span className="text-ink-400">
                ({f.z > 0 ? '+' : ''}
                {f.z.toFixed(2)} SD)
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
