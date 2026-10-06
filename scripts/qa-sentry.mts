// Sends one harmless test error and one test log through the real shared options
// (scrubbers included). Usage: SENTRY_DSN=... npx tsx scripts/qa-sentry.mts
import { createRequire } from 'node:module'
import { sharedSentryOptions } from '../src/lib/sentry-options'
import { captureServerError } from '../src/lib/observability'

// The CJS build is used directly: plain-node ESM resolution of @sentry/nextjs omits `logger`.
const Sentry = createRequire(import.meta.url)('@sentry/nextjs') as typeof import('@sentry/nextjs')
const dsn = process.env.SENTRY_DSN
if (!dsn) throw new Error('SENTRY_DSN is not set')
Sentry.init({ dsn, ...sharedSentryOptions() })
const stamp = Date.now()
captureServerError(new Error(`QA test, please ignore: scrubbed error ${stamp} jane@example.com`), { scope: 'qa', runId: 'qa_1' })
Sentry.logger.info(`QA test, please ignore: log line ${stamp} for jane@example.com`, { runId: 'qa_1' })
await Sentry.flush(5000)
console.log('sent', stamp)
