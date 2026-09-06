/**
 * Integration tests for the calibration API endpoint.
 * Tests /api/v1/calibrate with real requests against a running server.
 *
 * These need `npm run dev` in another terminal. When no server is listening
 * they SKIP rather than fail, and say so loudly.
 *
 * The alternative was leaving `npm run check` unable to pass on its own,
 * which trains everyone to read a red suite as normal. A skipped test that
 * announces itself is honest; eighteen connection errors reported as
 * assertion failures is not, because it says the endpoint is broken when
 * what is actually true is that nothing was listening.
 */

import { describe, it, expect } from 'vitest'

const BASE_URL = 'http://localhost:3540'

async function serverIsUp(): Promise<boolean> {
  try {
    const res = await fetch(BASE_URL, { signal: AbortSignal.timeout(2000) })
    return res.ok || res.status < 500
  } catch {
    return false
  }
}

const SERVER_UP = await serverIsUp()

if (!SERVER_UP) {
  console.warn(
    '\n[calibrator-api] SKIPPED: no server on ' +
      BASE_URL +
      '.\n[calibrator-api] These are real HTTP integration tests. Start `npm run dev` and re-run to exercise them.\n',
  )
}

describe.skipIf(!SERVER_UP)('POST /api/v1/calibrate', () => {
  it('requires text parameter', async () => {
    const response = await fetch(`${BASE_URL}/api/v1/calibrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('validation_error')
  })

  it('rejects empty text', async () => {
    const response = await fetch(`${BASE_URL}/api/v1/calibrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '   ' }),
    })

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('validation_error')
  })

  it('processes valid text with default options', async () => {
    const text = 'The quick brown fox jumps over the lazy dog.'

    const response = await fetch(`${BASE_URL}/api/v1/calibrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })

    expect(response.status).toBe(200)
    const data = await response.json()

    // Verify response structure
    expect(data.result).toBeDefined()
    expect(data.result.status).toBe('ok')
    expect(data.result.original).toBeDefined()
    expect(data.result.original.tokens).toBe(9)
    expect(data.result.substitutions).toBeDefined()
    expect(Array.isArray(data.result.substitutions)).toBe(true)
    expect(data.result.revised).toBeDefined()
    expect(data.result.comparison).toBeDefined()
  })

  it('respects language parameter for a language the calibrate dictionary covers', async () => {
    const text = 'The analysis shows that the results are clear.'

    const response = await fetch(`${BASE_URL}/api/v1/calibrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language: 'en' }),
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.result.language).toBe('en')
  })

  it('honestly rejects a schema-valid language the calibrate dictionary does not cover yet', async () => {
    // 'es' passes SUPPORTED_LANGUAGES validation (the detector supports it),
    // but the calibrate synonym dictionary is English-only today
    // (src/lib/calibrate/dictionary.ts). This must be a clear 400, not a
    // 500 that reads as an unrelated server malfunction.
    const text = 'El análisis muestra que los resultados son claros.'

    const response = await fetch(`${BASE_URL}/api/v1/calibrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language: 'es' }),
    })

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('language_not_supported')
  })

  it('rejects invalid language codes', async () => {
    const response = await fetch(`${BASE_URL}/api/v1/calibrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Hello', language: 'invalid_language' }),
    })

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('validation_error')
  })

  it('accepts preview mode', async () => {
    const response = await fetch(`${BASE_URL}/api/v1/calibrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'The quick brown fox.', mode: 'preview' }),
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.result.status).toBe('ok')
    expect(data.result.appliedAt).toBeUndefined() // Preview mode doesn't include timestamp
  })

  it('accepts apply mode', async () => {
    const response = await fetch(`${BASE_URL}/api/v1/calibrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'The quick brown fox.', mode: 'apply' }),
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.result.status).toBe('ok')
    expect(data.result.appliedAt).toBeDefined() // Apply mode includes timestamp
  })

  it('rejects invalid mode values', async () => {
    const response = await fetch(`${BASE_URL}/api/v1/calibrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Hello', mode: 'invalid_mode' }),
    })

    expect(response.status).toBe(400)
  })

  it('returns usage information', async () => {
    const text = 'The analysis demonstrates the findings confirm the hypothesis.'

    const response = await fetch(`${BASE_URL}/api/v1/calibrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })

    expect(response.status).toBe(200)
    const data = await response.json()

    expect(data.usage).toBeDefined()
    expect(data.usage.tokens).toBeGreaterThan(0)
    expect(data.usage.billableWords).toBeGreaterThan(0)
    expect(data.usage.billableCost).toBeNull() // No API key = no cost
  })

  it('includes limits information', async () => {
    const response = await fetch(`${BASE_URL}/api/v1/calibrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'The quick brown fox.' }),
    })

    expect(response.status).toBe(200)
    const data = await response.json()

    // Anonymous calls report a real per-request word cap (the same
    // PLANS.anonymous.wordCap the browser check uses), not a fabricated
    // "daily usage" figure: there is no caller identity in a stateless REST
    // call to track cumulative usage against.
    expect(data.limits).toBeDefined()
    expect(data.limits.requestWordCap).toBe(1500)
    expect(typeof data.limits.note).toBe('string')
  })

  it('rejects an anonymous request over the per-request word cap', async () => {
    const words = Array(1600).fill('word').join(' ')

    const response = await fetch(`${BASE_URL}/api/v1/calibrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: words }),
    })

    expect(response.status).toBe(413)
    const data = await response.json()
    expect(data.error).toBe('request_too_large')
    expect(data.limit).toBe(1500)
  })

  it('preserves token count', async () => {
    const text = 'The analysis shows the findings and the conclusions are clear.'

    const response = await fetch(`${BASE_URL}/api/v1/calibrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    const result = data.result

    expect(result.original.tokens).toBe(result.revised.tokens)
  })

  it('returns metrics with reasonable values', async () => {
    const response = await fetch(`${BASE_URL}/api/v1/calibrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'The quick brown fox jumps over the lazy dog. The analysis reveals the findings are significant.',
      }),
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    const metrics = data.result.original.metrics

    // Sanity checks
    expect(metrics.tokens).toBeGreaterThan(0)
    expect(metrics.uniqueTokens).toBeGreaterThan(0)
    expect(metrics.uniqueTokens).toBeLessThanOrEqual(metrics.tokens)
    expect(metrics.typeTokenRatio).toBeGreaterThanOrEqual(0)
    expect(metrics.typeTokenRatio).toBeLessThanOrEqual(1)
    expect(metrics.averageTokenFrequency).toBeGreaterThan(0)
  })

  it('handles long text up to the anonymous word cap', async () => {
    // 150 repeats of a 9-word sentence = 1,350 words, under the 1,500-word
    // anonymous cap (PLANS.anonymous.wordCap) so this exercises a large
    // document without tripping the 413 rejection tested separately above.
    const words = Array(150).fill('The quick brown fox jumps over the lazy dog.').join(' ')

    const response = await fetch(`${BASE_URL}/api/v1/calibrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: words }),
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.result.status).toBe('ok')
    expect(data.result.original.tokens).toBeGreaterThan(1000)
  })

  it('respects config options', async () => {
    const response = await fetch(`${BASE_URL}/api/v1/calibrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'The quick brown fox jumps over the lazy dog.',
        config: {
          confidenceThreshold: 0.9,
          maxRepeats: 5,
        },
      }),
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.result.status).toBe('ok')
    // Config was applied (exact behavior depends on text content)
  })

  it('returns processing time', async () => {
    const response = await fetch(`${BASE_URL}/api/v1/calibrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'The quick brown fox.' }),
    })

    expect(response.status).toBe(200)
    const data = await response.json()

    expect(data.result.processingTimeMs).toBeGreaterThanOrEqual(0)
    expect(data.result.processingTimeMs).toBeLessThan(1000) // Should be fast
  })

  it('responds to OPTIONS requests', async () => {
    const response = await fetch(`${BASE_URL}/api/v1/calibrate`, {
      method: 'OPTIONS',
    })

    expect(response.status).toBe(200)
    // Check CORS headers
    expect(response.headers.get('access-control-allow-methods')).toContain('POST')
    expect(response.headers.get('access-control-allow-headers')).toContain('Content-Type')
  })
})
