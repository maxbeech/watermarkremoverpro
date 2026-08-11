import { describe, expect, it } from 'vitest'
import { utf8 } from './crypto'
import type { DetectionKey } from './keys'
import { OPEN_REFERENCE_KEY } from './keys'
import { generateMarkedText } from './simulate'
import { tokenize } from './tokenize'
import { distinctBigrams, isGreen, testWatermark, MIN_TRIALS } from './watermark'

const otherKey: DetectionKey = {
  ...OPEN_REFERENCE_KEY,
  id: 'test-other',
  label: 'Unrelated test key',
  secret: utf8('a completely different secret'),
}

const VOCAB = [
  'analysis', 'report', 'record', 'evidence', 'passage', 'writing', 'document', 'process',
  'method', 'result', 'measure', 'signal', 'language', 'student', 'author', 'appeal',
  'review', 'panel', 'notice', 'summary', 'section', 'finding', 'account', 'reason',
  'the', 'of', 'and', 'to', 'in', 'that', 'for', 'with', 'this', 'from', 'which', 'their',
]

/**
 * The positive control.
 *
 * Without this test the detector is unfalsifiable: a function that always
 * returns a small z is indistinguishable from a working detector when it is only
 * ever shown ordinary text. Here text is deliberately marked under a key, and
 * the test asserts the statistic finds it and, just as importantly, that the
 * same text is NOT flagged under a different key, which is what proves the
 * result depends on the key rather than on some property of the generated prose.
 */
describe('green-list watermark detection', () => {
  it('detects a mark applied under the same key', () => {
    const marked = generateMarkedText(OPEN_REFERENCE_KEY, VOCAB, 600)
    const result = testWatermark(tokenize(marked), OPEN_REFERENCE_KEY)

    expect(result.status).toBe('computed')
    expect(result.greenRate).not.toBeNull()
    expect(result.greenRate as number).toBeGreaterThan(0.85)
    expect(result.z as number).toBeGreaterThan(8)
    expect(result.pValue as number).toBeLessThan(1e-6)
  })

  it('does not flag that same marked text under a different key', () => {
    const marked = generateMarkedText(OPEN_REFERENCE_KEY, VOCAB, 600)
    const result = testWatermark(tokenize(marked), otherKey)

    expect(result.status).toBe('computed')
    expect(Math.abs(result.z as number)).toBeLessThan(4)
  })

  it('does not flag ordinary unmarked prose', () => {
    const plain = [
      'The committee met on Tuesday to consider the revised proposal for the eastern site.',
      'Several members asked whether the drainage survey had been completed in full.',
      'The chair noted that the report was circulated late and asked for an explanation.',
      'A decision was deferred until the next meeting, when the surveyor will attend in person.',
      'The clerk agreed to write to the applicant setting out the outstanding questions.',
      'Members discussed the access arrangements and the effect on the neighbouring lane.',
      'It was agreed that the matter should return with a fuller set of drawings attached.',
      'The meeting closed at half past eight after a short discussion of other business.',
    ].join(' ')
    const result = testWatermark(tokenize(plain), OPEN_REFERENCE_KEY)

    if (result.status === 'computed') {
      expect(Math.abs(result.z as number)).toBeLessThan(4)
    } else {
      expect(result.status).toBe('insufficient_data')
    }
  })

  it('refuses to report a z score below the minimum trial count', () => {
    const result = testWatermark(tokenize('Too short to say anything about.'), OPEN_REFERENCE_KEY)
    expect(result.status).toBe('insufficient_data')
    expect(result.z).toBeNull()
    expect(result.pValue).toBeNull()
    expect(result.greenRate).toBeNull()
    expect(result.detail).toContain(String(MIN_TRIALS))
  })

  it('reports a band, not a bare rate', () => {
    const marked = generateMarkedText(OPEN_REFERENCE_KEY, VOCAB, 600)
    const result = testWatermark(tokenize(marked), OPEN_REFERENCE_KEY)
    expect(result.greenRateInterval).not.toBeNull()
    expect(result.greenRateInterval!.low).toBeLessThanOrEqual(result.greenRate as number)
    expect(result.greenRateInterval!.high).toBeGreaterThanOrEqual(result.greenRate as number)
  })
})

describe('bigram handling', () => {
  it('scores a repeated word pair once', () => {
    // Counting "of the" forty times as forty independent trials would let a
    // repetitive but entirely human document manufacture its own z score.
    const repetitive = 'of the of the of the of the of the'
    expect(distinctBigrams(tokenize(repetitive))).toHaveLength(2)
  })

  it('is stable under case and surrounding punctuation', () => {
    const a = distinctBigrams(tokenize('The record, and the report.'))
    const b = distinctBigrams(tokenize('the RECORD and THE report'))
    expect(a).toEqual(b)
  })

  it('assigns green membership deterministically', () => {
    expect(isGreen(OPEN_REFERENCE_KEY, 'the', 'record')).toBe(isGreen(OPEN_REFERENCE_KEY, 'the', 'record'))
  })

  it('partitions at roughly gamma under the null', () => {
    let green = 0
    const n = 3000
    for (let i = 0; i < n; i++) if (isGreen(OPEN_REFERENCE_KEY, `w${i}`, `x${i}`)) green++
    const z = (green - n * 0.5) / Math.sqrt(n * 0.25)
    expect(Math.abs(z)).toBeLessThan(4)
  })
})
