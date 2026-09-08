import { describe, expect, it, vi, beforeEach } from 'vitest'

/**
 * The webhook is where a real subscription change becomes telemetry (or,
 * before this test existed, becomes nothing at all if the handler throws).
 * Stripe, the database and the analytics/Sentry SDKs are all mocked: this
 * asserts the route's own wiring, not any of those systems.
 */

const applyBillingEvent = vi.fn()
const constructEventAsync = vi.fn()
const guardStripeEvent = vi.fn()
const trackEvent = vi.fn()
const captureException = vi.fn()
const captureMessage = vi.fn()
const flush = vi.fn()

vi.mock('@/lib/billing', () => ({
  applyBillingEvent: (...args: unknown[]) => applyBillingEvent(...args),
  stripe: () => ({ webhooks: { constructEventAsync: (...args: unknown[]) => constructEventAsync(...args) } }),
  stripeConfigured: () => true,
}))
vi.mock('@/lib/db', () => ({ databaseConfigured: () => true }))
vi.mock('@/lib/gate', () => ({ guardStripeEvent: (...args: unknown[]) => guardStripeEvent(...args) }))
vi.mock('@/lib/openhelm-analytics-mp', () => ({
  configFromEnv: () => ({ measurementId: 'G-TEST', apiSecret: 's' }),
  trackEvent: (...args: unknown[]) => trackEvent(...args),
}))
vi.mock('@sentry/nextjs', () => ({
  captureException: (...args: unknown[]) => captureException(...args),
  captureMessage: (...args: unknown[]) => captureMessage(...args),
  flush: (...args: unknown[]) => flush(...args),
}))

const { POST } = await import('./route')

function request(body = 'raw-payload'): Request {
  return new Request('https://watermarkremoverpro.com/api/billing/webhook', {
    method: 'POST',
    headers: { 'stripe-signature': 'sig_test' },
    body,
  })
}

beforeEach(() => {
  applyBillingEvent.mockReset()
  constructEventAsync.mockReset()
  guardStripeEvent.mockReset().mockResolvedValue({ ok: true })
  trackEvent.mockReset().mockResolvedValue({ sent: true, events: 1 })
  captureException.mockReset()
  captureMessage.mockReset()
  flush.mockReset().mockResolvedValue(true)
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
})

describe('POST /api/billing/webhook', () => {
  it('records a subscription_created telemetry event, keyed on the account, not on email or name', async () => {
    constructEventAsync.mockResolvedValue({ type: 'checkout.session.completed' })
    applyBillingEvent.mockResolvedValue({
      handled: true,
      detail: 'Account acct_1 set to pro.',
      accountId: 'acct_1',
      transition: 'subscription_created',
    })

    const res = await POST(request())
    expect(res.status).toBe(200)

    expect(trackEvent).toHaveBeenCalledTimes(1)
    const [config, name, params] = trackEvent.mock.calls[0]
    expect(config.clientId).toBe('acct_1')
    expect(config.surface).toBe('server')
    expect(name).toBe('subscription_created')
    expect(JSON.stringify(params)).not.toMatch(/@|name/i)
  })

  it('records subscription_cancelled on a lapsed subscription', async () => {
    constructEventAsync.mockResolvedValue({ type: 'customer.subscription.deleted' })
    applyBillingEvent.mockResolvedValue({
      handled: true,
      detail: 'Account acct_2 set to free.',
      accountId: 'acct_2',
      transition: 'subscription_cancelled',
    })

    await POST(request())

    expect(trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 'acct_2' }),
      'subscription_cancelled',
      expect.any(Object),
    )
  })

  it('sends no telemetry when the event carried no plan transition', async () => {
    constructEventAsync.mockResolvedValue({ type: 'invoice.paid' })
    applyBillingEvent.mockResolvedValue({ handled: false, detail: 'not acted on' })

    await POST(request())

    expect(trackEvent).not.toHaveBeenCalled()
  })

  it('reports a broken handler to Sentry and still returns 500 so Stripe retries', async () => {
    constructEventAsync.mockResolvedValue({ type: 'checkout.session.completed' })
    applyBillingEvent.mockRejectedValue(new Error('db unreachable'))

    const res = await POST(request())

    expect(res.status).toBe(500)
    expect(captureException).toHaveBeenCalledTimes(1)
    expect((captureException.mock.calls[0][0] as Error).message).toBe('db unreachable')
    // A raw Route Handler is not wrapped by withSentryConfig, so nothing else
    // guarantees the capture above outlives this serverless invocation.
    expect(flush).toHaveBeenCalledWith(2000)
  })

  it('reports an invalid signature as a warning rather than silently rejecting', async () => {
    constructEventAsync.mockRejectedValue(new Error('bad signature'))

    const res = await POST(request())

    expect(res.status).toBe(400)
    expect(captureMessage).toHaveBeenCalledTimes(1)
    expect(captureMessage.mock.calls[0][1]).toMatchObject({ level: 'warning' })
    expect(flush).toHaveBeenCalledWith(2000)
  })

  it('never lets an analytics failure surface as the webhook response, only as a Sentry warning', async () => {
    constructEventAsync.mockResolvedValue({ type: 'checkout.session.completed' })
    applyBillingEvent.mockResolvedValue({
      handled: true,
      detail: 'ok',
      accountId: 'acct_3',
      transition: 'subscription_created',
    })
    trackEvent.mockResolvedValue({ sent: false, reason: 'error', error: 'HTTP 500' })

    const res = await POST(request())

    expect(res.status).toBe(200)
    expect(captureMessage).toHaveBeenCalledTimes(1)
    expect(captureMessage.mock.calls[0][1]).toMatchObject({ level: 'warning' })
    expect(flush).toHaveBeenCalledWith(2000)
  })
})
