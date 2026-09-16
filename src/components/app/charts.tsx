/**
 * The small chart vocabulary the analysis column is drawn with.
 *
 * The analysis panel used to be five stacked prose panels, and a reader looking
 * for "is this better than it was" had to find the sentence that said so. These
 * are the shapes that answer it without a sentence: an arc for the headline, a
 * track for each channel with a ghost marker where the draft sat, and a delta
 * chip. Nothing here computes anything. Every value is passed in already
 * measured, and every one of them is `number | null`, because a channel that
 * could not be measured has to render as the reason it could not be, never as a
 * zero that looks like a clean result.
 *
 * Plain SVG and CSS, no charting library and no client hooks, so these can sit
 * in a server component unchanged if the analysis ever moves to one.
 */

export type ChartTone = 'signal' | 'seal' | 'mint' | 'ink'

export const CHART_TONES: Record<ChartTone, { stroke: string; text: string; track: string; soft: string }> = {
  signal: {
    stroke: 'var(--color-signal-500)',
    text: 'text-signal-700',
    track: 'var(--color-signal-100)',
    soft: 'bg-signal-50 text-signal-800',
  },
  seal: {
    stroke: 'var(--color-seal-500)',
    text: 'text-seal-700',
    track: 'var(--color-seal-100)',
    soft: 'bg-seal-50 text-seal-800',
  },
  mint: {
    stroke: 'var(--color-mint-500)',
    text: 'text-mint-700',
    track: 'var(--color-mint-100)',
    soft: 'bg-mint-100/70 text-mint-700',
  },
  ink: {
    stroke: 'var(--color-ink-400)',
    text: 'text-ink-700',
    track: 'var(--color-ink-100)',
    soft: 'bg-ink-100 text-ink-700',
  },
}

/* ------------------------------------------------------------------ gauge */

/**
 * A full ring, not a semicircle. An earlier version of this gauge computed
 * `arcPoint` over a fixed 180°-to-0° sweep, which is a half circle by
 * construction no matter what `t` was passed: `arcPath(0, 1)`, the "empty
 * track" every gauge draws first, always traced exactly that top half, so the
 * track itself appeared to open at the bottom with both rounded caps pointing
 * straight down. A `<circle>` with `stroke-dasharray`/`stroke-dashoffset` is
 * the correct primitive for "how far around a full ring", and it is what
 * both gauges below use: one continuous ring, filling clockwise from 12
 * o'clock, with no seam at any value including 100.
 */
const GAUGE_SIZE = 188
const GAUGE_C = GAUGE_SIZE / 2
const GAUGE_R = 80
const GAUGE_STROKE = 13
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_R

/** Rotates the ring's own coordinate space so 0% sits at 12 o'clock and fill runs clockwise. */
const GAUGE_ROTATE = `rotate(-90 ${GAUGE_C} ${GAUGE_C})`

/**
 * The headline ring: one measurement, 0 to 100, as far around as it got.
 *
 * `value` null draws the empty track and nothing else, and the caller renders
 * the reason beside it. There is no needle at zero for an unmeasured statistic:
 * "we could not measure this" and "we measured this and it was clean" are
 * opposite findings and must not share a picture.
 */
