import { NextResponse } from 'next/server'
import { applyBillingEvent, stripe, stripeConfigured } from '@/lib/billing'
import { databaseConfigured } from '@/lib/db'
import { guardStripeEvent } from '@/lib/gate'

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
    return NextResponse.json({ received: true, ...outcome })
  } catch (err) {
    // Return 500 so Stripe retries. Swallowing this would leave a paying
    // customer on the free plan with no trace of why.
    return NextResponse.json(
      { error: 'handler_failed', message: (err as Error).message },
      { status: 500 },
    )
  }
}
