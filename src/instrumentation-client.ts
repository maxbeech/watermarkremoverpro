import * as Sentry from '@sentry/nextjs'
import { sharedSentryOptions } from '@/lib/sentry-options'

/**
 * Browser error reporting. Loaded by Next on the client at boot.
 *
 * The feedback integration backs the "Send feedback" control in the workspace
 * sidebar and the site footer, so a report from a person lands in the same
 * Sentry project as the exceptions from the code.
 *
 * Screenshots are off on purpose: the page can be showing a draft, and this
 * product promises a document never leaves the browser.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
const shared = sharedSentryOptions()

if (dsn) {
  Sentry.init({
    dsn,
    ...shared,
    // Requests go through our own tunnel route (next.config.ts), so they are
    // same-origin and ad-blocker safe. The content-type header is required, not
    // cosmetic: without one the tunnel receives an empty body and a feedback
    // submit fails with "Unable to send feedback". See getsentry/sentry-javascript#16112.
    transportOptions: {
      headers: { 'content-type': 'application/x-sentry-envelope' },
    },
    integrations: [
      ...shared.integrations,
      Sentry.feedbackIntegration({
        colorScheme: 'system',
        // Opened by our own control; no floating Sentry button over the app.
        autoInject: false,
        showBranding: false,
        enableScreenshot: false,
        formTitle: 'Send feedback',
        submitButtonLabel: 'Send feedback',
        messagePlaceholder: 'A bug, an idea, anything on your mind. Please do not paste your draft.',
        successMessageText: 'Thanks, that has gone to the people who can act on it.',
      }),
    ],
  })
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