export function Gauge({
  value,
  tone,
  caption,
  suffix = '',
}: {
  value: number | null
  tone: ChartTone
  /** Short label under the number, e.g. the band name. */
  caption: string
  suffix?: string
}) {
  const t = value === null ? 0 : Math.min(1, Math.max(0, value / 100))
  const c = CHART_TONES[tone]
  // A hair short of the full circumference at t=1: at offset exactly 0 the
  // round starting cap and round ending cap draw on top of each other and the
  // seam disappears into a single flat-looking point. 0.2% short keeps a
  // visible (if tiny) gap only at a literal 100, and is imperceptible below it.
  const offset = GAUGE_CIRCUMFERENCE * (1 - Math.min(t, 0.998))

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${GAUGE_SIZE} ${GAUGE_SIZE}`}
        className="w-full max-w-[12rem]"
        role="img"
        aria-label={value === null ? `${caption}: not measured` : `${value}${suffix} of 100, ${caption}`}
      >
        <circle
          cx={GAUGE_C}
          cy={GAUGE_C}
          r={GAUGE_R}
          fill="none"
          stroke="var(--color-ink-100)"
          strokeWidth={GAUGE_STROKE}
        />
        {value !== null && t > 0 && (
          <circle
            cx={GAUGE_C}
            cy={GAUGE_C}
            r={GAUGE_R}
            fill="none"
            stroke={c.stroke}
            strokeWidth={GAUGE_STROKE}
            strokeLinecap="round"
            strokeDasharray={GAUGE_CIRCUMFERENCE}
            strokeDashoffset={offset}
            transform={GAUGE_ROTATE}
            style={{
              transition: 'stroke-dashoffset 700ms cubic-bezier(0.22, 0.9, 0.28, 1)',
              filter: `drop-shadow(0 0 6px color-mix(in srgb, ${c.stroke} 45%, transparent))`,
            }}
          />
        )}
        <text
          x={GAUGE_C}
          y={GAUGE_C}
          textAnchor="middle"
          dominantBaseline="middle"
          className={'figure ' + (value === null ? 'fill-ink-400' : '')}
          fill={value === null ? undefined : c.stroke}
          style={{ fontSize: value === null ? 20 : 42, fontWeight: 500 }}
        >
          {value === null ? 'n/a' : `${value}${suffix}`}
        </text>
      </svg>
      <p className={'mt-1 text-center text-[12px] font-semibold uppercase tracking-wide ' + c.text}>
        {caption}
      </p>
    </div>
  )
}

/**
 * The gauge ring for a measurement still arriving.
 *
 * Two distinct visual states, because they are two distinct facts:
 * `percent === null` is a real unknown (no byte count reported yet, or a
 * step like scoring that has no progress of its own), drawn as a short arc
 * spinning continuously so it never reads as a stalled or completed ring.
 * A known `percent` draws the same clockwise ring the finished Gauge uses,
 * animating smoothly to each new value as download progress reports arrive.
 */
export function GaugePending({ caption, percent }: { caption: string; percent: number | null }) {
  const known = percent !== null
  const t = known ? Math.min(1, Math.max(0, (percent as number) / 100)) : 0
  const offset = GAUGE_CIRCUMFERENCE * (1 - Math.min(t, 0.998))
  const spinnerArc = GAUGE_CIRCUMFERENCE * 0.22

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${GAUGE_SIZE} ${GAUGE_SIZE}`}
        className="w-full max-w-[12rem]"
        role="img"
        aria-label={known ? `${Math.round(percent as number)}%, ${caption}` : caption}
      >
        <circle
          cx={GAUGE_C}
          cy={GAUGE_C}
          r={GAUGE_R}
          fill="none"
          stroke="var(--color-ink-100)"
          strokeWidth={GAUGE_STROKE}
        />
        {known ? (
          <circle
            cx={GAUGE_C}
            cy={GAUGE_C}
            r={GAUGE_R}
            fill="none"
            stroke="var(--color-seal-400)"
            strokeWidth={GAUGE_STROKE}
            strokeLinecap="round"
            strokeDasharray={GAUGE_CIRCUMFERENCE}
            strokeDashoffset={offset}
            transform={GAUGE_ROTATE}
            style={{ transition: 'stroke-dashoffset 500ms cubic-bezier(0.22, 0.9, 0.28, 1)' }}
          />
        ) : (
          <circle
            cx={GAUGE_C}
            cy={GAUGE_C}
            r={GAUGE_R}
            fill="none"
            stroke="var(--color-seal-300)"
            strokeWidth={GAUGE_STROKE}
            strokeLinecap="round"
            strokeDasharray={`${spinnerArc} ${GAUGE_CIRCUMFERENCE - spinnerArc}`}
            className="mw-gauge-spin"
          />
        )}
        <text
          x={GAUGE_C}
          y={GAUGE_C}
          textAnchor="middle"
          dominantBaseline="middle"
          className="figure fill-ink-400"
          style={{ fontSize: 22, fontWeight: 500 }}
        >
          {known ? `${Math.round(percent as number)}%` : '…'}
        </text>
      </svg>
      <p className="mt-1 text-center text-[12px] font-semibold uppercase tracking-wide text-ink-400">
        {caption}
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------- bars */

