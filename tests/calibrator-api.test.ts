/**
 * Integration tests for the calibration API endpoint.
 * Tests /api/v1/calibrate with real requests.
 *
 * NOTE: These tests require the dev server to be running.
 * Run with: npm run dev in one terminal, then npm run test in another
 */

import { describe, it, expect } from 'vitest'

const BASE_URL = 'http://localhost:3540'

describe('POST /api/v1/calibrate', () => {
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

  it('respects language parameter', async () => {
    const text = 'El análisis muestra que los resultados son claros.'

    const response = await fetch(`${BASE_URL}/api/v1/calibrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language: 'es' }),
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.result.language).toBe('es')
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

    expect(data.limits).toBeDefined()
    expect(data.limits.daily).toBe(5000) // Free tier limit
    expect(data.limits.used).toBeGreaterThanOrEqual(0)
    expect(data.limits.remaining).toBeGreaterThanOrEqual(0)
    expect(data.limits.resetAt).toBeDefined()
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

  it('handles very long text', async () => {
    // Generate 1000-word text
    const words = Array(1000).fill('The quick brown fox jumps over the lazy dog.').join(' ')

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
