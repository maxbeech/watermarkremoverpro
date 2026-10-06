import * as Sentry from '@sentry/nextjs'
import { scrubBreadcrumb, scrubEvent, scrubLog, scrubTransaction } from '@/lib/scrub'

/**
 * The one place the options shared by every Sentry.init live (browser in
 * instrumentation-client.ts, server and edge in instrumentation.ts), so the
 * scrubbing, sampling and log forwarding cannot drift between runtimes.
 */
export function sharedSentryOptions() {
  return {
    environment: process.env.NODE_ENV,
    // Errors are the point; traces are sampled lightly to stay inside quota.
    tracesSampleRate: 0.1,
    // Never send request bodies, headers or user identifiers by default.
    sendDefaultPii: false,
    beforeSend: scrubEvent,
    beforeSendTransaction: scrubTransaction,
    beforeBreadcrumb: scrubBreadcrumb,
    // Structured logs, plus every console call forwarded as a log line.
    enableLogs: true,
    beforeSendLog: scrubLog,
    integrations: [Sentry.consoleLoggingIntegration({ levels: ['log', 'info', 'warn', 'error'] })],
  }
}
