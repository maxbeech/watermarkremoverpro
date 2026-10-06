import { describe, expect, it } from 'vitest'
import type { ErrorEvent, Log } from '@sentry/nextjs'
import { scrubBreadcrumb, scrubEvent, scrubLog, scrubText, scrubTransaction, scrubValue } from './scrub'

// Built at runtime so no secret-shaped literal sits in the source for scanners to flag.
const STRIPE_KEY = ['sk', 'live', 'A1b2C3d4E5f6G7h8I9j0'].join('_')
const WHSEC = ['whsec', 'A1b2C3d4E5f6G7h8I9j0K1'].join('_')
const API_KEY = ['mw', 'live', 'abcdef1234567890abcd'].join('_')
const JWT = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dBjftJeZ4CVPmB92K27uhbUJU1p1r'

describe('scrubText', () => {
  it.each([
    ['an email', 'failed for jane.doe@example.co.uk today', 'jane.doe@example.co.uk'],
    ['a phone number', 'call +44 7700 900123 now', '7700 900123'],
    ['a national phone number', 'call 07700 900 123 now', '900 123'],
    ['a bearer token', 'Authorization failed: Bearer abc123DEF456ghi789', 'abc123DEF456ghi789'],
    ['a JWT', `token seen ${JWT}`, JWT],
    ['a Stripe key', `using ${STRIPE_KEY} here`, STRIPE_KEY],
    ['a webhook secret', `secret is ${WHSEC}`, WHSEC],
    ['an API key', `key ${API_KEY} rejected`, API_KEY],
    ['a password pair', 'login with password=hunter2hunter2 failed', 'hunter2hunter2'],
    ['a serialised object', '{"user":"x","client_secret":"s3cr3t-value-123","ok":true}', 's3cr3t-value-123'],
    ['url credentials', 'connect postgres://admin:p4ssw0rd@db.example.com/app', 'p4ssw0rd'],
  ])('redacts %s', (_label, input, secret) => {
    const out = scrubText(input)
    expect(out).not.toContain(secret)
    expect(out).toContain('[redacted]')
  })

  it('strips query strings from urls inside text', () => {
    expect(scrubText('GET https://x.example.com/reset?token=abc&x=1 failed')).toBe(
      'GET https://x.example.com/reset failed',
    )
  })

  it('keeps ordinary text, timestamps and dates intact', () => {
    expect(scrubText('rewrite failed for run 42 after 3 retries')).toBe('rewrite failed for run 42 after 3 retries')
    expect(scrubText('at 1791308596801 on 2026-10-06')).toBe('at 1791308596801 on 2026-10-06')
  })

  it('stays fast on a long adversarial string and truncates it', () => {
    const attacks = [
      'a'.repeat(200_000),
      '1 '.repeat(100_000),
      `password=${'"'.repeat(50_000)}`,
      `${'a'.repeat(60)}@${'b.'.repeat(50_000)}`,
      `Bearer ${' '.repeat(50_000)}`,
      `eyJ${'a'.repeat(100_000)}`,
      '(((((' + '+1-'.repeat(50_000),
      `token${'='.repeat(50_000)}`,
    ]
    const start = performance.now()
    for (const a of attacks) {
      const out = scrubText(a)
      expect(out.length).toBeLessThanOrEqual(10_100)
    }
    expect(performance.now() - start).toBeLessThan(1500)
  })
})

describe('scrubValue', () => {
  it('redacts secret, personal and document keys but keeps ids and counts', () => {
    const out = scrubValue({
      userId: 'user_1',
      count: 3,
      Authorization: 'Bearer x',
      stripe_secret_key: 'abc',
      email: 'a@b.com',
      text: 'my whole draft',
      nested: { password: 'p', ok: 'fine' },
    }) as Record<string, unknown>
    expect(out.userId).toBe('user_1')
    expect(out.count).toBe(3)
    expect(out.Authorization).toBe('[redacted]')
    expect(out.stripe_secret_key).toBe('[redacted]')
    expect(out.email).toBe('[redacted]')
    expect(out.text).toBe('[redacted]')
    expect(out.nested).toEqual({ password: '[redacted]', ok: 'fine' })
  })

  it('strips query strings from url, to and from', () => {
    const out = scrubValue({ url: '/a?x=1', to: '/b?y=2#h', from: '/c?z=3' }) as Record<string, string>
    expect(out).toEqual({ url: '/a', to: '/b', from: '/c' })
  })

  it('does not recurse forever on deep or cyclic input', () => {
    const a: Record<string, unknown> = {}
    a.self = a
    expect(() => scrubValue(a)).not.toThrow()
  })
})

