import { describe, expect, it } from 'vitest'
import { applyDeterministicPass } from './ai-tells'

describe('applyDeterministicPass', () => {
  it('swaps an em dash clause connector for a comma or period', () => {
    const { text, changes } = applyDeterministicPass('The result was clear \u2014 nobody objected.', 'balanced')
    expect(text).not.toContain('\u2014')
    expect(changes.some((c) => c.category === 'punctuation')).toBe(true)
  })

  it('leaves dashes untouched at "preserve" strength', () => {
    const { text } = applyDeterministicPass('The result was clear \u2014 nobody objected.', 'preserve')
    expect(text).toContain('\u2014')
  })

  it('replaces a stock phrase with a natural alternative, preserving sentence-initial capitalisation', () => {
    const { text, changes } = applyDeterministicPass('Moreover, the data supports this.', 'balanced')
    expect(text).not.toMatch(/^Moreover/)
    expect(changes.some((c) => c.category === 'phrase')).toBe(true)
  })

  it('rotates through alternatives so a repeated stock phrase does not just install a new tic', () => {
    const input = 'In conclusion, it works. In conclusion, it scales.'
    const { text } = applyDeterministicPass(input, 'balanced')
    const [first, second] = text.split('.').filter((s) => s.trim().length > 0)
    expect(first.trim().toLowerCase()).not.toBe(second.trim().toLowerCase())
  })

  it('is deterministic: identical input produces identical output', () => {
    const input = 'The system \u2014 designed carefully \u2014 plays a crucial role in the outcome.'
    const a = applyDeterministicPass(input, 'aggressive')
    const b = applyDeterministicPass(input, 'aggressive')
    expect(a.text).toBe(b.text)
    expect(a.changes).toEqual(b.changes)
  })

  it('flags a templated triadic list without rewriting it', () => {
    const input = 'The plan was bold, ambitious, and risky.'
    const { text, flaggedStructures } = applyDeterministicPass(input, 'balanced')
    expect(text).toBe(input) // no phrase/dash patterns here, so the sentence itself is untouched
    expect(flaggedStructures.length).toBeGreaterThan(0)
  })

  it('leaves text with no tells completely unchanged', () => {
    const input = 'The cat sat on the mat because it was warm.'
    const { text, changes } = applyDeterministicPass(input, 'aggressive')
    expect(text).toBe(input)
    expect(changes).toEqual([])
  })
})
