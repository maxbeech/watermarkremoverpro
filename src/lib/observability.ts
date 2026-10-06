import * as Sentry from '@sentry/nextjs'

/**
 * The one way server code reports a problem.
 *
 * Everything funnels through here so that scope and tag conventions stay
 * consistent across routes, webhooks and mail, and so that a deployment with no
 * DSN degrades to a console line instead of throwing inside an error handler.
 *
 * Context is ids, codes, counts and enum values only. Anything else (names,
 * emails, free text, document text, request or response bodies) is replaced
 * with a marker before it gets near Sentry, because this product's promise is
 * that a document never leaves the browser. The scrubber in scrub.ts is the
 * second line of defence, not the first.
 */

type Context = Record<string, unknown>

/** A short token of letters, digits and _ . : - (ids, codes, enum values). */
const SAFE_STRING = /^[A-Za-z0-9_.:-]{1,64}$/

export function safeContext(context: Context): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {}
  for (const [k, v] of Object.entries(context)) {
    if (k === 'scope') continue
    if (typeof v === 'number' && Number.isFinite(v)) out[k] = v
    else if (typeof v === 'boolean') out[k] = v
    else if (typeof v === 'string' && SAFE_STRING.test(v)) out[k] = v
    else if (v != null) out[k] = '[omitted]'
  }
  return out
}

function configured(): boolean {
  return Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN)
}

function scopeOf(context: Context): string {
  return typeof context.scope === 'string' && SAFE_STRING.test(context.scope) ? context.scope : 'server'
}

export function captureServerError(err: unknown, context: Context = {}): void {
  const scope = scopeOf(context)
  try {
    Sentry.captureException(err instanceof Error ? err : new Error(String(err)), {
      tags: { scope },
      extra: safeContext(context),
    })
  } catch {
    // Never let reporting an error become an error.
  }
  // Without a DSN the capture above goes nowhere, so say so rather than fail silently.
  if (!configured()) {
    console.error(`[${scope}] Sentry is not configured; error not reported:`, err instanceof Error ? err.name : typeof err)
  }
}

/** A handled failure that is not an exception, reported as a warning. */
export function captureServerMessage(message: string, context: Context = {}): void {
  const scope = scopeOf(context)
  try {
    Sentry.captureMessage(message, { level: 'warning', tags: { scope }, extra: safeContext(context) })
  } catch {
    // see above
  }
  if (!configured()) console.warn(`[${scope}] Sentry is not configured; message not reported: ${message}`)
}

/**
 * Serverless functions freeze when the response goes out, so a capture on a
 * route that is not wrapped by withSentryConfig must be flushed explicitly.
 */
export async function flushSentry(timeoutMs = 2000): Promise<void> {
  try {
    await Sentry.flush(timeoutMs)
  } catch {
    // flushing is best effort
  }
}
