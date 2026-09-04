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
  is: ['exists as', 'represents'],
  was: ['existed as', 'constituted'],
  are: ['exist as', 'represent'],
  be: ['exist', 'occur'],
  been: ['existed', 'occurred'],
  being: ['existing', 'occurring'],
  have: ['possess', 'obtain'],
  has: ['possesses', 'obtains'],
  had: ['possessed', 'obtained'],
  do: ['perform', 'execute'],
  does: ['performs', 'executes'],
  did: ['performed', 'executed'],
  can: ['is able to', 'is capable of'],
  could: ['would be able to', 'might be able to'],
  will: ['shall', 'is going to'],
  would: ['should', 'might'],
  should: ['ought to', 'is recommended to'],
  may: ['might', 'is permitted to'],
  might: ['could', 'is possible'],

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
  const verbs = [
    'is', 'was', 'are', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did',
    'can', 'could', 'will', 'would', 'should', 'may', 'might',
    'make', 'get', 'go', 'know', 'think', 'see', 'come', 'take',
  ]

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
