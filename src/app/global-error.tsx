'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

// The last-resort boundary: a render error that escaped every segment boundary.
// Report it before showing the fallback, otherwise the crashes that matter most
// are the only ones nobody hears about. Inline styles because the app's
// stylesheet and layout may be what failed.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#f7f7f8', fontFamily: 'system-ui, sans-serif', color: '#16181d' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: 440 }}>
            <h1 style={{ fontSize: '1.6rem', margin: '0 0 0.75rem' }}>Something went wrong</h1>
            <p style={{ color: '#5b616e', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
              That is on us, and we have been told. Your draft stays in your browser and has not
              been touched. Please try again.
            </p>
            {error.digest && (
              <p style={{ fontSize: '0.75rem', color: '#8a909c', fontFamily: 'monospace' }}>
                Reference {error.digest}
              </p>
            )}
            <button
              type="button"
              onClick={reset}
              style={{
                padding: '0.65rem 1.5rem',
                background: '#16181d',
                color: '#fff',
                border: 'none',
                borderRadius: 999,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
