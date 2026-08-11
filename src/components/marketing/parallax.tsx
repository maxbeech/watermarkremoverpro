'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Scroll-linked drift.
 *
 * The two hero exhibits are the same paragraph measured twice, and they move at
 * slightly different rates as the page scrolls, which separates them in depth
 * without either of them animating on its own. Deliberately small: the intent is
 * that a visitor notices the panels are separate objects, not that they notice
 * an animation.
 *
 * Honours prefers-reduced-motion by never subscribing to scroll at all, and
 * measures on rAF so it cannot fight the compositor.
 */
export function Drift({
  rate = 0.05,
  max = 26,
  className = '',
  children,
}: {
  /** Fraction of scroll distance to move by. Positive drifts down. */
  rate?: number
  /** Hard cap in pixels, so a long page cannot slide a panel off its section. */
  max?: number
  className?: string
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    const measure = () => {
      frame = 0
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      // 0 when the element's centre is at the viewport centre, negative above.
      const fromCentre = rect.top + rect.height / 2 - window.innerHeight / 2
      const next = Math.max(-max, Math.min(max, -fromCentre * rate))
      setOffset(next)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [rate, max])

  return (
    <div
      ref={ref}
      className={className}
      style={{ transform: `translate3d(0, ${offset.toFixed(2)}px, 0)`, willChange: 'transform' }}
    >
      {children}
    </div>
  )
}

/**
 * Reveal on first entry into the viewport. One-shot: once shown, an element is
 * never re-hidden, so scrolling back up is not a second performance.
 *
 * It starts VISIBLE and only hides itself once mounted JavaScript has confirmed
 * the element is genuinely below the fold. An earlier version started hidden and
 * waited to be shown, which meant anything the observer never got around to
 * reporting stayed invisible: a screenshot of the deployed homepage caught the
 * second hero panel missing entirely. Motion is allowed to add something to a
 * page. It is never allowed to be the reason content is not there.
 */
export function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<'visible' | 'pending' | 'entering'>('visible')

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (typeof IntersectionObserver === 'undefined') return

    // Only worth animating if it is below the fold right now.
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight * 0.92) return

    setState('pending')

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setState('entering')
            io.disconnect()
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)

    // A backstop, so a browser that never fires the observer still shows the
    // content rather than leaving a hole in the page.
    const timer = window.setTimeout(() => {
      setState('entering')
      io.disconnect()
    }, 2500)

    return () => {
      io.disconnect()
      window.clearTimeout(timer)
    }
  }, [])

  const hidden = state === 'pending'

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: hidden ? 0 : 1,
        transform: hidden ? 'translateY(12px)' : 'none',
        transition:
          state === 'visible'
            ? undefined
            : `opacity 560ms cubic-bezier(0.22,0.9,0.28,1) ${delay}ms, transform 560ms cubic-bezier(0.22,0.9,0.28,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}
