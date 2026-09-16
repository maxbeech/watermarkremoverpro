import { describe, expect, it } from 'vitest'
import { applyEnglishVariant, detectEnglishVariant } from './english-variant'

describe('detectEnglishVariant', () => {
  it('detects British spelling', () => {
    const text = 'We organised the colour scheme around our favourite theme, and we realised it worked.'
    expect(detectEnglishVariant(text).variant).toBe('en-GB')
  })

  it('detects American spelling', () => {
    const text = 'We organized the color scheme around our favorite theme, and we realized it worked.'
    expect(detectEnglishVariant(text).variant).toBe('en-US')
  })

  it('reports no preference for text with no variant-specific spelling at all', () => {
    const text = 'The cat sat on the mat because it was warm and quiet.'
    expect(detectEnglishVariant(text).variant).toBeNull()
  })

  it('reports no preference on an exact tie', () => {
    const text = 'We saw the colour and the color in the same sentence.'
    expect(detectEnglishVariant(text).variant).toBeNull()
  })
})

describe('applyEnglishVariant', () => {
  it('converts an American spelling to British when the document is British', () => {
    expect(applyEnglishVariant('realize', 'en-GB')).toBe('realise')
    expect(applyEnglishVariant('Realize', 'en-GB')).toBe('Realise')
  })

  it('converts a British spelling to American when the document is American', () => {
    expect(applyEnglishVariant('organise', 'en-US')).toBe('organize')
  })

  it('leaves a word unchanged when there is no detected variant', () => {
    expect(applyEnglishVariant('realize', null)).toBe('realize')
  })

  it('leaves a word outside the pair table unchanged', () => {
    expect(applyEnglishVariant('understand', 'en-GB')).toBe('understand')
  })

  it('preserves all-caps', () => {
    expect(applyEnglishVariant('COLOR', 'en-GB')).toBe('COLOUR')
  })
})
