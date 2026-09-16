import { describe, expect, it } from 'vitest'
import { lookupWordAlternatives, withEdgePunctuationOf } from './word-alternatives'

describe('lookupWordAlternatives', () => {
  it('finds the dictionary synonyms for a word the rule-based backend could have swapped', () => {
    const alts = lookupWordAlternatives('make', 'produce')
    expect(alts).toContain('create')
    expect(alts).not.toContain('produce') // the chosen replacement is not offered as an "alternative" to itself
  })

  it('finds the register-downshift variants for elevated vocabulary', () => {
    const alts = lookupWordAlternatives('robust', 'strong')
    expect(alts.length).toBeGreaterThan(0)
    expect(alts).not.toContain('strong')
  })

  it('finds a stock-phrase table entry for a multi-word original', () => {
    const alts = lookupWordAlternatives('delve into', 'look at')
    expect(alts.length).toBeGreaterThan(0)
    expect(alts).not.toContain('look at')
  })

  it('preserves the original word\'s capitalisation on every alternative', () => {
    const alts = lookupWordAlternatives('Make', 'Produce')
    for (const alt of alts) expect(alt[0]).toBe(alt[0].toUpperCase())
  })

  it('returns nothing for a word not in any known table, rather than inventing one', () => {
    expect(lookupWordAlternatives('xylophone', 'glockenspiel')).toEqual([])
  })

  it('returns nothing for an empty original (a pure insertion has no word to look alternatives up for)', () => {
    expect(lookupWordAlternatives('', 'added')).toEqual([])
  })

  it('caps out at two alternatives', () => {
    // "comprehensive" has three downshift variants in REGISTER_DOWNSHIFT.
    const alts = lookupWordAlternatives('comprehensive', 'full')
    expect(alts.length).toBeLessThanOrEqual(2)
  })

  it('finds a table entry even when the diff span carries trailing punctuation', () => {
    // The diff view's atoms are whitespace-delimited, so a changed span like
    // "robust," (with the comma attached) is exactly what this module
    // actually receives in practice, not the clean "robust" a naive lookup
    // would assume.
    const alts = lookupWordAlternatives('robust,', 'strong,')
    expect(alts.length).toBeGreaterThan(0)
    expect(alts).not.toContain('strong')
    expect(alts).not.toContain('strong,')
  })
})

describe('withEdgePunctuationOf', () => {
  it('wraps a bare alternative with the reference text\'s own leading and trailing punctuation', () => {
    expect(withEdgePunctuationOf('sturdy', 'strong,')).toBe('sturdy,')
    expect(withEdgePunctuationOf('sturdy', 'strong.')).toBe('sturdy.')
    expect(withEdgePunctuationOf('sturdy', 'strong')).toBe('sturdy')
  })

  it('preserves capitalisation already applied to the alternative', () => {
    expect(withEdgePunctuationOf('Sturdy', 'Strong,')).toBe('Sturdy,')
  })
})
