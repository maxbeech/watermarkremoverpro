'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Reveal an element the first time it scrolls into view, once.
 *
 * Deliberately the only scroll-linked motion left in the product. Honours
 * prefers-reduced-motion by never subscribing at all, and never re-runs, so
 * nothing on the page keeps moving after the reader has arrived at it.
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
