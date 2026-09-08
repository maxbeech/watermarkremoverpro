/**
 * The measurement band. This is the product's signature shape and it is the
 * same component on the marketing site and inside a real result, which is the
 * point: what a visitor is shown before they run a check is the thing they get
 * after they run one.
 *
 * A band is four marks on one track:
 *   - the track, spanning the full domain of the statistic
 *   - a hatched region covering the uncertainty interval, where one exists
 *   - a chance line, the value the statistic takes when nothing is there
 *   - a hard marker at the measured value
 *
 * Rendered as plain SVG with no client JavaScript so it can appear in server
 * components, in pSEO pages and inside the app result identically.
 *
 * Honesty rules carried by the component itself, not by its callers:
 *   - a null value renders no marker at all, never a marker at zero
 *   - a missing interval renders no hatched region, never a hairline pretending
 *     to be a measured band
 */

export type BandTone = 'seal' | 'signal' | 'muted'

const TONES: Record<BandTone, { mark: string; fill: string; track: string; hatch: string }> = {
  seal: {
    mark: 'var(--color-seal-600)',
    fill: 'var(--color-seal-500)',
    track: 'var(--color-seal-100)',
    hatch: 'var(--color-seal-300)',
  },
  signal: {
    mark: 'var(--color-signal-700)',
    fill: 'var(--color-signal-500)',
    track: 'var(--color-signal-100)',
    hatch: 'var(--color-signal-400)',
  },
  muted: {
    mark: 'var(--color-ink-500)',
    fill: 'var(--color-ink-400)',
    track: 'var(--color-ink-100)',
    hatch: 'var(--color-ink-300)',
  },
}

export type BandProps = {
  /** Measured value. Null renders the track and the chance line only. */
  value: number | null | undefined
  min: number
  max: number
  /** Uncertainty interval. Omit entirely where none could be computed. */
  low?: number | null
  high?: number | null
  /** The value this statistic takes when there is nothing to find. */
  reference?: number | null
  tone?: BandTone
  height?: number
  /** Settle the marker into place on first paint. Off inside dense tables. */
  animate?: boolean
  className?: string
  /** Screen-reader description; the visual marks are decorative on their own. */
  title?: string
}

export function Band({
  value,
  min,
  max,
  low,
  high,
  reference,
  tone = 'seal',
  height = 10,
  animate = false,
  className = '',
  title,
}: BandProps) {
  const c = TONES[tone]
  const span = max - min || 1
  const pct = (n: number) => Math.min(100, Math.max(0, ((n - min) / span) * 100))

  const hasValue = value !== null && value !== undefined && Number.isFinite(value)
  const hasInterval =
    low !== null && low !== undefined && high !== null && high !== undefined &&
    Number.isFinite(low) && Number.isFinite(high)
  const hasReference =
    reference !== null && reference !== undefined && Number.isFinite(reference)

  return (
    <div
      className={`relative w-full ${className}`}
      style={{ height }}
      role="img"
      aria-label={title ?? 'measurement band'}
    >
      {/* track */}
      <div
        className="absolute inset-x-0 top-0 bottom-0 rounded-[2px]"
        style={{ backgroundColor: c.track }}
      />

      {/* uncertainty interval, hatched so it can never be mistaken for the
          measured value itself */}
      {hasInterval && (
        <div
          className={`hatch absolute top-0 bottom-0 ${animate ? 'mw-settle' : ''}`}
          style={{
            left: `${pct(low as number)}%`,
            width: `${Math.max(0.4, pct(high as number) - pct(low as number))}%`,
            color: c.hatch,
          }}
        />
      )}

      {/* chance line */}
      {hasReference && (
        <div
          className="absolute top-[-3px] bottom-[-3px] w-px"
          style={{ left: `${pct(reference as number)}%`, backgroundColor: 'var(--color-ink-400)' }}
        />
      )}

      {/* the measured value */}
      {hasValue && (
        <div
          className={`absolute top-[-3px] bottom-[-3px] w-[3px] rounded-[1px] ${animate ? 'mw-mark-in' : ''}`}
          style={{ left: `calc(${pct(value as number)}% - 1.5px)`, backgroundColor: c.mark }}
        />
      )}
    </div>
  )
}

/**
 * A short accent rule under a heading.
 *
 * This USED to be a miniature measurement band, marker and hatching and all,
 * used as page furniture on forty pages that carry no measurement. That was
 * the single biggest reason unrelated pages read as lab reports: the graphic
 * that means "here is a statistic" appeared under headings where there was no
 * statistic, so it meant nothing and just added noise.
 *
 * It is now a plain two-tone rule in the same tone families. The name, props
 * and every call site are unchanged deliberately, so this is one edit rather
 * than a sweep through every content page, and `Band` above stays the one
 * component that draws a real measurement.
 */
export function BandRule({
  at = 62,
  tone = 'seal',
  className = '',
}: {
  /** Where the accent segment sits along the rule, as a percentage. */
  at?: number
  tone?: BandTone
  className?: string
}) {
  const c = TONES[tone]
  return (
    <div className={`relative h-[3px] w-full overflow-hidden rounded-full ${className}`} aria-hidden="true">
      <div className="absolute inset-0 rounded-full" style={{ backgroundColor: c.track }} />
      <div
        className="absolute inset-y-0 rounded-full"
        style={{ left: `${Math.max(0, Math.min(70, at - 14))}%`, width: '30%', backgroundColor: c.fill }}
      />
    </div>
  )
}
