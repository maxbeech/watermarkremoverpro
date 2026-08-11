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
 * A band reduced to a rule. Used as a section divider and under headings so the
 * signature is present on pages that carry no result of their own.
 */
export function BandRule({
  at = 62,
  tone = 'seal',
  className = '',
}: {
  at?: number
  tone?: BandTone
  className?: string
}) {
  const c = TONES[tone]
  return (
    <div className={`relative h-[6px] w-full ${className}`} aria-hidden="true">
      <div className="absolute inset-0 rounded-[1px]" style={{ backgroundColor: c.track }} />
      <div
        className="hatch absolute inset-y-0"
        style={{ left: `${Math.max(0, at - 14)}%`, width: '22%', color: c.hatch }}
      />
      <div
        className="absolute top-[-2px] bottom-[-2px] w-[3px] rounded-[1px]"
        style={{ left: `${at}%`, backgroundColor: c.mark }}
      />
    </div>
  )
}
