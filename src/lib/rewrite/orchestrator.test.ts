import { describe, expect, it, beforeEach } from 'vitest'
import { rewriteDocument } from './orchestrator'
import { createRuleBasedBackend } from './backend/rule-based'
import { OPEN_REFERENCE_KEY } from '@/lib/detector/keys'
import { generateMarkedText } from '@/lib/detector/simulate'
import { checkDocument } from '@/lib/detector'
import { clearDictionaryCache } from '@/lib/calibrate/dictionary'
import type { RewriteRequest } from './types'

// Vocabulary drawn from words the calibrate dictionary actually has synonyms
// for, so the rule-based backend has real substitutions available. This is
// what makes the "evidence goes down" assertion meaningful rather than a
// no-op pass.
const VOCAB = ['the', 'and', 'make', 'get', 'go', 'use', 'help', 'with', 'can', 'will', 'take', 'give', 'find', 'work']

describe('rewriteDocument', () => {
  beforeEach(() => {
    clearDictionaryCache()
  })

  it('reduces measurable watermark evidence on a document marked under the reference key', async () => {
    const marked = generateMarkedText(OPEN_REFERENCE_KEY, VOCAB, 300, 42)
    const before = await checkDocument(marked, { keys: [OPEN_REFERENCE_KEY], language: 'en' })
    expect(before.watermark.results[0].status).toBe('computed')

    const request: RewriteRequest = { text: marked, language: 'en', strength: 'aggressive', tier: 'pro' }
    const backend = createRuleBasedBackend('en')
    const result = await rewriteDocument(request, backend, [OPEN_REFERENCE_KEY])

    expect(result.status).toBe('ok')
    const beforeZ = result.documentBefore?.watermark.results[0].z ?? null
    const afterZ = result.documentAfter?.watermark.results[0].z ?? null
    expect(beforeZ).not.toBeNull()
    expect(afterZ).not.toBeNull()
    expect(afterZ!).toBeLessThan(beforeZ!)
  })

  it('never claims a passage was changed without a fact-lock-passing candidate', async () => {
    const marked = generateMarkedText(OPEN_REFERENCE_KEY, VOCAB, 200, 11)
    const request: RewriteRequest = { text: marked, language: 'en', strength: 'balanced', tier: 'free' }
    const backend = createRuleBasedBackend('en')
    const result = await rewriteDocument(request, backend, [OPEN_REFERENCE_KEY])

    for (const passage of result.passages) {
      if (passage.chosen !== null) {
        const chosenCandidate = passage.candidates.find((c) => c.text === passage.chosen)
        expect(chosenCandidate?.factLockPassed).toBe(true)
      } else {
        expect(passage.reason).toBe('unchanged-no-safe-candidate')
      }
    }
  })

  it('stops after MAX_ROUNDS and always reports the honesty limits', async () => {
    const marked = generateMarkedText(OPEN_REFERENCE_KEY, VOCAB, 150, 5)
    const request: RewriteRequest = { text: marked, language: 'en', strength: 'regenerate', tier: 'pro' }
    const backend = createRuleBasedBackend('en')
    const result = await rewriteDocument(request, backend, [OPEN_REFERENCE_KEY])

    expect(result.roundsUsed).toBeLessThanOrEqual(5)
    expect(result.limits.length).toBeGreaterThan(0)
    expect(result.limits.some((l) => /cannot guarantee/i.test(l))).toBe(true)
  })

  it('returns an error result for empty input rather than throwing', async () => {
    const backend = createRuleBasedBackend('en')
    const result = await rewriteDocument({ text: '   ', strength: 'balanced', tier: 'free' }, backend, [OPEN_REFERENCE_KEY])
    expect(result.status).toBe('error')
  })

  describe('word-change target', () => {
    const text = () => generateMarkedText(OPEN_REFERENCE_KEY, VOCAB, 400, 21)

    it('reports the word-change share and a null target when none was requested', async () => {
      const result = await rewriteDocument(
        { text: text(), language: 'en', strength: 'balanced', tier: 'free' },
        createRuleBasedBackend('en'),
        [OPEN_REFERENCE_KEY],
      )
      expect(result.targetWordChangeReached).toBeNull()
      expect(result.wordChangePercent).toBeGreaterThanOrEqual(0)
      expect(result.wordChangePercent).toBeLessThanOrEqual(100)
    })

    it('changes at least as many words as the same run without a target, and reports honestly whether it got there', async () => {
      const base: RewriteRequest = { text: text(), language: 'en', strength: 'preserve', tier: 'pro' }
      const without = await rewriteDocument(base, createRuleBasedBackend('en'), [OPEN_REFERENCE_KEY])
      const withTarget = await rewriteDocument(
        { ...base, targetWordChangePercent: 25 },
        createRuleBasedBackend('en'),
        [OPEN_REFERENCE_KEY],
      )
      expect(withTarget.wordChangePercent).toBeGreaterThanOrEqual(without.wordChangePercent)
      // The flag must agree with the number it summarises, in both directions.
      expect(withTarget.targetWordChangeReached).toBe(withTarget.wordChangePercent >= 25)
    })

    it('never pushes a passage through without a fact-lock-passing candidate', async () => {
      const result = await rewriteDocument(
        { text: text(), language: 'en', strength: 'preserve', tier: 'pro', targetWordChangePercent: 40 },
        createRuleBasedBackend('en'),
        [OPEN_REFERENCE_KEY],
      )
      for (const passage of result.passages) {
        if (passage.chosen !== null && passage.chosen !== passage.original) {
          expect(passage.candidates.find((c) => c.text === passage.chosen)?.factLockPassed).toBe(true)
        }
      }
    })
  })
})
