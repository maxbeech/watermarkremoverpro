import { describe, expect, it, vi, beforeEach } from 'vitest'
import type Stripe from 'stripe'

/**
 * applyBillingEvent is the plan-change decision for every paying account. It is
 * pure business logic (a Stripe event in, a plan written out) that does not
 * require a live Stripe account to exercise, so there is no excuse for it being
 * unverified just because this deployment has no payment processor configured.
 *
 * The DB is mocked because these tests are about the mapping from event to
 * plan, not about Postgres.
 */

const queries: Array<{ text: string; values: unknown[] }> = []

vi.mock('@/lib/db', () => ({
  sql: () =>
    (strings: TemplateStringsArray, ...values: unknown[]) => {
      queries.push({ text: strings.join('?'), values })
      return Promise.resolve([])
    },
}))

const { applyBillingEvent } = await import('./billing')

function checkoutCompletedEvent(overrides: Partial<Stripe.Checkout.Session> = {}): Stripe.Event {
  return {
    type: 'checkout.session.completed',
    data: {
      object: {
        customer: 'cus_123',
        client_reference_id: 'acct_abc',
        metadata: { accountId: 'acct_abc' },
        ...overrides,
      },
    },
  } as unknown as Stripe.Event
}

function subscriptionEvent(
  type: 'customer.subscription.updated' | 'customer.subscription.deleted',
  status: Stripe.Subscription.Status,
  accountId: string | null = 'acct_abc',
): Stripe.Event {
  return {
    type,
    data: {
      object: {
        status,
        metadata: accountId === null ? {} : { accountId },
      },
    },
  } as unknown as Stripe.Event
}

describe('applyBillingEvent', () => {
  beforeEach(() => {
    queries.length = 0
  })

  it('promotes the account to pro on checkout.session.completed', async () => {
    const outcome = await applyBillingEvent(checkoutCompletedEvent())
    expect(outcome.handled).toBe(true)
    expect(outcome.detail).toContain('acct_abc')
    expect(outcome.detail).toContain('pro')
  })

  it('refuses silently-successful behaviour when a session carries no accountId', async () => {
    const outcome = await applyBillingEvent(
      checkoutCompletedEvent({ client_reference_id: null, metadata: {} }),
    )
    expect(outcome.handled).toBe(false)
    expect(queries).toHaveLength(0)
  })

  it('keeps an account on pro while the subscription is active', async () => {
    const outcome = await applyBillingEvent(subscriptionEvent('customer.subscription.updated', 'active'))
    expect(outcome.handled).toBe(true)
    expect(outcome.detail).toContain('pro')
  })

  it('keeps an account on pro while the subscription is trialing', async () => {
    const outcome = await applyBillingEvent(subscriptionEvent('customer.subscription.updated', 'trialing'))
    expect(outcome.detail).toContain('pro')
  })

  it('downgrades to free when a subscription is cancelled', async () => {
    const outcome = await applyBillingEvent(subscriptionEvent('customer.subscription.deleted', 'canceled'))
    expect(outcome.handled).toBe(true)
    expect(outcome.detail).toContain('free')
  })

  it('downgrades to free when a subscription lapses to past_due', async () => {
    const outcome = await applyBillingEvent(subscriptionEvent('customer.subscription.updated', 'past_due'))
    expect(outcome.detail).toContain('free')
  })

  it('does nothing when a subscription event carries no accountId', async () => {
    const outcome = await applyBillingEvent(
      subscriptionEvent('customer.subscription.updated', 'active', null),
    )
    expect(outcome.handled).toBe(false)
    expect(queries).toHaveLength(0)
  })

  it('ignores event types this product does not act on', async () => {
    const outcome = await applyBillingEvent({ type: 'invoice.paid', data: { object: {} } } as unknown as Stripe.Event)
    expect(outcome.handled).toBe(false)
    expect(queries).toHaveLength(0)
  })
})
