import { describe, it, expect, beforeEach } from 'vitest'
import { loadDictionary, clearDictionaryCache } from './dictionary'

/**
 * Regression coverage for a real bug: substituting an auxiliary/modal verb
 * (has/been/would/...) out of context produced ungrammatical output, since
 * this dictionary is a flat word-list substituter with no grammar model.
 * "has been made" -> "possesses existed made" was the exact reported case
 * ("has" -> "possesses", "been" -> "existed"). See dictionary.ts's comment
 * on the EN_SYNONYMS entry for the full explanation.
 */
describe('dictionary: auxiliary/modal verbs are not substitutable', () => {
  beforeEach(() => {
    clearDictionaryCache()
  })

  const AUXILIARY_AND_MODAL_VERBS = [
    'is', 'was', 'are', 'be', 'been', 'being',
    'have', 'has', 'had',
    'do', 'does', 'did',
    'can', 'could', 'will', 'would', 'should', 'may', 'might',
  ]

  it.each(AUXILIARY_AND_MODAL_VERBS)('has no dictionary entry for auxiliary/modal "%s"', async (word) => {
    const dictionary = await loadDictionary('en')
    expect(dictionary.getVariants(word)).toBeNull()
  })

  it('still offers variants for ordinary content-word verbs', async () => {
    const dictionary = await loadDictionary('en')
    expect(dictionary.getVariants('make')).not.toBeNull()
    expect(dictionary.getVariants('get')).not.toBeNull()
  })
})
