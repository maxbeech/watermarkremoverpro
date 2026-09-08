import { describe, expect, it } from 'vitest'
import { alignParagraphs, diffStats, diffWords, replaceRange } from './words'

const rejoin = (parts: ReturnType<typeof diffWords>, side: 'before' | 'after') =>
  parts
    .filter((p) => (side === 'before' ? p.op !== 'insert' : p.op !== 'delete'))
    .map((p) => p.text)
    .join('')

describe('diffWords', () => {
  it('reports no change for identical text', () => {
    expect(diffWords('the same words', 'the same words')).toEqual([
      { op: 'equal', text: 'the same words' },
    ])
  })

  it('returns nothing for two empty strings', () => {
    expect(diffWords('', '')).toEqual([])
  })

  it('isolates a single replaced word', () => {
    const parts = diffWords('it is a pivotal moment', 'it is a key moment')
    expect(parts.filter((p) => p.op === 'delete').map((p) => p.text.trim())).toEqual(['pivotal'])
    expect(parts.filter((p) => p.op === 'insert').map((p) => p.text.trim())).toEqual(['key'])
  })

  it('round-trips both sides character for character', () => {
    const before = 'Delve into  the tapestry of it.\nIt is not just X, but Y.'
    const after = 'Look at the mix of it.\nIt is Y.'
    const parts = diffWords(before, after)
    expect(rejoin(parts, 'before')).toBe(before)
    expect(rejoin(parts, 'after')).toBe(after)
  })

  it('round-trips when one side is empty', () => {
    const parts = diffWords('some text here', '')
    expect(rejoin(parts, 'before')).toBe('some text here')
    expect(rejoin(parts, 'after')).toBe('')
  })

  it('falls back to a whole-block replace past the size guard, without losing text', () => {
    const before = Array.from({ length: 2000 }, (_, i) => `alpha${i}`).join(' ')
    const after = Array.from({ length: 2000 }, (_, i) => `beta${i}`).join(' ')
    const parts = diffWords(before, after)
    expect(rejoin(parts, 'before')).toBe(before)
    expect(rejoin(parts, 'after')).toBe(after)
  })

  it('preserves an insertion at the very start', () => {
    const parts = diffWords('two three', 'one two three')
    expect(parts[0]).toEqual({ op: 'insert', text: 'one ' })
  })
})

describe('diffStats', () => {
  it('counts words rather than parts', () => {
    const stats = diffStats(diffWords('a b c d', 'a x y d'))
    expect(stats).toEqual({ added: 2, removed: 2, unchanged: 2 })
  })
})

describe('alignParagraphs', () => {
  const before = 'First paragraph here.\n\nSecond paragraph here.'
  const after = 'First paragraph, revised.\n\nSecond paragraph here.'

  it('pairs paragraphs positionally when the count is preserved', () => {
    const alignment = alignParagraphs(before, after)
    expect(alignment.aligned).toBe(true)
    expect(alignment.pairs).toHaveLength(2)
    expect(alignment.pairs[0].changed).toBe(true)
    expect(alignment.pairs[1].changed).toBe(false)
  })

  it('reports offsets into the revised text that select that paragraph', () => {
    const alignment = alignParagraphs(before, after)
    const pair = alignment.pairs[0]
    expect(after.slice(pair.start, pair.end)).toBe('First paragraph, revised.')
  })

  it('refuses to align, with a reason, when the paragraph count changed', () => {
    const alignment = alignParagraphs(before, 'One paragraph only.')
    expect(alignment.aligned).toBe(false)
    expect(alignment.pairs).toEqual([])
    expect(alignment.reason).toMatch(/2 paragraphs and the rewrite has 1/)
  })
})

describe('replaceRange', () => {
  it('substitutes exactly the selected span', () => {
    const alignment = alignParagraphs('A one.\n\nB two.', 'A one.\n\nB two.')
    const pair = alignment.pairs[1]
    expect(replaceRange('A one.\n\nB two.', pair.start, pair.end, 'B rewritten.')).toBe(
      'A one.\n\nB rewritten.',
    )
  })
})
