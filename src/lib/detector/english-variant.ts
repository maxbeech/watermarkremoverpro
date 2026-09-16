/**
 * British vs American spelling.
 *
 * A rewrite that swaps "know" for "realize" in a document a British writer
 * spelled "realise" everywhere else has changed their variant of English, not
 * just their word choice. That is a real, reported complaint: the fix is
 * not a UI setting, since asking a visitor to declare their own dialect
 * before pasting their own writing is a needless step, it is reading the
 * variant off what they already wrote and never introducing the other one.
 *
 * The pair list below is deliberately small: only spellings that actually
 * appear as replacement candidates somewhere in this codebase's own tables
 * (src/lib/calibrate/dictionary.ts, patterns.ts) need an entry here to be
 * safe, and a handful of the most common general-vocabulary pairs are added
 * on top so detection itself has enough signal on an ordinary document that
 * never touches any of this engine's own replacement words. This is a
 * detection/normalisation aid, not an attempt at an exhaustive British/American
 * word list.
 */

export type EnglishVariant = 'en-GB' | 'en-US'

/** Canonical American spelling -> British spelling. Both sides are whole words, lowercase. */
const US_TO_GB: Record<string, string> = {
  realize: 'realise',
  realizes: 'realises',
  realized: 'realised',
  realizing: 'realising',
  organize: 'organise',
  organizes: 'organises',
  organized: 'organised',
  organizing: 'organising',
  organization: 'organisation',
  organizations: 'organisations',
  recognize: 'recognise',
  recognizes: 'recognises',
  recognized: 'recognised',
  recognizing: 'recognising',
  analyze: 'analyse',
  analyzes: 'analyses',
  analyzed: 'analysed',
  analyzing: 'analysing',
  criticize: 'criticise',
  criticized: 'criticised',
  emphasize: 'emphasise',
  emphasized: 'emphasised',
  summarize: 'summarise',
  summarized: 'summarised',
  color: 'colour',
  colors: 'colours',
  colored: 'coloured',
  coloring: 'colouring',
  favor: 'favour',
  favors: 'favours',
  favored: 'favoured',
  favorite: 'favourite',
  favorites: 'favourites',
  honor: 'honour',
  honors: 'honours',
  honored: 'honoured',
  humor: 'humour',
  neighbor: 'neighbour',
  neighbors: 'neighbours',
  behavior: 'behaviour',
  behaviors: 'behaviours',
  labor: 'labour',
  rumor: 'rumour',
  center: 'centre',
  centers: 'centres',
  centered: 'centred',
  theater: 'theatre',
  theaters: 'theatres',
  liter: 'litre',
  meter: 'metre',
  meters: 'metres',
  defense: 'defence',
  offense: 'offence',
  pretense: 'pretence',
  traveling: 'travelling',
  traveled: 'travelled',
  traveler: 'traveller',
  travelers: 'travellers',
  canceled: 'cancelled',
  canceling: 'cancelling',
  modeled: 'modelled',
  modeling: 'modelling',
  labeled: 'labelled',
  labeling: 'labelling',
  program: 'programme',
  programs: 'programmes',
  gray: 'grey',
  mold: 'mould',
  fulfill: 'fulfil',
  enrollment: 'enrolment',
  skillful: 'skilful',
}

const GB_TO_US: Record<string, string> = Object.fromEntries(
  Object.entries(US_TO_GB)
    .filter(([us, gb]) => us !== gb)
    .map(([us, gb]) => [gb, us]),
)

export interface VariantDetection {
  variant: EnglishVariant | null
  usHits: number
  gbHits: number
}

/**
 * Counts occurrences of either spelling family and reports whichever is
 * ahead, or `null` when the document shows no preference (no hits at all, or
 * an exact tie), in which case callers should leave spelling untouched
 * rather than guess.
 */
export function detectEnglishVariant(text: string): VariantDetection {
  const lower = text.toLowerCase()
  let usHits = 0
  let gbHits = 0

  for (const word of Object.keys(US_TO_GB)) {
    usHits += countWholeWord(lower, word)
  }
  for (const word of Object.keys(GB_TO_US)) {
    gbHits += countWholeWord(lower, word)
  }

  if (usHits === 0 && gbHits === 0) return { variant: null, usHits, gbHits }
  if (usHits === gbHits) return { variant: null, usHits, gbHits }
  return { variant: usHits > gbHits ? 'en-US' : 'en-GB', usHits, gbHits }
}

/**
 * Rewrites `word` into the given variant's spelling if it is one of the pairs
 * above, preserving the original's capitalisation. Words outside this table
 * (the overwhelming majority of any document) pass through unchanged: this
 * is a targeted fix for the specific spellings this engine's own replacement
 * tables can produce, not a general spelling converter.
 */
export function applyEnglishVariant(word: string, variant: EnglishVariant | null): string {
  if (!variant) return word
  const lower = word.toLowerCase()
  const table = variant === 'en-GB' ? US_TO_GB : GB_TO_US
  const target = table[lower]
  if (!target || target === lower) return word
  return matchCase(word, target)
}

function matchCase(original: string, replacement: string): string {
  if (original === original.toUpperCase() && original.length > 1) return replacement.toUpperCase()
  if (original[0] === original[0].toUpperCase()) return replacement.charAt(0).toUpperCase() + replacement.slice(1)
  return replacement
}

function countWholeWord(lowerText: string, word: string): number {
  const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g')
  return lowerText.match(re)?.length ?? 0
}

/** Human-readable label, for prompts and UI copy. */
export function variantLabel(variant: EnglishVariant): string {
  return variant === 'en-GB' ? 'British English' : 'American English'
}
