import { describe, expect, it } from 'vitest'
import { CLIENT_DENIED_URLS, CLIENT_IGNORED_ERROR_PATTERNS } from '@/lib/sentry-filters'

describe('browser noise filters', () => {
  it('ignores wallet-extension errors (NEVERPROMPTED_WEB-2)', () => {
    for (const message of ['Failed to connect to MetaMask', 'MetaMask extension not found']) {
      expect(CLIENT_IGNORED_ERROR_PATTERNS.some((p) => p.test(message))).toBe(true)
    }
  })

  it('denies extension scripts but not the site’s own bundles', () => {
    expect(CLIENT_DENIED_URLS.some((p) => p.test('chrome-extension://abc/inpage.js'))).toBe(true)
    expect(CLIENT_DENIED_URLS.some((p) => p.test('app:///scripts/inpage.js'))).toBe(true)
    expect(CLIENT_DENIED_URLS.some((p) => p.test('https://www.neverprompted.com/_next/static/chunks/app.js'))).toBe(false)
  })

  it('does not swallow ordinary errors', () => {
    expect(CLIENT_IGNORED_ERROR_PATTERNS.some((p) => p.test('TypeError: x is undefined'))).toBe(false)
  })
})
