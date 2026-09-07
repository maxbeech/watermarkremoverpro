import { describe, expect, it } from 'vitest'
import { candidateCount, minSimilarity, targetPassages } from './targeting'
import type { PassageFinding } from './types'

function passage(overrides: Partial<PassageFinding>): PassageFinding {
  return {
    index: 0,
    text: 'Sample passage.',
    start: 0,
    end: 16,
    words: 2,
    watermarkZ: null,
    watermarkP: null,
    watermarkKeyId: null,
    survivesCorrection: false,
    styleDeviation: null,
    ...overrides,
  }
}

describe('targetPassages', () => {
  const passages: PassageFinding[] = [
    passage({ index: 0, survivesCorrection: true, watermarkZ: 5, watermarkP: 0.0001 }),
    passage({ index: 1, survivesCorrection: false, watermarkZ: 3, watermarkP: 0.02 }),
    passage({ index: 2, survivesCorrection: false, watermarkZ: 1, watermarkP: 0.3 }),
    passage({ index: 3, survivesCorrection: false, watermarkZ: null, watermarkP: null, styleDeviation: null }),
  ]

  it('preserve: only touches passages that survived FDR correction', () => {
    const targets = targetPassages(passages, 'preserve')
    expect(targets.map((p) => p.index)).toEqual([0])
  })

  it('balanced: also touches high-z passages that did not survive correction', () => {
    const targets = targetPassages(passages, 'balanced')
    expect(targets.map((p) => p.index)).toEqual([0, 1])
  })

  it('aggressive: touches any testable passage', () => {
    const targets = targetPassages(passages, 'aggressive')
    expect(targets.map((p) => p.index)).toEqual([0, 1, 2])
  })

  it('regenerate: touches every passage, including untestable ones', () => {
    const targets = targetPassages(passages, 'regenerate')
    expect(targets.map((p) => p.index)).toEqual([0, 1, 2, 3])
  })

  // Passage 3 carries no watermark or style signal at all: without style-tell
  // pressure it is unreachable below "regenerate". This is the routing gap the
  // engine had, where a passage whose only problem was how it read was
  // reported and then never rewritten.
  const tellPressure = new Map([[3, 2]])

  it('balanced: touches a passage whose only signal is style-tell pressure', () => {
    const targets = targetPassages(passages, 'balanced', tellPressure)
    expect(targets.map((p) => p.index)).toEqual([0, 1, 3])
  })

  it('balanced: ignores pressure below the threshold, so one three-item list is not enough', () => {
    const targets = targetPassages(passages, 'balanced', new Map([[3, 1]]))
    expect(targets.map((p) => p.index)).toEqual([0, 1])
  })

  it('aggressive: any pressure at all is enough', () => {
    const targets = targetPassages(passages, 'aggressive', new Map([[3, 1]]))
    expect(targets.map((p) => p.index)).toEqual([0, 1, 2, 3])
  })

  it('preserve: pressure never widens the selection, which is what preserve promises', () => {
    const targets = targetPassages(passages, 'preserve', new Map([[3, 99]]))
    expect(targets.map((p) => p.index)).toEqual([0])
  })

  it('omitting pressure entirely reads every passage as zero, changing nothing', () => {
    expect(targetPassages(passages, 'balanced').map((p) => p.index)).toEqual(
      targetPassages(passages, 'balanced', new Map()).map((p) => p.index),
    )
  })

  it('minSimilarity loosens monotonically from preserve to regenerate', () => {
    expect(minSimilarity('preserve')).toBeGreaterThan(minSimilarity('balanced'))
    expect(minSimilarity('balanced')).toBeGreaterThan(minSimilarity('aggressive'))
    expect(minSimilarity('aggressive')).toBeGreaterThan(minSimilarity('regenerate'))
  })

  it('pro tier generates more candidates than free', () => {
    expect(candidateCount('pro')).toBeGreaterThan(candidateCount('free'))
  })
})
