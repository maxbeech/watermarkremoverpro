import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { applyBillingEvent, stripe, stripeConfigured } from '@/lib/billing'
import { databaseConfigured } from '@/lib/db'
import { guardStripeEvent } from '@/lib/gate'
import { configFromEnv, trackEvent } from '@/lib/openhelm-analytics-mp'

export const runtime = 'nodejs'

/**
 * Stripe webhook.
 *
 * The signature is verified before the event is looked at. An unverified webhook
 * body is an unauthenticated request that can set any account to Pro, so this is
 * the one place where failing closed matters more than being forgiving.
 */
export async function POST(request: Request) {
  if (!stripeConfigured() || !databaseConfigured()) {
    return NextResponse.json(
      { error: 'billing_unavailable', message: 'Billing is not configured on this deployment.' },
      { status: 503 },
    )
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json(
      {
        error: 'webhook_secret_missing',
        message:
          'STRIPE_WEBHOOK_SECRET is not set. Events are rejected rather than trusted unverified, because an unverified event could upgrade any account.',
      },
      { status: 503 },
    )
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'missing_signature' }, { status: 400 })
  }

  const payload = await request.text()

  let event
  try {
    event = await stripe().webhooks.constructEventAsync(payload, signature, secret)
  } catch (err) {
    // Warning, not exception: an unsigned/forged request is expected noise on
    // a public webhook endpoint, not a bug in this code. Still worth a Sentry
    // trail so a sustained run of these (a misconfigured secret after a
    // rotation, say) is visible rather than only living in Stripe's own logs.
    Sentry.captureMessage('Stripe webhook signature verification failed', {
      level: 'warning',
      extra: { reason: (err as Error).message },
    })
    return NextResponse.json(
      { error: 'invalid_signature', message: (err as Error).message },
      { status: 400 },
    )
  }

  // A Stripe webhook endpoint is registered on an ACCOUNT, so on a shared
  // account this handler is delivered every other product's events too.
  // Establish that this one is OURS, by price id, never by metadata or
  // customer, before anything below acts on it. See src/lib/gate.ts.
  const ownership = await guardStripeEvent(stripe(), event)
  if (!ownership.ok) {
    console.log(ownership.message)
    return NextResponse.json({ received: true, ignored: ownership.reason })
  }

  try {
    const outcome = await applyBillingEvent(event)
    if (outcome.transition && outcome.accountId) {
      // Server-side, non-browser surface (a webhook has no document/tab), so
      // this goes through the Measurement Protocol rather than gtag. The
      // account id is this product's own internal identifier: an opaque,
      // non-PII UUID never derived from email or name, used only as GA4's
      // required client_id, not surfaced anywhere as a queryable dimension.
      await sendBillingTelemetry(outcome.accountId, outcome.transition)
    }
    return NextResponse.json({ received: true, ...outcome })
  } catch (err) {
    // Return 500 so Stripe retries. Swallowing this would leave a paying
    // customer on the free plan with no trace of why, and it was previously
    // swallowed exactly like that: this is the highest-priority gap the
    // journey review found, since a broken handler here means "customer paid,
    // plan silently didn't update."
    Sentry.captureException(err, { tags: { feature: 'billing_webhook' } })
    return NextResponse.json(
      { error: 'handler_failed', message: (err as Error).message },
      { status: 500 },
    )
  }
}

async function sendBillingTelemetry(accountId: string, transition: string): Promise<void> {
  const config = { ...configFromEnv(), clientId: accountId, surface: 'server' as const }
  const result = await trackEvent(config, transition, { plan: 'pro' })
  if (!result.sent && result.reason !== 'not_configured') {
    // Analytics must never fail the webhook itself, but a real send failure
    // (as opposed to "GA is simply not configured on this deployment") is
    // worth its own trail rather than silently vanishing.
    Sentry.captureMessage(`Billing telemetry event "${transition}" was not recorded`, {
      level: 'warning',
      extra: { reason: result.reason, error: 'error' in result ? result.error : undefined },
    })
  }
}
