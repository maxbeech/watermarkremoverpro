import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
  enableLogs: true,
  integrations: [
    Sentry.feedbackIntegration({
      autoInject: true,
      buttonLabel: "Feedback",
      formTitle: "Send feedback",
      submitButtonLabel: "Send feedback",
      colorScheme: "system",
    }),
    Sentry.consoleLoggingIntegration({ levels: ["warn", "error"] }),
  ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
