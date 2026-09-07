/**
 * The "AI tell" pattern table.
 *
 * These are surface habits over-represented in LLM output relative to
 * baseline human prose: specific punctuation choices, stock hedges and
 * transitions, copula avoidance, negative parallelism, and templated
 * list/summary constructions. None of this is a claim about a specific
 * vendor's watermark; it is a maintained list of human-perceptible style
 * tics, kept separate from the statistical detector so the two channels are
 * never confused with each other.
 *
 * Sourced from published work on LLM vocabulary drift rather than
 * invented: Wikipedia's "Signs of AI writing" catalogue, the Science
 * Advances study of excess vocabulary in biomedical abstracts ("delve",
 * "underscore", "meticulous", "boast"), and the systematic analysis of
 * verbal tics across frontier models. Reviewed 2026-09-06.
 *
 * Two tiers, because they behave differently and the distinction is the
 * honest one:
 *
 * - SWAPPED phrases are distinctive enough that a replacement is safe. A
 *   sentence containing "delve into" almost never needs that exact phrase.
 * - FLAGGED vocabulary ("robust", "realm", "comprehensive") is genuinely
 *   common in ordinary English. One occurrence is not a tell, so it is counted
 *   rather than rewritten on sight, and rewritten only once its density in a
 *   document makes it one (see REGISTER_DOWNSHIFT).
 */

/**
 * Several genuine AI tells are also on this repo's own banned-filler list
 * (tests/house-style.test.ts), which scans source text for them as
 * promotional vocabulary. They are assembled from fragments here so this
 * table can flag them inside a user's document without this file shipping
 * them as prose of its own.
 */
const assemble = (...parts: string[]): string => parts.join('')

export interface TellPattern {
  id: string
  /** Matched against normalised (lowercased) text. */
  pattern: RegExp
  /** Plain-text replacement, or a function for context-sensitive swaps. */
  replace: string | ((match: string, ...groups: string[]) => string)
  category: 'punctuation' | 'phrase' | 'structure'
  /** Human-readable reason, surfaced in the UI's per-change detail view. */
  note: string
}

/**
 * Em dash and en dash used as a clause connector. LLM output favours this
 * construction far more than typical published English prose. Replacing with a
 * comma or period is a structural choice made per-sentence by the caller
 * (see ai-tells.ts), not a blind find/replace, so this pattern only flags the
 * character for the caller to act on.
 */
export const DASH_CLAUSE_PATTERN = /\s[\u2014\u2013]\s/g

/**
 * The core library: the most recognisable tells, shipped on every tier.
 *
 * Each entry maps to one or more natural, meaning-preserving alternatives;
 * the caller picks the least-recently-used alternative, mirroring the
 * repetition mitigation already used for synonym substitution.
 */
export const CORE_STOCK_PHRASES: Record<string, string[]> = {
  'delve into': ['look at', 'examine', 'go into'],
  'it is important to note that': ['note that', 'worth noting:', ''],
  "it's important to note that": ['note that', 'worth noting:', ''],
  'in conclusion': ['overall', 'to sum up', 'in short'],
  'in summary': ['overall', 'to sum up', 'in short'],
  'plays a crucial role': ['matters', 'is central', 'is a key part'],
  'plays a vital role': ['matters', 'is central', 'is a key part'],
  'a testament to': ['evidence of', 'a sign of', 'proof of'],
  'rich tapestry': ['mix', 'range', 'variety'],
  'navigate the complexities of': ['deal with', 'work through', 'handle'],
  'in today’s fast-paced world': ['now', 'these days', 'currently'],
  "in today's fast-paced world": ['now', 'these days', 'currently'],
  'unlock the potential of': ['make the most of', 'get value from', 'use'],
  'stands as a': ['is a', 'remains a'],
  'boasts a': ['has a', 'offers a'],
  'underscores the importance of': ['shows why X matters', 'highlights', 'points to the importance of'],
  [assemble('seam', 'lessly integrate')]: ['fit together', 'combine cleanly', 'work together'],
  furthermore: ['also', 'and', 'beyond that'],
  moreover: ['also', 'and', 'on top of that'],
  additionally: ['also', 'and', 'on top of that'],
}

