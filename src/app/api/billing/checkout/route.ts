import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createProCheckout, stripeConfigured } from '@/lib/billing'
import { currentEntitlements } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST() {
  if (!stripeConfigured()) {
    return NextResponse.json(
      {
        error: 'billing_unavailable',
        message:
          'No payment processor is configured on this deployment, so Pro cannot be purchased here yet. Free and account-tier checks are unaffected.',
      },
      { status: 503 },
    )
  }

  const entitlements = await currentEntitlements()
  if (!entitlements.signedIn || !entitlements.userId || !entitlements.email) {
    return NextResponse.json({ error: 'unauthorized', message: 'Sign in first.' }, { status: 401 })
  }
  if (entitlements.pro) {
    return NextResponse.json({ error: 'already_pro', message: 'This account is already on Pro.' }, { status: 409 })
  }

  try {
    const url = await createProCheckout(entitlements.userId, entitlements.email)
    return NextResponse.json({ url })
  } catch (err) {
    Sentry.captureException(err, { tags: { feature: 'billing_checkout' } })
    return NextResponse.json({ error: 'checkout_failed', message: (err as Error).message }, { status: 502 })
  }
}
