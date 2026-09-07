import { describe, it, expect, beforeEach } from 'vitest'
import { loadDictionary, clearDictionaryCache } from './dictionary'
import { ELEVATED_VOCABULARY } from './patterns'

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

/**
 * The same failure mode, found on real output rather than reported: articles,
 * conjunctions and prepositions have no context-free replacement either.
 * "a reliable set" came back as "some reliable set" and "for the modern
 * enterprise" as "for that modern enterprise".
 */
describe('dictionary: function words are not substitutable', () => {
  beforeEach(() => {
    clearDictionaryCache()
  })

  const FUNCTION_WORDS = [
    'the', 'a', 'an',
    'and', 'or', 'but',
    'in', 'on', 'of', 'to', 'for', 'with', 'by', 'from', 'at',
  ]

  it.each(FUNCTION_WORDS)('has no dictionary entry for function word "%s"', async (word) => {
    const dictionary = await loadDictionary('en')
    expect(dictionary.getVariants(word)).toBeNull()
  })
})

/**
 * A rewrite that lowers AI evidence must not raise register while doing it.
 * "use" -> "utilize" was a real entry in this table, which had the tool
 * installing one of the best-known marks of machine prose in the course of
 * claiming to remove them.
 */
describe('dictionary: no variant is itself an AI tell', () => {
  beforeEach(() => {
    clearDictionaryCache()
  })

  it('offers no replacement drawn from the elevated-vocabulary list', async () => {
    const dictionary = await loadDictionary('en')
    const elevated = new Set(ELEVATED_VOCABULARY.map((w) => w.toLowerCase()))
    // Plus the classic register-raisers that are not on the frequency list but
    // read as machine prose to any editor.
    for (const extra of ['utilize', 'utilise', 'commence', 'endeavor', 'endeavour', 'necessitate']) {
      elevated.add(extra)
    }

    const offenders: string[] = []
    for (const word of SAMPLE_HEADWORDS) {
      for (const variant of dictionary.getVariants(word) ?? []) {
        if (elevated.has(variant.toLowerCase())) offenders.push(`${word} -> ${variant}`)
      }
    }

    expect(offenders, `Register-raising replacements found:\n${offenders.join('\n')}`).toEqual([])
  })
})

/** Every headword the English table currently defines, so the assertion above cannot silently stop covering new entries. */
const SAMPLE_HEADWORDS = [
  'make', 'get', 'go', 'know', 'think', 'see', 'come', 'take', 'give', 'find',
  'tell', 'ask', 'call', 'try', 'need', 'feel', 'leave', 'put', 'keep',
  'begin', 'seem', 'help', 'talk', 'start', 'show', 'write', 'look', 'want', 'move',
]