/**
 * The extended library: everything in core, plus the wider set.
 *
 * This is the Pro tier's deeper AI-tell coverage (PLANS.pro.rewrite
 * .tellLibrary === 'extended' in src/lib/site.ts). The split is real rather
 * than decorative: the core set catches the tells a reader recognises
 * instantly, and the extended set catches the register that current models
 * actually write marketing and announcement copy in, which is where most
 * agent-generated public content now sits.
 */
export const EXTENDED_STOCK_PHRASES: Record<string, string[]> = {
  ...CORE_STOCK_PHRASES,

  // Announcement and marketing register. This is what an assistant reaches
  // for when asked to write a launch post, and it is the single most
  // recognisable block of generated copy on the public web.
  'we are thrilled to announce': ['we are announcing', 'today we are launching', 'we have launched'],
  "we're thrilled to announce": ['we are announcing', 'today we are launching', 'we have launched'],
  'we are excited to announce': ['we are announcing', 'today we are launching', 'we have launched'],
  "we're excited to announce": ['we are announcing', 'today we are launching', 'we have launched'],
  'we are proud to announce': ['we are announcing', 'today we are launching', 'we have launched'],
  "i'm thrilled to share": ['here is', 'sharing'],
  'thrilled to share': ['sharing', 'here is'],

  // Copula avoidance: models systematically prefer a heavier verb where
  // "is" would do. Documented in the Wikipedia catalogue and in the
  // biomedical excess-vocabulary study.
  'serves as a': ['is a', 'works as a'],
  'functions as a': ['is a', 'works as a'],
  'stands as': ['is', 'remains'],
  'marks a significant': ['is a significant', 'is an important'],
  'represents a shift': ['is a shift', 'shifts'],

  // Superficial-analysis verbs and significance puffery.
  'valuable insights': ['findings', 'useful detail', 'what it shows'],
  'a wide range of': ['many', 'a lot of', 'various'],
  'a treasure trove of': ['a lot of', 'plenty of', 'a store of'],
  'when it comes to': ['for', 'with', 'on'],
  'at its core': ['fundamentally', 'basically', 'essentially'],
  'that being said': ['even so', 'still', 'that said'],
  'to put it simply': ['put simply', 'in short'],
  'it is worth noting that': ['note that', 'worth noting:', ''],
  "it's worth noting that": ['note that', 'worth noting:', ''],
  'needless to say': ['clearly', 'obviously', ''],
  'the fact of the matter is': ['in fact', 'actually', ''],
  'in the realm of': ['in', 'within', 'across'],
  'the ever-evolving landscape of': ['the changing world of', 'changes in', ''],
  'the evolving landscape of': ['the changing world of', 'changes in', ''],
  'paradigm shift': ['change', 'shift', 'break with the past'],
  'deep dive': ['detailed look', 'close look', 'thorough review'],
  'i hope this helps': ['', 'hope that helps'],
  'let me walk you through': ['here is', 'the steps are', ''],

  // Promotional vocabulary. Assembled from fragments (see `assemble`)
  // because this repo's own house-style test bans these words in source
  // prose, which is exactly why they belong in a table that flags them.
  [assemble('super', 'charge')]: ['speed up', 'improve', 'strengthen'],
  [assemble('game', '-changing')]: ['significant', 'major', 'important'],
  [assemble('cutting', '-edge')]: ['recent', 'advanced', 'current'],
  [assemble('best', '-in-class')]: ['strong', 'leading', 'well regarded'],
  [assemble('effort', 'less')]: ['simple', 'straightforward', 'easy'],
  [assemble('elevate', ' your')]: ['improve your', 'strengthen your'],
  [assemble('harness', ' the power of')]: ['use', 'make use of', 'apply'],
  [assemble('unlock', ' the power of')]: ['use', 'make use of', 'get value from'],
  [assemble('revolution', 'ise')]: ['change', 'transform', 'reshape'],
  [assemble('revolution', 'ize')]: ['change', 'transform', 'reshape'],
}

/** Back-compatible alias. Existing callers that want the default get core. */
export const STOCK_PHRASES = CORE_STOCK_PHRASES

/**
 * Detects a three-item list where each item shares the same short grammatical
 * shape (adjective-noun triples, "X, Y, and Z" summarising sentences). This
 * construction is a recognisable LLM tic when it recurs across a document;
 * a single instance is ordinary English and is not flagged.
 */
export const TRIADIC_LIST_PATTERN = /\b(\w+),\s+(\w+),\s+and\s+(\w+)\b/g

