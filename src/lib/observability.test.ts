import { beforeEach, describe, expect, it, vi } from 'vitest'

const captureException = vi.fn()
const captureMessage = vi.fn()
vi.mock('@sentry/nextjs', () => ({
  captureException: (...a: unknown[]) => captureException(...a),
  captureMessage: (...a: unknown[]) => captureMessage(...a),
  flush: vi.fn().mockResolvedValue(true),
}))

const { captureServerError, captureServerMessage, safeContext } = await import('./observability')

beforeEach(() => {
  captureException.mockReset()
  captureMessage.mockReset()
})

describe('safeContext', () => {
  it('keeps ids, codes, counts and flags and omits free text and objects', () => {
    expect(
      safeContext({
        scope: 'x',
        userId: 'user_1',
        status: 502,
        retried: true,
        reason: 'not_configured',
        email: 'jane@example.com',
        note: 'a sentence with spaces',
        body: { text: 'draft' },
        missing: undefined,
      }),
    ).toEqual({
      userId: 'user_1',
      status: 502,
      retried: true,
      reason: 'not_configured',
      email: '[omitted]',
      note: '[omitted]',
      body: '[omitted]',
    })
  })
})

describe('captureServerError', () => {
  it('reports with the scope tag and ids-only extras', () => {
    const err = new Error('boom')
    captureServerError(err, { scope: 'billing_webhook', userId: 'u1', detail: 'jane@example.com wrote this' })
    expect(captureException).toHaveBeenCalledWith(err, {
      tags: { scope: 'billing_webhook' },
      extra: { userId: 'u1', detail: '[omitted]' },
    })
  })

  it('never throws, even if Sentry does', () => {
    captureException.mockImplementation(() => {
      throw new Error('sdk down')
    })
    expect(() => captureServerError(new Error('x'))).not.toThrow()
  })

  it('is loud on the console when no DSN is configured', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    delete process.env.SENTRY_DSN
    delete process.env.NEXT_PUBLIC_SENTRY_DSN
    captureServerError(new Error('x'), { scope: 'demo' })
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})

describe('captureServerMessage', () => {
  it('reports a warning with ids-only extras', () => {
    captureServerMessage('thing happened', { scope: 'demo', count: 2, who: 'a b c' })
    expect(captureMessage).toHaveBeenCalledWith('thing happened', {
      level: 'warning',
      tags: { scope: 'demo' },
      extra: { count: 2, who: '[omitted]' },
    })
  })
})
