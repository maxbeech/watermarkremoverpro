// @vitest-environment node
/**
 * Contract tests for this product's ThreadCamp mail client.
 *
 * The `node` environment above is load-bearing, not cosmetic: the client
 * refuses to run where `window` exists, because its API key must never reach a
 * browser. Under a product whose vitest defaults to jsdom, every test here
 * would otherwise hit that guard instead of the behaviour it means to check.
 *
 * These test the properties a transactional sender must not get wrong: it never
 * reports success it did not get, it never turns a held-for-approval message
 * into "delivered", and it never hides that a recipient was suppressed.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { sendEmail, emailEnabled, mailConfig, sendingAddress } from './threadcamp-mail'

const ORIGINAL_ENV = { ...process.env }

function configure(over: Record<string, string | undefined> = {}) {
  process.env.THREADCAMP_API_KEY = 'sk_live_test'
  process.env.THREADCAMP_FROM_ADDRESS = 'hello@relay.threadcamp.com'
  process.env.THREADCAMP_API_URL = 'https://worker.test/v1'
  for (const [k, v] of Object.entries(over)) {
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
}

function mockFetch(responses: Array<{ ok: boolean; body: unknown; status?: number }>) {
  const calls: Array<{ url: string; body: Record<string, unknown>; headers: Record<string, string> }> = []
  let i = 0
  const fn = vi.fn(async (url: string, init: RequestInit) => {
    const r = responses[Math.min(i++, responses.length - 1)]!
    calls.push({
      url,
      body: JSON.parse(String(init.body ?? '{}')),
      headers: init.headers as Record<string, string>,
    })
    return {
      ok: r.ok,
      status: r.status ?? (r.ok ? 200 : 400),
      json: async () => r.body,
      text: async () => JSON.stringify(r.body),
    } as unknown as Response
  })
  vi.stubGlobal('fetch', fn)
  return calls
}

const OK = { ok: true, body: { id: 'm1', status: 'sent', thread_id: 't1', suppressed: [] } }

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV }
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  process.env = { ...ORIGINAL_ENV }
})

describe('configuration', () => {
  it('is disabled, and says so, without a key and a from-address', () => {
    delete process.env.THREADCAMP_API_KEY
    delete process.env.THREADCAMP_FROM_ADDRESS
    expect(emailEnabled()).toBe(false)

    configure({ THREADCAMP_FROM_ADDRESS: undefined })
    expect(emailEnabled()).toBe(false) // a key alone is not enough

    configure()
    expect(emailEnabled()).toBe(true)
  })

  it('defaults to the hosted API and strips a trailing slash', () => {
    configure({ THREADCAMP_API_URL: undefined })
    expect(mailConfig().apiUrl).toBe('https://www.threadcamp.com/v1')
    configure({ THREADCAMP_API_URL: 'https://worker.test/v1/' })
    expect(mailConfig().apiUrl).toBe('https://worker.test/v1')
  })

  it('reports the sending address without a network call', () => {
    configure()
    expect(sendingAddress()).toBe('hello@relay.threadcamp.com')
    delete process.env.THREADCAMP_FROM_ADDRESS
    expect(sendingAddress()).toBeNull()
  })
})

describe('sendEmail', () => {
  it('refuses, without calling the API, when unconfigured', async () => {
    delete process.env.THREADCAMP_API_KEY
    const fetchSpy = mockFetch([OK])
    const result = await sendEmail({ to: 'a@b.co', subject: 's', text: 't' })
    expect(result).toEqual({ sent: false, reason: 'not_configured' })
    expect(fetchSpy).toHaveLength(0)
  })

  it("posts to /emails with the bearer key and this product's from-address", async () => {
    configure()
    const calls = mockFetch([OK])
    const result = await sendEmail({ to: 'a@b.co', subject: 'Hello', markdown: '**hi** https://watermarkremoverpro.com' })

    expect(result).toMatchObject({ sent: true, id: 'm1', status: 'sent', threadId: 't1' })
    expect(calls[0]!.url).toBe('https://worker.test/v1/emails')
    expect(calls[0]!.headers.authorization).toBe('Bearer sk_live_test')
    expect(calls[0]!.body).toMatchObject({
      from: 'hello@relay.threadcamp.com',
      from_name: 'WatermarkRemoverPro',
      to: ['a@b.co'],
      subject: 'Hello',
    })
    expect(calls[0]!.body.html).toContain('<strong>hi</strong>')
    expect(calls[0]!.body.html).toContain('<a href="https://watermarkremoverpro.com">')
    expect(calls[0]!.body.text).toBe('hi https://watermarkremoverpro.com')
  })

  it('reports a held message as pending_approval, not as delivered', async () => {
    configure()
    mockFetch([{ ok: true, body: { id: 'm9', status: 'pending_approval', thread_id: 't9' } }])
    const result = await sendEmail({ to: 'a@b.co', subject: 's', text: 't' })
    expect(result).toMatchObject({ sent: true, id: 'm9', status: 'pending_approval', threadId: 't9' })
  })

  it("surfaces the platform's own rejection rather than a generic failure", async () => {
    configure()
    mockFetch([{ ok: false, status: 400, body: { error: { message: 'recipient is suppressed after a hard bounce' } } }])
    const result = await sendEmail({ to: 'a@b.co', subject: 's', text: 't' })
    expect(result).toEqual({
      sent: false,
      reason: 'error',
      error: 'recipient is suppressed after a hard bounce',
    })
  })

  it('reports a network failure as an error, never as a send', async () => {
    configure()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('ECONNREFUSED')
      }),
    )
    const result = await sendEmail({ to: 'a@b.co', subject: 's', text: 't' })
    expect(result.sent).toBe(false)
    expect(result.sent === false && result.error).toContain('ECONNREFUSED')
  })

  it('rejects a body-less or recipient-less send before hitting the network', async () => {
    configure()
    const calls = mockFetch([OK])
    expect(await sendEmail({ to: 'a@b.co', subject: 's' })).toMatchObject({ sent: false, reason: 'error' })
    expect(await sendEmail({ to: [], subject: 's', text: 't' })).toMatchObject({ sent: false, reason: 'error' })
    expect(calls).toHaveLength(0)
  })

  it('passes an idempotency key through unchanged', async () => {
    configure()
    const calls = mockFetch([OK])
    await sendEmail({ to: ['a@b.co', 'c@d.co'], subject: 's', text: 't', clientId: 'welcome-42' })
    expect(calls[0]!.body.client_id).toBe('welcome-42')
  })
})

describe('recipients', () => {
  it('sends several recipients as ONE message', async () => {
    configure()
    const calls = mockFetch([OK])
    const result = await sendEmail({ to: ['a@b.co', 'c@d.co'], subject: 's', text: 't' })

    expect(calls).toHaveLength(1)
    expect(calls[0]!.body.to).toEqual(['a@b.co', 'c@d.co'])
    expect(result.sent).toBe(true)
  })

  it('carries cc and bcc through', async () => {
    configure()
    const calls = mockFetch([OK])
    await sendEmail({ to: 'a@b.co', cc: ['c@d.co'], bcc: ['hidden@e.co'], subject: 's', text: 't' })
    expect(calls[0]!.body).toMatchObject({ cc: ['c@d.co'], bcc: ['hidden@e.co'] })
  })

  it('reports suppressed recipients even on a successful send', async () => {
    configure()
    mockFetch([{ ok: true, body: { id: 'm1', status: 'sent', thread_id: 't1', suppressed: ['bad@x.co'] } }])
    const result = await sendEmail({ to: ['a@b.co', 'bad@x.co'], subject: 's', text: 't' })
    expect(result.sent === true && result.suppressed).toEqual(['bad@x.co'])
  })

  it('defaults suppressed to an empty list when the platform says nothing', async () => {
    configure()
    mockFetch([{ ok: true, body: { id: 'm1', status: 'sent', thread_id: 't1' } }])
    const result = await sendEmail({ to: 'a@b.co', subject: 's', text: 't' })
    expect(result.sent === true && result.suppressed).toEqual([])
  })
})