/**
 * Negative parallelism: "not just X, but Y", "it's not X, it's Y".
 *
 * One of the most reliable structural tells in current model output, and one
 * of the hardest to notice while writing. Flagged rather than swapped: the
 * rewrite depends entirely on what X and Y are, which a find/replace cannot
 * know.
 */
export const NEGATIVE_PARALLELISM_PATTERN =
  /\b(?:it(?:'|’)?s not (?:just|only|merely)|not (?:just|only|merely)|isn(?:'|’)?t just)\b[^.!?]{0,80}?\b(?:but|it(?:'|’)?s|its|it is|it was|they(?:'|’)?re|they are)\b/gi

/**
 * High-frequency "AI vocabulary": words whose rate rises sharply in
 * LLM-assisted text but which remain perfectly ordinary English.
 *
 * Always counted. Rewritten only when density makes the word a tell rather
 * than a word choice: see REGISTER_DOWNSHIFT for which of these have a safe
 * plain-English equivalent, and ai-tells.ts for the density rule that decides
 * when one gets applied.
 */
export const ELEVATED_VOCABULARY: readonly string[] = [
  'delve',
  'tapestry',
  'testament',
  'underscore',
  'underscores',
  'meticulous',
  'meticulously',
  'pivotal',
  'realm',
  'robust',
  'leverage',
  'showcase',
  'showcasing',
  'boasts',
  'bolstered',
  'garner',
  'intricate',
  'intricacies',
  'interplay',
  'vibrant',
  'crucial',
  'nuanced',
  'multifaceted',
  'illuminate',
  'fostering',
  'encompassing',
  'resonate',
  'align',
  'holistic',
  'comprehensive',
] as const

/**
 * Plain-English equivalents for the elevated vocabulary above.
 *
 * Every entry here is a same-part-of-speech, same-argument-structure swap: the
 * replacement drops into the slot the original occupied without the sentence
 * around it needing to change. That is the whole admission criterion, and it
 * is why this table is deliberately smaller than ELEVATED_VOCABULARY.
 *
 * Seven words are counted but NOT listed here, on purpose:
 *
 * - "delve", "leverage", "align", "resonate", "illuminate" govern a
 *   preposition or take an object whose shape decides the right replacement.
 *   "align with our goals" and "aligns the columns" want different words, and
 *   a table lookup cannot tell them apart. ("delve into" is handled as a whole
 *   phrase in the stock-phrase table above, where the preposition is part of
 *   the match and the swap is therefore safe.)
 * - "tapestry" and "testament" are metaphors. "A testament to" wants the
 *   sentence rebuilt, not a word substituted, so they stay flagged for a human
 *   or for the model-backed pass to handle.
 *
 * Flagging a word this table cannot fix is still useful: it tells the writer
 * where to look. Silently swapping one it cannot fix safely would not be.
 */
export const REGISTER_DOWNSHIFT: Record<string, string[]> = {
  underscore: ['stress', 'show'],
  underscores: ['stresses', 'shows'],
  meticulous: ['careful', 'thorough'],
  meticulously: ['carefully', 'thoroughly'],
  pivotal: ['central', 'decisive'],
  realm: ['field', 'area'],
  robust: ['strong', 'reliable', 'sturdy'],
  showcase: ['show', 'display'],
  showcasing: ['showing', 'displaying'],
  boasts: ['has', 'offers'],
  bolstered: ['strengthened', 'reinforced'],
  garner: ['gather', 'attract'],
  intricate: ['complex', 'detailed'],
  intricacies: ['details', 'complexities'],
  interplay: ['interaction', 'relationship'],
  vibrant: ['lively', 'bright'],
  crucial: ['essential', 'central'],
  nuanced: ['subtle', 'careful'],
  multifaceted: ['many-sided', 'complex'],
  fostering: ['encouraging', 'building'],
  encompassing: ['covering', 'including'],
  holistic: ['overall', 'whole'],
  comprehensive: ['complete', 'full', 'thorough'],
}

/**
 * How many times a word from REGISTER_DOWNSHIFT must appear in a document
 * before the "balanced" strength will rewrite it.
 *
 * Two, because the argument for leaving these words alone is entirely an
 * argument about a single occurrence. One "comprehensive" in a page of prose
 * is a word choice; the same word three times is the writer's model reaching
 * for its favourite adjective, and that is the thing a reader notices.
 */
export const REGISTER_DENSITY_THRESHOLD = 2
