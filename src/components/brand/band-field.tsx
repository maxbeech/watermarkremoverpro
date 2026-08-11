'use client'

import { useState } from 'react'

/**
 * The abstract graphic.
 *
 * It is the same object as the result screen, drawn at a distance: a stack of
 * measurement bands, each with a hatched interval and a marker, read against one
 * shared chance line running down the middle. That is exactly the app's own
 * visual language rather than a generic shape, but abstracted enough that it
 * reads as art direction and not as a second copy of the product screenshot.
 *
 * The interaction is deliberately small. Pointing at a row raises it and pushes
 * its marker, so the graphic behaves like something measurable rather than
 * something decorative.
 *
 * The values below are a fixed composition, not data, and nothing on the page
 * presents them as a measurement. Real figures only ever appear inside an
 * exhibit, which renders a real analysis.
 */

type Row = { at: number; width: number; tone: 'ink' | 'seal' | 'signal'; opacity: number }

const ROWS: Row[] = [
  { at: 0.44, width: 0.1, tone: 'ink', opacity: 0.5 },
  { at: 0.53, width: 0.14, tone: 'seal', opacity: 0.75 },
  { at: 0.47, width: 0.09, tone: 'ink', opacity: 0.45 },
  { at: 0.72, width: 0.16, tone: 'signal', opacity: 1 },
  { at: 0.51, width: 0.12, tone: 'seal', opacity: 0.7 },
  { at: 0.45, width: 0.08, tone: 'ink', opacity: 0.4 },
  { at: 0.68, width: 0.15, tone: 'signal', opacity: 0.85 },
  { at: 0.49, width: 0.11, tone: 'seal', opacity: 0.6 },
  { at: 0.46, width: 0.09, tone: 'ink', opacity: 0.4 },
  { at: 0.56, width: 0.13, tone: 'seal', opacity: 0.55 },
]

const COLOURS = {
  ink: { mark: 'var(--color-ink-400)', hatch: 'var(--color-ink-300)', track: 'var(--color-ink-100)' },
  seal: { mark: 'var(--color-seal-600)', hatch: 'var(--color-seal-300)', track: 'var(--color-seal-50)' },
  signal: {
    mark: 'var(--color-signal-500)',
    hatch: 'var(--color-signal-400)',
    track: 'var(--color-signal-100)',
  },
}

export function BandField({ className = '' }: { className?: string }) {
  const [hover, setHover] = useState<number | null>(null)

  return (
    <div
      className={`relative select-none ${className}`}
      aria-hidden="true"
      onMouseLeave={() => setHover(null)}
    >
      {/* the shared chance line every row is read against */}
      <div
        className="absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 bg-ink-300"
        style={{ opacity: 0.5 }}
      />

      <div className="flex flex-col gap-[7px]">
        {ROWS.map((row, i) => {
          const active = hover === i
          const nudge = active ? 0.02 : 0
          const c = COLOURS[row.tone]
          return (
            <div
              key={i}
              onMouseEnter={() => setHover(i)}
              className="relative h-[9px] cursor-default transition-transform duration-300 ease-out"
              style={{
                opacity: row.opacity,
                transform: active ? 'translateX(6px)' : 'none',
              }}
            >
              <div
                className="absolute inset-0 rounded-[1px] transition-colors duration-300"
                style={{ backgroundColor: c.track }}
              />
              <div
                className="hatch absolute inset-y-0 transition-[left,width] duration-500 ease-out"
                style={{
                  left: `${(row.at + nudge - row.width / 2) * 100}%`,
                  width: `${row.width * 100}%`,
                  color: c.hatch,
                }}
              />
              <div
                className="absolute top-[-2px] bottom-[-2px] w-[3px] rounded-[1px] transition-[left] duration-500 ease-out"
                style={{ left: `calc(${(row.at + nudge) * 100}% - 1.5px)`, backgroundColor: c.mark }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
