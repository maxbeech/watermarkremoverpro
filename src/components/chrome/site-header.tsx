'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogoLink } from '@/components/brand/logo'
import { buttonClass } from '@/components/brand/ui'

/**
 * The site header.
 *
 * One nav definition, rendered twice (a horizontal bar above `lg`, a sheet
 * below it) rather than two hand-maintained lists that drift. The old header
 * hid half its links on small screens with `hidden sm:inline-block`, which
 * meant a phone visitor simply could not reach Method, Verify, Blog or the
 * API docs at all.
 */
const NAV = [
  { href: '/check', label: 'Check' },
  { href: '/method', label: 'How it works' },
  { href: '/verify', label: 'Verify' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/blog', label: 'Blog' },
  { href: '/docs/api', label: 'API' },
] as const

export function SiteHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Close the sheet on navigation. Without this the menu stays open over the
  // page the visitor just asked for.
  useEffect(() => setOpen(false), [pathname])

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-6">
        <LogoLink height={26} priority />

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  'rounded-full px-3 py-2 text-sm font-medium transition-colors duration-150 ' +
                  (active ? 'bg-ink-100 text-ink-900' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900')
                }
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          {/*
            The desktop actions are hidden by a WRAPPER rather than by adding
            `hidden` to the button itself: `buttonClass` already sets
            `inline-flex`, and two display utilities of equal specificity are
            settled by stylesheet order, not by the order they are written in
            the class string. The button was winning, and both actions were
            crowding the phone header next to the menu toggle.
          */}
          <div className="hidden items-center gap-2 sm:flex">
            <Link
              href="/login"
              className="rounded-full px-3 py-2 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-50"
            >
              Sign in
            </Link>
            <Link href="/" className={buttonClass('primary')}>
              Clean up my text
            </Link>
          </div>

          <button
            type="button"
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-700 transition-colors hover:bg-ink-100 lg:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div id="site-menu" className="border-t border-ink-200 bg-white lg:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-4 sm:px-6">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-[var(--radius-control)] px-3 py-2.5 text-[15px] font-medium text-ink-700 transition-colors hover:bg-ink-50"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-ink-200 pt-4">
              <Link href="/login" className={buttonClass('quiet')}>
                Sign in
              </Link>
              <Link href="/" className={buttonClass('primary')}>
                Clean up my text
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
