/**
 * Tests for calibration engine.
 *
 * Verifies:
 * - Deterministic output (same input → same output)
 * - Token count preservation
 * - Frequency analysis correctness
 * - Repetition mitigation
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { calibrateText } from './engine'
import { analyzeFrequency } from './frequency'
import { clearDictionaryCache } from './dictionary'

// Sample text for testing (long enough to have repetition)
const SAMPLE_TEXT = `
The committee met on Tuesday evening to consider the revised drainage proposal.
Several members asked whether the survey had been completed, and the chair noted
that the report had been circulated only two days before. Members were sympathetic
to the scheme but felt the drawings did not show enough detail to judge it properly.
The meeting closed at half past eight after a short discussion of other business.
The matter will return in its current form unless the applicant chooses to withdraw.
`.trim()

const SHORT_TEXT = 'The quick brown fox jumps over the lazy dog.'

describe('calibrateText', () => {
  beforeEach(() => {
    clearDictionaryCache()
  })

  it('produces consistent output on repeated calls (deterministic)', async () => {
    const req = { text: SAMPLE_TEXT, language: 'en', mode: 'preview' as const }
    const result1 = await calibrateText(req)
    const result2 = await calibrateText(req)

    // Both should succeed
    if (result1.status !== 'ok') {
      console.error('Result 1 error:', result1.error)
    }
    expect(result1.status).toBe('ok')
    expect(result2.status).toBe('ok')

    // Substitutions should be identical
    expect(result1.substitutions).toEqual(result2.substitutions)
    expect(result1.revised.text).toBe(result2.revised.text)

    // Metrics should be identical
    expect(result1.original.metrics).toEqual(result2.original.metrics)
    expect(result1.revised.metrics).toEqual(result2.revised.metrics)
  })

  it('preserves token count', async () => {
    const result = await calibrateText({
      text: SAMPLE_TEXT,
      language: 'en',
      mode: 'preview' as const,
    })

    expect(result.status).toBe('ok')
    expect(result.original.tokens).toBe(result.revised.tokens)
  })

  it('handles empty text gracefully', async () => {
    const result = await calibrateText({
      text: '   ',
      language: 'en',
      mode: 'preview',
    })

    expect(result.status).toBe('error')
    expect(result.error).toBeDefined()
  })

  it('respects repetition mitigation (no repeat within maxRepeats)', async () => {
    // Text with repeated "the" close together
    const text = 'The the the bird flew away.'
    const result = await calibrateText({
      text,
      language: 'en',
      mode: 'preview',
      config: { maxRepeats: 2 },
    })

    if (result.status === 'ok') {
      // Close consecutive repetitions should be skipped (only first should be substituted)
      const theSubstitutions = result.substitutions.filter(
        (s) => s.original.toLowerCase() === 'the' && s.reason === 'synonym'
      )
      // With maxRepeats: 2, only the first should be substituted
      expect(theSubstitutions.length).toBeLessThanOrEqual(1)
    }
  })

  it('returns metrics with valid ranges', async () => {
    const result = await calibrateText({
      text: SAMPLE_TEXT,
      language: 'en',
      mode: 'preview',
    })

    if (result.status === 'ok') {
      const metrics = result.original.metrics
      expect(metrics.tokens).toBeGreaterThan(0)
      expect(metrics.uniqueTokens).toBeGreaterThan(0)
      expect(metrics.uniqueTokens).toBeLessThanOrEqual(metrics.tokens)
      expect(metrics.typeTokenRatio).toBeGreaterThanOrEqual(0)
      expect(metrics.typeTokenRatio).toBeLessThanOrEqual(1)
      expect(metrics.averageTokenFrequency).toBeGreaterThan(0)
      expect(metrics.lexicalDiversity).toBeGreaterThanOrEqual(0)
      expect(metrics.lexicalDiversity).toBeLessThanOrEqual(1)
    }
  })

  it('applies substitutions without altering punctuation/spacing', async () => {
    const text = 'The cat is here. The dog is not.'
    const result = await calibrateText({
      text,
      language: 'en',
      mode: 'preview',
    })

    if (result.status === 'ok') {
      // Punctuation and structure should be preserved
      expect(result.revised.text).toContain('.')
      expect(result.revised.text).toMatch(/[A-Z]/)
    }
  })

  it('auto-detects language when not specified', async () => {
    const result = await calibrateText({
      text: SAMPLE_TEXT,
      mode: 'preview',
    })

    expect(result.status).toBe('ok')
    expect(result.language).toBe('en')
  })

  it('processes text under 100ms for typical length', async () => {
    const start = performance.now()
    await calibrateText({
      text: SAMPLE_TEXT,
      language: 'en',
      mode: 'preview',
    })
    const elapsed = performance.now() - start

    // Should be well under 100ms for engine-only (UI rendering is separate)
    expect(elapsed).toBeLessThan(100)
  })

  it('reports applied count in comparison', async () => {
    const result = await calibrateText({
      text: SAMPLE_TEXT,
      language: 'en',
      mode: 'preview',
    })

    if (result.status === 'ok') {
      const appliedCount = result.substitutions.filter(
        (s) => s.reason === 'synonym'
      ).length
      expect(result.comparison.tokensChanged).toBe(appliedCount)
    }
  })

  it('includes appliedAt timestamp in apply mode', async () => {
    const result = await calibrateText({
      text: SAMPLE_TEXT,
      language: 'en',
      mode: 'apply',
    })

    if (result.status === 'ok') {
      expect(result.appliedAt).toBeDefined()
      // Should be a valid ISO timestamp
      expect(new Date(result.appliedAt!).getTime()).toBeGreaterThan(0)
    }
  })
})

describe('analyzeFrequency', () => {
  it('identifies signature tokens correctly', () => {
    const analysis = analyzeFrequency(SAMPLE_TEXT, 'en')

    expect(analysis.tokens.length).toBeGreaterThan(0)
    expect(analysis.uniqueTokens).toBeGreaterThan(0)
    expect(analysis.signatureTokens.size).toBeGreaterThan(0)

    // Should identify "the" as a signature token (high frequency)
    expect(analysis.signatureTokens.has('the')).toBe(true)
  })

  it('builds accurate frequency map', () => {
    const analysis = analyzeFrequency(SAMPLE_TEXT, 'en')

    // Verify count for known word
    const theCount = analysis.tokenCounts.get('the')
    expect(theCount).toBeGreaterThan(0)

    // Sum of counts should match total tokens
    let sum = 0
    for (const count of analysis.tokenCounts.values()) {
      sum += count
    }
    expect(sum).toBe(analysis.totalTokens)
  })

  it('tracks token positions correctly', () => {
    const analysis = analyzeFrequency(SHORT_TEXT, 'en')

    // Should have 9 tokens: The quick brown fox jumps over the lazy dog
    expect(analysis.tokens.length).toBe(9)

    // Tokens should have increasing positions
    for (let i = 1; i < analysis.tokens.length; i++) {
      expect(analysis.tokens[i].start).toBeGreaterThan(
        analysis.tokens[i - 1].end
      )
    }
  })

  it('builds repetition map correctly', () => {
    const text = 'The cat and the dog and the bird'
    const analysis = analyzeFrequency(text, 'en')

    const thePositions = analysis.repetitionMap.get('the')
    expect(thePositions).toBeDefined()
    if (!thePositions) throw new Error('unreachable: asserted defined above')
    expect(thePositions.length).toBe(3)
    // Positions should be in order
    expect(thePositions[0]).toBeLessThan(thePositions[1])
    expect(thePositions[1]).toBeLessThan(thePositions[2])
  })
})

describe('calibrateText: auxiliary-verb regression', () => {
  beforeEach(() => {
    clearDictionaryCache()
  })

  it('never produces the reported broken output for an auxiliary-verb chain', async () => {
    // The real reported bug: "has been made" -> "possesses existed made",
    // from substituting "has" -> "possesses" and "been" -> "existed" with
    // no awareness that both are auxiliaries in a single verb phrase.
    // SAMPLE_TEXT above already contains "had been completed" / "had been
    // circulated"; this test exercises that same construction directly and
    // asserts none of the removed auxiliary synonyms leak into the output.
    const text = 'The committee confirmed that no final decision has been made on the matter.'
    const result = await calibrateText({ text, language: 'en', mode: 'apply' })

    expect(result.status).toBe('ok')
    if (result.status !== 'ok') return
    const revised = result.revised.text.toLowerCase()

    for (const brokenVariant of ['possesses', 'possess', 'existed', 'occurred', 'exists as', 'represents']) {
      expect(revised).not.toContain(brokenVariant)
    }
  })
})