/**
 * One channel as a track: where the rewrite landed, and where the draft was.
 *
 * The ghost tick is the before value, drawn on the same track rather than as a
 * second bar, so "it moved, and by how much" is one glance rather than a
 * comparison between two lengths. Omit `before` entirely where there is no
 * earlier measurement; there is deliberately no way to pass a placeholder.
 */
export function ChannelBar({
  label,
  value,
  before = null,
  max,
  tone,
  display,
  note,
  betterIs = 'lower',
  deadZone = 0,
}: {
  label: string
  value: number | null
  before?: number | null
  max: number
  tone: ChartTone
  /** The value as text, already formatted (a percentage, a z score, a count). */
  display: string
  /** Why this could not be measured. Rendered instead of the track when `value` is null. */
  note?: string
  betterIs?: 'lower' | 'higher'
  /**
   * A delta smaller than this, in absolute terms, renders as a neutral grey
   * chip instead of a colored better/worse one. Some channels here are
   * statistical tests with real sampling noise (a watermark z-score computed
   * over a rewritten document is a fresh draw, not a continuation of the
   * same measurement), so a one-point wobble is not evidence the rewrite made
   * anything worse, and coloring it red claims a confidence the number
   * doesn't have. Zero (the default) preserves the previous behaviour for
   * channels that are exact counts, where every unit is real.
   */
  deadZone?: number
}) {
  const c = CHART_TONES[tone]
  const pct = (n: number) => Math.min(100, Math.max(0, (n / max) * 100))
  const delta = value !== null && before !== null ? value - before : null
  const withinNoise = delta !== null && Math.abs(delta) < deadZone
  const improved = delta === null ? null : betterIs === 'lower' ? delta < 0 : delta > 0

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="truncate text-[12px] font-medium text-ink-600">{label}</p>
        <p className="flex shrink-0 items-baseline gap-1.5">
          <span className={'figure text-[13px] font-semibold ' + (value === null ? 'text-ink-400' : c.text)}>
            {display}
          </span>
          {delta !== null && delta !== 0 && (
            <span
              title={withinNoise ? 'Within this test’s normal sampling noise, not a meaningful change.' : undefined}
              className={
                'figure rounded-full px-1.5 py-px text-[10px] font-semibold ' +
                (withinNoise
                  ? 'bg-ink-100 text-ink-500'
                  : improved
                    ? 'bg-mint-100 text-mint-700'
                    : 'bg-signal-100 text-signal-700')
              }
            >
              {delta > 0 ? '+' : ''}
              {Math.round(delta * 100) / 100}
            </span>
          )}
        </p>
      </div>

      {value === null ? (
        <p className="mt-1 text-[11px] leading-relaxed text-ink-400">{note ?? 'Not measured.'}</p>
      ) : (
        <div className="relative mt-1.5 h-2 overflow-hidden rounded-full" style={{ background: c.track }}>
          <div
            className="h-full rounded-full transition-[width] duration-700"
            style={{ width: `${pct(value)}%`, background: c.stroke }}
          />
          {before !== null && before !== value && (
            <span
              aria-hidden="true"
              className="absolute top-0 h-full w-[2px] bg-ink-400/70"
              style={{ left: `calc(${pct(before)}% - 1px)` }}
              title={`${before} before the rewrite`}
            />
          )}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ tiles */

/**
 * A fact with no useful scale of its own: found or not found, a count, a time.
 * Icon-led rather than sentence-led, because these are the four things a reader
 * checks at a glance and then stops looking at.
 */
export function Tile({
  label,
  value,
  tone = 'ink',
}: {
  label: string
  value: string
  tone?: ChartTone
}) {
  return (
    <div className={`rounded-[var(--radius-control)] px-3 py-2 ${CHART_TONES[tone].soft}`}>
      <p className="truncate text-[10px] font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="figure mt-0.5 truncate text-[15px] font-semibold">{value}</p>
    </div>
  )
}
