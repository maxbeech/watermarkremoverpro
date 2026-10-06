import { describe, expect, it } from 'vitest'
import { lexicalShiftPercent, wordChangePercent } from './lexical-shift'

describe('lexicalShiftPercent', () => {
  it('is zero for identical text', () => {
    const text = 'The quick brown fox jumps over the lazy dog every single morning without fail.'
    expect(lexicalShiftPercent(text, text)).toBe(0)
  })

  it('is zero for two texts too short to form any word pair', () => {
    expect(lexicalShiftPercent('Hi.', 'Bye.')).toBe(0)
  })

  it('rises when word choice changes throughout the passage', () => {
    const before =
      'The committee reviewed the proposal and decided that further work was needed before anything could proceed.'
    const barelyChanged = before.replace('reviewed', 'looked at')
    const heavilyChanged =
      'A panel examined the plan and concluded that more effort was required before anything could move forward.'

    const small = lexicalShiftPercent(before, barelyChanged)
    const large = lexicalShiftPercent(before, heavilyChanged)
    expect(large).toBeGreaterThan(small)
  })

  it('is symmetric: order of the two texts does not matter', () => {
    const a = 'Several long sentences make up this passage so that word pairs actually exist to compare.'
    const b = 'Several long sentences make up this paragraph so that word pairs really do exist for comparison.'
    expect(lexicalShiftPercent(a, b)).toBe(lexicalShiftPercent(b, a))
  })

  it('stays within 0 to 100', () => {
    const a = 'Every word in this sentence is completely different from the other one, entirely so.'
    const b = 'Bananas grow on trees in warm climates and are a good source of potassium for people.'
    const result = lexicalShiftPercent(a, b)
    expect(result).toBeGreaterThanOrEqual(0)
    expect(result).toBeLessThanOrEqual(100)
  })
})

describe('wordChangePercent', () => {
  it('is zero for identical text and for empty text', () => {
    const text = 'One paragraph of ordinary words.\n\nAnother paragraph follows it.'
    expect(wordChangePercent(text, text)).toBe(0)
    expect(wordChangePercent('', '')).toBe(0)
  })

  it('counts the share of ORIGINAL words that went missing', () => {
    // 12 words, 2 replaced -> 17% (rounded).
    const before = 'we use many robust tools to build useful things for people daily'
    const after = 'we use many strong tools to build helpful things for people daily'
    expect(wordChangePercent(before, after)).toBe(17)
  })

  it('does not count pure insertions as changed original words', () => {
    expect(wordChangePercent('alpha beta gamma delta', 'alpha beta really gamma delta')).toBe(0)
  })

  it('is 100 when nothing survives', () => {
    expect(wordChangePercent('alpha beta gamma', 'one two three')).toBe(100)
  })

  it('sums per paragraph when structure is preserved', () => {
    const before = 'a b c d\n\ne f g h'
    const after = 'a b c x\n\ne f g h'
    expect(wordChangePercent(before, after)).toBe(13) // 1 of 8 words, rounded
  })
})
