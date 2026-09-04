import { describe, expect, it } from 'vitest'
import { extractFacts, verifyFacts } from './fact-lock'

describe('fact-lock', () => {
  it('passes a candidate that only changes wording, not facts', () => {
    const original = extractFacts('The company reported revenue of 42% in Berlin, alongside Acme Corp.')
    const result = verifyFacts(original, 'The firm reported revenue of 42% in Berlin, alongside Acme Corp.')
    expect(result.passed).toBe(true)
  })

  it('catches an injected number swap', () => {
    const original = extractFacts('Revenue grew by 42% last quarter.')
    const result = verifyFacts(original, 'Revenue grew by 24% last quarter.')
    expect(result.passed).toBe(false)
    expect(result.detail).toMatch(/number/i)
  })

  it('catches a dropped number entirely', () => {
    const original = extractFacts('Revenue grew by 42% last quarter.')
    const result = verifyFacts(original, 'Revenue grew significantly last quarter.')
    expect(result.passed).toBe(false)
  })

  it('catches a negation flip', () => {
    const original = extractFacts('The study did not find a significant effect.')
    const result = verifyFacts(original, 'The study found a significant effect.')
    expect(result.passed).toBe(false)
    expect(result.detail).toMatch(/negation/i)
  })

  it('catches a dropped proper noun', () => {
    const original = extractFacts('Acme Corp announced the merger with Bell Industries yesterday.')
    const result = verifyFacts(original, 'The company announced the merger yesterday.')
    expect(result.passed).toBe(false)
    expect(result.detail).toMatch(/named term/i)
  })

  it('does not false-positive on an ordinary sentence-initial capital with no real proper noun', () => {
    const original = extractFacts('The results were surprising to everyone involved.')
    const result = verifyFacts(original, 'The findings were surprising to everyone involved.')
    expect(result.passed).toBe(true)
  })
})
