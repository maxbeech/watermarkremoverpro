/**
 * Dictionary management for synonyms.
 *
 * Loads language-specific synonym dictionaries and provides lookup functionality.
 * Dictionaries are lazy-loaded and cached in memory.
 *
 * Future: Move to compressed binary format (Protobuf/MessagePack) for bundle size optimization.
 */

import type { SynonymDictionary, SynonymGroup } from './types'
import type { LanguageCode } from '@/lib/detector/languages'

/** In-memory cache of loaded dictionaries */
const dictionaryCache = new Map<LanguageCode, SynonymDictionary>()

/** Basic English synonym dictionary (extensible) */
const EN_SYNONYMS: Record<string, string[]> = {
  // Deliberately excluded, second pass: the function words. Articles,
  // conjunctions and prepositions were listed here with "safe variants" and
  // none of them were safe, for the same reason the auxiliaries below are not.
  // A flat word-list substituter cannot see the slot it is writing into:
  //
  //   "to" -> "toward"          breaks every infinitive ("to run" -> "toward run")
  //   "of" -> "belonging to"    "the set of capabilities" -> "the set belonging to capabilities"
  //   "by" -> "near"            "written by Max" -> "written near Max", which is a different claim
  //   "the" -> "that"           swaps a definite article for a demonstrative
  //   "a" -> "some"             "a reliable set" -> "some reliable set"
  //   "or" -> "either"          "A or B" -> "A either B"
  //
  // These were producing visibly worse English on real documents, which is the
  // opposite of what someone reaches for this tool to do. Perturbing function
  // words is also the least useful way to move a watermark statistic: the
  // detector scores distinct word bigrams, and the AI-tell layer does the work
  // a reader actually notices. Restoring any of these needs a
  // part-of-speech-aware substituter, not a longer list.
  //
  // Deliberately excluded: is/was/are/be/been/being, have/has/had,
  // do/does/did, and the modal verbs (can/could/will/would/should/
  // may/might). These are auxiliaries: they combine with a following verb
  // form (a participle, a bare infinitive) in ways their dictionary
  // "synonyms" don't support, since this substituter has no grammar model
  // and swaps a token for a fixed replacement string regardless of what
  // surrounds it. Substituting "has" -> "possesses" inside "has been made"
  // produces "possesses existed made" once "been" is also swapped for
  // "existed": a real, reported bug, not a hypothetical one. A future
  // part-of-speech- or context-aware substituter could safely reintroduce
  // these; a flat word-list substituter cannot.

  // Common content words.
  //
  // Two rules govern what may be listed here, both learned from output this
  // engine actually produced:
  //
  // 1. Every variant must be a near-synonym at the SAME OR LOWER register.
  //    "use" -> "utilize" was in this table, which had the tool installing one
  //    of the best-known marks of machine and bureaucratic prose while
  //    claiming to remove them. Anything that raises register is working
  //    against the product.
  // 2. Every variant must be grammatical in the same slot, with no change to
  //    what follows. "become" -> "turn into" gave "become clear" -> "turn into
  //    clear"; "let" -> "enable" gave "let us know" -> "enable us know".
  //    Verbs whose complement pattern differs from the original are out.
  //
  // Words with no variant that clears both rules were dropped rather than
  // given a mediocre one: a smaller table that never damages a sentence beats
  // a longer one that sometimes does.
  make: ['create', 'produce'],
  get: ['obtain', 'receive'],
  go: ['travel', 'move'],
  know: ['understand', 'realize'],
  think: ['believe', 'reckon'],
  see: ['observe', 'notice'],
  come: ['arrive', 'appear'],
  take: ['grab', 'seize'],
  give: ['offer', 'hand over'],
  find: ['discover', 'locate'],
  tell: ['inform', 'notify'],
  ask: ['question', 'query'],
  call: ['name', 'summon'],
  try: ['attempt'],
  need: ['require'],
  feel: ['sense'],
  leave: ['depart', 'exit'],
  put: ['place', 'set'],
  keep: ['retain', 'hold'],
  begin: ['start'],
  seem: ['appear'],
  help: ['assist', 'aid'],
  talk: ['speak'],
  start: ['begin'],
  show: ['display', 'reveal'],
  write: ['compose', 'draft'],
  look: ['gaze', 'peer'],
  want: ['wish', 'desire'],
  move: ['shift', 'relocate'],
}

/**
 * Loads or retrieves a cached dictionary for the specified language.
 * Currently returns a simple dictionary; future versions will decompress
 * from binary format for production bundle size optimization.
 */
export async function loadDictionary(language: LanguageCode): Promise<SynonymDictionary> {
  // Return cached dictionary if available
  if (dictionaryCache.has(language)) {
    return dictionaryCache.get(language)!
  }

  // For now, only English is fully supported
  // Spanish, French, German, Portuguese can be added as needed
  if (language !== 'en') {
    throw new Error(`Dictionary not yet available for language: ${language}`)
  }

  // Build dictionary index
  const index = new Map<string, SynonymGroup>()
  let id = 0

  for (const [canonical, variants] of Object.entries(EN_SYNONYMS)) {
    index.set(canonical, {
      id: id++,
      canonical,
      variants: variants.map((variant) => ({
        id: id++,
        term: variant,
        confidence: 0.8, // Default confidence for built-in synonyms
      })),
      partOfSpeech: inferPartOfSpeech(canonical),
    })
  }

  const dictionary: SynonymDictionary = {
    language,
    version: '1.0.0',
    builtAt: new Date().toISOString(),
    index,
    getVariants(word: string): string[] | null {
      const group = index.get(word.toLowerCase())
      return group ? group.variants.map((v) => v.term) : null
    },
  }

  // Cache the dictionary
  dictionaryCache.set(language, dictionary)

  return dictionary
}

/**
 * Simple part-of-speech inference based on known word classes.
 * In production, this could be replaced with a more sophisticated tagger.
 */
function inferPartOfSpeech(word: string): string | undefined {
  const articles = ['a', 'an', 'the']
  const conjunctions = ['and', 'or', 'but']
  const prepositions = ['in', 'on', 'of', 'to', 'for', 'with', 'by', 'from', 'at']
  // Auxiliary/modal verbs (is/was/have/can/would/...) are deliberately not
  // dictionary keys (see EN_SYNONYMS above), so they're not listed here.
  const verbs = ['make', 'get', 'go', 'know', 'think', 'see', 'come', 'take']

  if (articles.includes(word)) return 'article'
  if (conjunctions.includes(word)) return 'conjunction'
  if (prepositions.includes(word)) return 'preposition'
  if (verbs.includes(word)) return 'verb'

  return undefined
}

/**
 * Clears the dictionary cache. Useful for testing or when memory is constrained.
 */
export function clearDictionaryCache(): void {
  dictionaryCache.clear()
}

/**
 * Returns statistics about loaded dictionaries.
 */
export function getDictionaryStats(): { loaded: LanguageCode[]; totalEntries: number } {
  let totalEntries = 0
  for (const dict of dictionaryCache.values()) {
    totalEntries += dict.index.size
  }

  return {
    loaded: Array.from(dictionaryCache.keys()),
    totalEntries,
  }
}