describe('scrubEvent', () => {
  const base = (): ErrorEvent =>
    ({
      type: undefined,
      message: `failed for jane@example.com with ${STRIPE_KEY}`,
      exception: { values: [{ type: 'Error', value: `Bearer abc123DEF456ghi789 rejected` }] },
      request: {
        url: 'https://x.example.com/p?token=abc',
        query_string: 'token=abc',
        cookies: { a: 'b' },
        data: { text: 'draft' },
        headers: { authorization: 'Bearer zzz', accept: 'text/html' },
      },
      extra: { password: 'x', runId: 'run_1' },
      user: { id: 'u1', email: 'jane@example.com', ip_address: '1.2.3.4' },
      contexts: { os: { name: 'macOS' } },
      breadcrumbs: [{ message: 'hit https://a.example.com/x?token=1', data: { url: '/y?z=1' } }],
    }) as unknown as ErrorEvent

  it('scrubs message, exception, request, extra, user and breadcrumbs', () => {
    const out = scrubEvent(base())!
    const json = JSON.stringify(out)
    expect(json).not.toMatch(/jane@example|sk_live|abc123DEF|token=|1\.2\.3\.4|"draft"|zzz/)
    expect(out.request?.url).toBe('https://x.example.com/p')
    expect(out.user).toEqual({ id: 'u1' })
    expect(out.extra).toEqual({ password: '[redacted]', runId: 'run_1' })
    expect(out.contexts).toEqual({ os: { name: 'macOS' } })
    expect(out.breadcrumbs?.[0].data).toEqual({ url: '/y' })
  })

  it('keeps name and email on a feedback event', () => {
    const fb = {
      type: 'feedback',
      contexts: { feedback: { message: `QA test, please ignore: mail me at a@b.com ${STRIPE_KEY}`, contact_email: 'a@b.com', name: 'Ann' } },
      user: { email: 'a@b.com', username: 'Ann' },
    } as unknown as ErrorEvent
    const out = scrubEvent(fb)!
    const ctx = (out.contexts as { feedback: Record<string, string> }).feedback
    expect(ctx.contact_email).toBe('a@b.com')
    expect(ctx.name).toBe('Ann')
    expect(ctx.message).toContain('a@b.com')
    expect(ctx.message).not.toContain(STRIPE_KEY)
    expect(out.user?.email).toBe('a@b.com')
  })

  it('fails closed: returns null instead of the raw event when scrubbing throws', () => {
    const hostile = base()
    Object.defineProperty(hostile, 'extra', {
      get() {
        throw new Error('boom')
      },
    })
    expect(scrubEvent(hostile)).toBeNull()
  })
})

describe('scrubLog', () => {
  it('scrubs message and attributes', () => {
    const out = scrubLog({
      level: 'error',
      message: `mail to jane@example.com failed ${WHSEC}`,
      attributes: { token: 'abc', runId: 'run_1', note: `see ${JWT}` },
    } as Log)!
    expect(JSON.stringify(out)).not.toMatch(/jane@example|whsec_|eyJ/)
    expect(out.attributes).toMatchObject({ token: '[redacted]', runId: 'run_1' })
  })

  it('fails closed', () => {
    const log = { level: 'info', message: 'x' } as Log
    Object.defineProperty(log, 'attributes', {
      get() {
        throw new Error('boom')
      },
    })
    expect(scrubLog(log)).toBeNull()
  })
})

describe('scrubBreadcrumb', () => {
  it('scrubs message and strips query strings from url, to and from', () => {
    const out = scrubBreadcrumb({
      category: 'navigation',
      message: 'user jane@example.com',
      data: { from: '/a?x=1', to: '/b?token=2', url: 'https://h.example.com/c?k=3' },
    })!
    expect(out.message).toBe('user [redacted]')
    expect(out.data).toEqual({ from: '/a', to: '/b', url: 'https://h.example.com/c' })
  })

  it('fails closed', () => {
    const crumb = { message: 'x' }
    Object.defineProperty(crumb, 'data', {
      get() {
        throw new Error('boom')
      },
      enumerable: true,
    })
    expect(scrubBreadcrumb(crumb)).toBeNull()
  })
})

describe('scrubTransaction', () => {
  it('strips query strings from the request url and span data', () => {
    const out = scrubTransaction({
      transaction: '/reset?token=abc',
      request: { url: 'https://x.example.com/reset?token=abc', query_string: 'token=abc' },
      spans: [
        { description: 'GET https://api.example.com/v1?key=1', data: { 'http.url': 'https://api.example.com/v1?key=1', 'url.query': 'key=1', status: 200 } },
      ],
    })!
    const json = JSON.stringify(out)
    expect(json).not.toMatch(/token=|key=/)
    expect(out.request.url).toBe('https://x.example.com/reset')
    expect(out.spans[0].data).toEqual({ 'http.url': 'https://api.example.com/v1', status: 200 })
  })

  it('fails closed', () => {
    const t = { transaction: 'x' }
    Object.defineProperty(t, 'request', {
      get() {
        throw new Error('boom')
      },
    })
    expect(scrubTransaction(t)).toBeNull()
  })
})
