import * as Sentry from '@sentry/nextjs'
import { sharedSentryOptions } from '@/lib/sentry-options'

/**
 * Server and edge error reporting.
 *
 * Next calls `register()` once per runtime at boot (nodejs and edge share this
 * one init, so the scrubbing cannot drift between them). With no DSN nothing is
 * reported, and in production that is said out loud rather than left silent.
 */
export async function register() {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
  if (!dsn) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[sentry] SENTRY_DSN is not set: server errors and logs are not being reported.')
    }
    return
  }

  Sentry.init({ dsn, ...sharedSentryOptions() })
}

// Reports errors thrown while rendering a server component or route handler.
export const onRequestError = Sentry.captureRequestError
