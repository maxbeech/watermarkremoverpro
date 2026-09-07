import { describe, expect, it } from 'vitest'
import { recommendStrength, extractProse } from '../mcp/hook-check'

/**
 * The hook must never name a strength that cannot fix what it just reported.
 *
 * This has failed twice in real use. First it recommended "preserve" after
 * reporting em dashes, and "preserve" deliberately leaves dash punctuation
 * alone, so the agent went to a setting that could not address the finding and
 * fixed the dashes by hand. Then, after vocabulary swaps were added, it
 * recommended "preserve" again while reporting 24 of them. Both times the
 * report was correct and the advice attached to it was not, which is worse
 * than saying nothing.
 */
describe('hook strength recommendation', () => {
  const change = (category: 'punctuation' | 'phrase' | 'vocabulary') => ({ category })

  it('recommends preserve only when nothing needs a higher strength', () => {
    const { strength } = recommendStrength({
      changes: [change('phrase')],
      triadicCount: 0,
      parallelismCount: 0,
    })
    expect(strength).toBe('preserve')
  })

  it('recommends balanced when em dashes were reported, since preserve skips them', () => {
    const { strength } = recommendStrength({
      changes: [change('punctuation')],
      triadicCount: 0,
      parallelismCount: 0,
    })
    expect(strength).toBe('balanced')
  })

  it('recommends balanced when recurring vocabulary was reported, since preserve skips it', () => {
    const { strength } = recommendStrength({
      changes: [change('vocabulary')],
      triadicCount: 0,
      parallelismCount: 0,
    })
    expect(strength).toBe('balanced')
  })

  it('recommends aggressive for a single negative-parallelism construction', () => {
    const { strength } = recommendStrength({
      changes: [],
      triadicCount: 0,
      parallelismCount: 1,
    })
    expect(strength).toBe('aggressive')
  })

  it('needs three three-item lists before escalating, since one is ordinary English', () => {
    expect(recommendStrength({ changes: [], triadicCount: 2, parallelismCount: 0 }).strength).toBe(
      'preserve',
    )
    expect(recommendStrength({ changes: [], triadicCount: 3, parallelismCount: 0 }).strength).toBe(
      'aggressive',
    )
  })

  it('escalates to the highest strength any finding requires, not the first one seen', () => {
    const { strength } = recommendStrength({
      changes: [change('punctuation'), change('vocabulary')],
      triadicCount: 0,
      parallelismCount: 2,
    })
    expect(strength).toBe('aggressive')
  })

  /**
   * The property that actually matters, stated once rather than per case: a
   * recommendation of "preserve" is only ever valid when nothing that
   * "preserve" skips was reported.
   */
  it('never recommends a strength that skips something it reported', () => {
    const categories = ['punctuation', 'phrase', 'vocabulary'] as const
    for (const category of categories) {
      for (const triadicCount of [0, 3]) {
        for (const parallelismCount of [0, 1]) {
          const found = { changes: [change(category)], triadicCount, parallelismCount }
          const { strength } = recommendStrength(found)

          const skipsPunctuationAndVocabulary = strength === 'preserve'
          const reportedSomethingPreserveSkips = category === 'punctuation' || category === 'vocabulary'
          expect(
            skipsPunctuationAndVocabulary && reportedSomethingPreserveSkips,
            `recommended "${strength}" after reporting a ${category} change`,
          ).toBe(false)

          const routesConstructions = strength === 'aggressive'
          const reportedConstruction = triadicCount >= 3 || parallelismCount > 0
          if (reportedConstruction) {
            expect(routesConstructions, 'a reported construction must escalate to aggressive').toBe(true)
          }
        }
      }
    }
  })

  it('reports a reason naming the strength it recommends', () => {
    for (const found of [
      { changes: [], triadicCount: 0, parallelismCount: 0 },
      { changes: [change('punctuation')], triadicCount: 0, parallelismCount: 0 },
      { changes: [], triadicCount: 0, parallelismCount: 1 },
    ]) {
      const { strength, reason } = recommendStrength(found)
      expect(reason).toContain(strength)
    }
  })
})

describe('hook prose extraction', () => {
  it('strips fenced code so a code sample is not measured as writing', () => {
    const prose = extractProse('Some text.\n\n```js\nconst robust = "not just a tool, it is";\n```\n\nMore text.')
    expect(prose).not.toContain('robust')
    expect(prose).toContain('Some text.')
    expect(prose).toContain('More text.')
  })

  it('strips frontmatter and keeps link text but not link targets', () => {
    const prose = extractProse('---\ntitle: A comprehensive post\n---\nRead [the guide](https://example.com/robust).')
    expect(prose).not.toContain('comprehensive')
    expect(prose).not.toContain('example.com')
    expect(prose).toContain('the guide')
  })
})
