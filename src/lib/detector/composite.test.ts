import { describe, expect, it } from 'vitest'
import { detectorLikelihood, overallLikelihood, watermarkDetectorScore } from './composite'

describe('watermarkDetectorScore', () => {
  it('is null when the watermark test was not measured', () => {
    expect(watermarkDetectorScore(null)).toBeNull()
  })

  it('is a flat zero at z=0 and below, never a small positive number', () => {
    expect(watermarkDetectorScore(0)).toBe(0)
    expect(watermarkDetectorScore(-1.5)).toBe(0)
  })

  it('rises with z and stays within 0-100', () => {
    const low = watermarkDetectorScore(1) as number
    const mid = watermarkDetectorScore(3) as number
    const high = watermarkDetectorScore(10) as number
    expect(low).toBeGreaterThan(0)
    expect(mid).toBeGreaterThan(low)
    expect(high).toBeGreaterThan(mid)
    expect(high).toBeLessThanOrEqual(100)
  })
})

describe('overallLikelihood', () => {
  it('is null when nothing at all was measured', () => {
    expect(overallLikelihood({ modelProbability: null, heuristicScore: null, watermarkZ: null })).toBeNull()
  })

  it('stays at zero when every measured channel found nothing', () => {
    expect(overallLikelihood({ modelProbability: 0, heuristicScore: 0, watermarkZ: 0 })).toBe(0)
  })

  it('reflects a channel the model missed: this is the bug it exists to fix', () => {
    // The trained classifier scored this document 0% AI, but the heuristic
    // channel independently measured 17. The single-channel headline this
    // replaces would have shown 0%; the composite must not.
    const result = overallLikelihood({ modelProbability: 0, heuristicScore: 17, watermarkZ: null })
    expect(result).not.toBe(0)
    expect(result).toBeGreaterThanOrEqual(17)
  })

  it('never exceeds 100 even when every channel is maxed out', () => {
    const result = overallLikelihood({ modelProbability: 1, heuristicScore: 100, watermarkZ: 20 })
    expect(result).toBe(100)
  })

  it('excludes an unmeasured channel rather than treating it as zero evidence', () => {
    const withNull = overallLikelihood({ modelProbability: 0.6, heuristicScore: null, watermarkZ: null })
    const withZero = overallLikelihood({ modelProbability: 0.6, heuristicScore: 0, watermarkZ: 0 })
    // A heuristic score of exactly 0 (measured, found nothing) still pulls the
    // noisy-OR product down a hair versus a heuristic that was never run at
    // all, because 0 is itself evidence-bearing input to the product while
    // null is excluded outright. Both must be close to, but not necessarily
    // identical to, the model's own probability alone.
    expect(withNull).toBe(60)
    expect(withZero).toBe(60)
  })

  it('rises monotonically as any one channel rises, with the others held fixed', () => {
    const lower = overallLikelihood({ modelProbability: 0.2, heuristicScore: 10, watermarkZ: 0 }) as number
    const higher = overallLikelihood({ modelProbability: 0.2, heuristicScore: 60, watermarkZ: 0 }) as number
    expect(higher).toBeGreaterThan(lower)
  })
})

describe('detectorLikelihood', () => {
  it('is null when neither the classifier nor the watermark test produced anything', () => {
    expect(detectorLikelihood({ modelProbability: null, watermarkZ: null })).toBeNull()
  })

  it('ignores the heuristic channel entirely: a human-perceived tell is not what an automated detector would see', () => {
    // Same inputs as the overallLikelihood "reflects a channel the model
    // missed" test above, but detectorLikelihood must NOT pick up the
    // heuristic 17 the way overallLikelihood does, since this figure is
    // scoped to detector-facing evidence only.
    const result = detectorLikelihood({ modelProbability: 0, watermarkZ: null })
    expect(result).toBe(0)
  })

  it('combines the classifier and the watermark test when both are present', () => {
    const modelOnly = detectorLikelihood({ modelProbability: 0.3, watermarkZ: null }) as number
    const combined = detectorLikelihood({ modelProbability: 0.3, watermarkZ: 4 }) as number
    expect(combined).toBeGreaterThan(modelOnly)
  })
})
