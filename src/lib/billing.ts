import Stripe from 'stripe'
import { sql } from '@/lib/db'
import { PLANS, SITE } from '@/lib/site'

/**
 * Stripe billing.
 *
 * STATUS ON THIS DEPLOYMENT: no Stripe credentials are configured. That is a
 * known, recorded gap — the only Stripe connection available to this workspace
 * at build time belonged to a different product, and writing to another brand's
 * live account to test a checkout flow would have been the wrong call.
 *
 * The code below is real and complete, not a placeholder: setting
 * STRIPE_SECRET_KEY, STRIPE_PRICE_PRO and STRIPE_WEBHOOK_SECRET activates a
 * genuine checkout and a genuine webhook that promotes the account to Pro. What
 * has NOT happened is an end-to-end purchase against a live account, so this
 * path is written-and-typechecked rather than proven, and the pricing page says
 * paid plans are unavailable rather than showing a button that fails.
 */

export const stripeConfigured = (): boolean =>
  Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_PRO)

export class BillingUnavailableError extends Error {
  readonly code = 'billing_unavailable'
  constructor() {
    super(
      'No payment processor is configured on this deployment, so paid plans cannot be sold. Free and account-tier checks are unaffected.',
    )
    this.name = 'BillingUnavailableError'
  }
}

let client: Stripe | null = null

export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || !process.env.STRIPE_PRICE_PRO) throw new BillingUnavailableError()
  return (client ??= new Stripe(key))
}

/**
 * Start a Pro subscription checkout.
 *
 * The account id travels in client_reference_id AND in metadata: the webhook
 * reads metadata, and client_reference_id is what makes a payment traceable back
 * to an account from the Stripe dashboard when someone is investigating a
 * mismatch by hand.
 */
export async function createProCheckout(accountId: string, email: string): Promise<string> {
  const session = await stripe().checkout.sessions.create({
    mode: 'subscription',
    customer_email: email,
    client_reference_id: accountId,
    line_items: [{ price: process.env.STRIPE_PRICE_PRO as string, quantity: 1 }],
    success_url: `${SITE.url}/dashboard?upgraded=1`,
    cancel_url: `${SITE.url}/pricing`,
    metadata: { accountId, plan: PLANS.pro.id },
    subscription_data: { metadata: { accountId } },
  })

  if (!session.url) throw new Error('Stripe returned a checkout session with no URL.')
  return session.url
}

/**
 * Apply a verified webhook event to the account's plan.
 *
 * Only events whose signature has already been verified by the route should
 * reach this. Plan changes are driven by subscription state rather than by
 * checkout completion alone, so a cancelled or lapsed subscription downgrades
 * rather than leaving someone on Pro forever.
 */
export async function applyBillingEvent(event: Stripe.Event): Promise<{ handled: boolean; detail: string }> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const accountId = session.metadata?.accountId ?? session.client_reference_id
      if (!accountId) return { handled: false, detail: 'No accountId on the session; nothing to update.' }
      await sql()`
        update accounts set plan = 'pro', stripe_customer_id = ${String(session.customer ?? '')}
        where id = ${accountId}
      `
      return { handled: true, detail: `Account ${accountId} set to pro.` }
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const accountId = subscription.metadata?.accountId
      if (!accountId) return { handled: false, detail: 'No accountId on the subscription; nothing to update.' }
      const active = subscription.status === 'active' || subscription.status === 'trialing'
      await sql()`update accounts set plan = ${active ? 'pro' : 'free'} where id = ${accountId}`
      return { handled: true, detail: `Account ${accountId} set to ${active ? 'pro' : 'free'}.` }
    }

    default:
      return { handled: false, detail: `Event type ${event.type} is not one this product acts on.` }
  }
}
