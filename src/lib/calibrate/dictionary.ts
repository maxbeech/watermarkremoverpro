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
  // Common function words with safe variants
  the: ['this', 'that'],
  a: ['one', 'some'],
  an: ['one', 'some'],
  and: ['plus', 'along with'],
  or: ['either', 'or else'],
  but: ['however', 'yet'],
  in: ['within', 'inside'],
  on: ['upon', 'at'],
  of: ['belonging to', 'from'],
  to: ['toward', 'up to'],
  for: ['intended for', 'on behalf of'],
  with: ['together with', 'alongside'],
  by: ['near', 'beside'],
  from: ['starting at', 'originating in'],
  at: ['located at', 'positioned at'],

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

  // Common content words
  make: ['create', 'produce', 'establish'],
  get: ['obtain', 'acquire', 'receive'],
  go: ['proceed', 'travel', 'move'],
  know: ['understand', 'recognize', 'realize'],
  think: ['believe', 'consider', 'suppose'],
  see: ['observe', 'notice', 'perceive'],
  come: ['arrive', 'appear', 'approach'],
  take: ['grab', 'seize', 'capture'],
  give: ['provide', 'offer', 'donate'],
  use: ['employ', 'utilize', 'apply'],
  find: ['discover', 'locate', 'uncover'],
  tell: ['inform', 'reveal', 'communicate'],
  ask: ['inquire', 'question', 'request'],
  work: ['labor', 'toil', 'function'],
  call: ['name', 'summon', 'designate'],
  try: ['attempt', 'endeavor', 'strive'],
  need: ['require', 'demand', 'necessitate'],
  feel: ['sense', 'perceive', 'experience'],
  become: ['turn into', 'grow', 'transform'],
  leave: ['depart', 'exit', 'abandon'],
  put: ['place', 'set', 'position'],
  mean: ['intend', 'signify', 'convey'],
  keep: ['retain', 'maintain', 'hold'],
  let: ['allow', 'permit', 'enable'],
  begin: ['start', 'commence', 'initiate'],
  seem: ['appear', 'look', 'sound'],
  help: ['assist', 'aid', 'support'],
  talk: ['speak', 'discuss', 'converse'],
  turn: ['rotate', 'pivot', 'convert'],
  start: ['begin', 'commence', 'initiate'],
  show: ['display', 'demonstrate', 'reveal'],
  hear: ['listen', 'perceive', 'learn'],
  write: ['compose', 'author', 'draft'],
  read: ['peruse', 'scan', 'study'],
  look: ['gaze', 'observe', 'examine'],
  want: ['desire', 'wish', 'crave'],
  move: ['shift', 'transfer', 'relocate'],
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
