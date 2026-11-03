'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { buttonClass } from '@/components/brand/ui'
import { isTranslationDomConflict } from '@/lib/sentry-client-noise'

/**
 * The body of every segment error boundary. Reports the error to Sentry first
 * (a boundary that only shows a fallback hides exactly the crashes that matter),
 * then offers a retry. The digest is the id that matches the server log line.
 */
export function RouteError({
  error,
  reset,
  scope,
}: {
  error: Error & { digest?: string }
  reset: () => void
  scope: string
}) {
  useEffect(() => {
    Sentry.withScope((s) => {
      s.setTag('scope', scope)
      if (error.digest) s.setExtra('digest', error.digest)
      Sentry.captureException(error)
    })
  }, [error, scope])

  // A page translator rewrites text nodes under React, which then fails when it
  // removes one. That is not a fault on our side, so say what to do instead.
  const translated = isTranslationDomConflict(error)

  return (
    <section className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center px-5 py-16 text-center">
      <h1 className="t-title text-ink-900">Something went wrong</h1>
      {translated ? (
        <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
          Your browser&apos;s page translation changed this page while it was updating. Your draft
          stays in your browser and has not been touched. Reload the page, or turn translation off
          for this site, and try again.
        </p>
      ) : (
        <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
          That is on us, and we have been told. Your draft stays in your browser and has not been
          touched. Please try again.
        </p>
      )}
      {error.digest && <p className="figure mt-3 text-xs text-ink-400">Reference {error.digest}</p>}
      <button
        type="button"
        onClick={translated ? () => window.location.reload() : reset}
        className={buttonClass('primary', 'mt-6')}
      >
        {translated ? 'Reload page' : 'Try again'}
      </button>
    </section>
  )
}
