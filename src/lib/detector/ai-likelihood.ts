/**
 * AI-style likelihood: a heuristic, key-free third channel.
 *
 * The provenance-mark channel (watermark.ts) and the style-distance channel
 * (distributional.ts) are both deliberately conservative: one requires a key
 * this deployment may not hold, the other explicitly declines to say anything
 * about AI at all. Both stances are correct for what those channels claim to
 * measure, but they leave a real question unanswered: text that carries no
 * detectable mark (because the generator used no key we hold, or applied none)
 * can still be full of surface habits that are simply common in current LLM
 * output. This channel measures those habits directly.
 *
 * It is deliberately biased toward flagging. Where the other two channels are
 * built to be conservative because they are read as scientific findings, this
 * one is built to be sensitive because it is read as a prompt to look closer,
 * not as a verdict, and a heuristic tuned to minimise false negatives is more
 * useful for that job than one tuned to minimise false positives. It says so
 * everywhere it is shown.
 *
 * It reuses the same pattern tables the rewrite engine uses to remove these
 * habits (src/lib/calibrate/patterns.ts, ai-tells.ts), so the set of things
 * this channel flags and the set of things the rewriter fixes can never drift
 * apart into two different opinions about what an "AI tell" is.
 */

import { measureStyleTells } from '@/lib/calibrate/ai-tells'
import { DASH_CLAUSE_PATTERN } from '@/lib/calibrate/patterns'
import type { LanguageCode } from './languages'
import { mean, stdDev } from './stats'
import { splitSentences, tokenize } from './tokenize'

/** Below this many words, sentence-rhythm and per-1,000-word rates are too noisy to score. */
export const MIN_WORDS_FOR_LIKELIHOOD = 60

/** The only language the phrase/vocabulary tables cover today. */
const SUPPORTED: LanguageCode = 'en'

export type AiLikelihoodBand = 'low' | 'watch' | 'elevated' | 'high'

/**
 * Emphasis/connective adverbs whose rate rises in LLM-assisted prose, in the
 * same "ordinary English word, tell only at density" spirit as
 * ELEVATED_VOCABULARY in calibrate/patterns.ts. Kept as a separate table here
 * rather than added to that one, because these are adverbs used to hedge
 * or transition rather than a register upgrade with a plain-English
 * downshift, so there is no safe rewrite for the deterministic pass to offer
 * and no reason for the rewrite engine to see them. This channel only counts.
 */
const CONNECTIVE_ADVERBS: readonly string[] = [
  'notably',
  'significantly',
  'ultimately',
  'importantly',
  'essentially',
  'particularly',
  'especially',
  'arguably',
  'undoubtedly',
  'invariably',
  'fundamentally',
]

/**
 * The sentence-openers worth tracking for repetition at all: discourse
 * markers and demonstratives an LLM leans on to open a sentence, not the
 * ordinary function words ("the", "a", "it" as a grammatical subject) that
 * dominate human sentence-openers too and would make this signal fire on
 * completely unremarkable prose. Deliberately narrow for that reason.
 */
const DISCOURSE_OPENERS = new Set([
  'this',
  'these',
  'it',
  'that',
  'however',
  'moreover',
  'furthermore',
  'additionally',
  'overall',
  'notably',
  'meanwhile',
  'consequently',
  'therefore',
  'thus',
  'indeed',
])

/** How many times one discourse-marker word has to open a sentence in the same document before it counts as a repeated tic rather than an unremarkable coincidence. */
const OPENER_REPEAT_THRESHOLD = 3

export interface AiLikelihoodSignal {
  id:
    | 'dash-clauses'
    | 'stock-phrases'
    | 'elevated-vocabulary'
    | 'structural-tics'
    | 'sentence-uniformity'
    | 'connective-density'
    | 'opener-repetition'
    | 'emoji-density'
  label: string
  /** Raw occurrences this signal is based on. */
  count: number
  /** Occurrences per 500 words, the unit every signal is compared in. */
  ratePer500: number
  /** This signal's contribution to the raw (pre-saturation) score. */
  contribution: number
  detail: string
}

export interface AiLikelihoodResult {
  status: 'computed' | 'insufficient_data'
  /** 0-100, saturating. Higher means more of the measured habits are present. */
  score: number | null
  band: AiLikelihoodBand | null
  signals: AiLikelihoodSignal[]
  wordsScored: number
  detail?: string
}

function bandFor(score: number): AiLikelihoodBand {
  if (score >= 75) return 'high'
  if (score >= 50) return 'elevated'
  if (score >= 25) return 'watch'
  return 'low'
}

/**
 * Maps a weighted raw score to 0-100 with early sensitivity: the curve rises
 * fastest near zero, so a document carrying just a couple of these habits
 * already reads as "watch" rather than needing a heavy concentration before
 * anything moves. That slope is the "bias toward flagging" this channel is
 * for, made into arithmetic instead of a vague setting.
 */
function saturate(raw: number): number {
  const s = 100 * (1 - Math.exp(-raw / 34))
  return Math.round(Math.min(100, Math.max(0, s)))
}

export function analyzeAiLikelihood(text: string, language: LanguageCode | null): AiLikelihoodResult {
  const tokens = tokenize(text)
  const words = tokens.length

  if (language !== SUPPORTED) {
    return {
      status: 'insufficient_data',
      score: null,
      band: null,
      signals: [],
      wordsScored: words,
      detail:
        language === null
          ? 'No language was determined for this document, so this channel did not run.'
          : `This channel currently covers English only, because its phrase and vocabulary tables are English-specific and guessing at another language would misfire silently. Language measured: ${language}.`,
    }
  }

  if (words < MIN_WORDS_FOR_LIKELIHOOD) {
    return {
      status: 'insufficient_data',
      score: null,
      band: null,
      signals: [],
      wordsScored: words,
      detail: `Only ${words} words; ${MIN_WORDS_FOR_LIKELIHOOD} are needed before per-1,000-word rates and sentence-rhythm mean anything. No score is reported for this document.`,
    }
  }

  const per500 = (count: number) => (count / words) * 500

  // --- Dash-clause connectors --------------------------------------------
  const dashMatches = text.match(DASH_CLAUSE_PATTERN)?.length ?? 0
  const dashRate = per500(dashMatches)
  // Weighted highest: the single most-cited, most-recognisable habit, and one
  // that is genuinely rare as a *repeated* device in edited human prose.
  const dashContribution = dashRate * 7

  // --- Stock phrases, elevated vocabulary, and flagged structures --------
  // measureStyleTells is the rewrite engine's own single source of truth for
  // this, so this channel and the rewriter can never disagree about what
  // counts as a tell.
  const tells = measureStyleTells(text)
  const structureRate = per500(tells.structures)
  const vocabularyRate = per500(tells.vocabulary)
  const structureContribution = structureRate * 4
  const vocabularyContribution = vocabularyRate * 3

  // --- Sentence-length uniformity -----------------------------------------
  // LLM output tends to run sentences of unusually similar length; human prose
  // is "burstier". Scored as how far the coefficient of variation sits below a
  // typical human value, so ordinary variation contributes nothing.
  const sentences = splitSentences(text)
  const lengths = sentences.map((s) => tokenize(s.text).length).filter((l) => l > 0)
  let uniformityContribution = 0
  let cv: number | null = null
  if (lengths.length >= 6) {
    const m = mean(lengths)
    const sd = stdDev(lengths)
    cv = m > 0 ? sd / m : 0
    const HUMAN_TYPICAL_CV = 0.55
    uniformityContribution = Math.max(0, HUMAN_TYPICAL_CV - cv) * 40
  }

  // --- Connective/emphasis-adverb density ---------------------------------
  let connectiveMatches = 0
  for (const word of CONNECTIVE_ADVERBS) {
    const re = new RegExp(`\\b${word}\\b`, 'gi')
    connectiveMatches += text.match(re)?.length ?? 0
  }
  const connectiveRate = per500(connectiveMatches)
  const connectiveContribution = connectiveRate * 3

  // --- Sentence-opener repetition ------------------------------------------
  // LLM output leans on a small rotation of discourse-marker sentence openers
  // ("This...", "It...", "These..."); human prose varies them far more. Only
  // DISCOURSE_OPENERS are tracked (not ordinary articles/pronouns, which
  // dominate human sentence-openers too for entirely unremarkable reasons),
  // and only a word that opens OPENER_REPEAT_THRESHOLD or more sentences in
  // the same document counts: two coincidental repeats is not a tic.
  let openerContribution = 0
  let openerRepeatRate: number | null = null
  if (lengths.length >= 6) {
    const openers = sentences.map((s) => firstWord(s.text)).filter((w) => DISCOURSE_OPENERS.has(w))
    const counts = new Map<string, number>()
    for (const opener of openers) counts.set(opener, (counts.get(opener) ?? 0) + 1)
    const repeatedCount = [...counts.values()]
      .filter((c) => c >= OPENER_REPEAT_THRESHOLD)
      .reduce((sum, c) => sum + c, 0)
    openerRepeatRate = repeatedCount / lengths.length
    openerContribution = openerRepeatRate * 90
  }

  // --- Emoji ---------------------------------------------------------------
  // Reuses the exact same count the rewrite engine's own emoji-strip pass
  // measures (calibrate/ai-tells.ts, measureStyleTells), for the same reason
  // the tell tables are shared: this channel and the rewriter must never
  // disagree about what an "AI tell" is. Weighted second-highest, just under
  // the dash-clause habit: a checkmark or a rocket used as emphasis or a
  // bullet-point marker is one of the most visually recognisable habits in
  // current announcement-register model output, at a rate that is genuinely
  // rare as a *repeated* device in edited human prose.
  const emojiCount = tells.emoji
  const emojiRate = per500(emojiCount)
  const emojiContribution = emojiRate * 6

  const raw =
    dashContribution +
    structureContribution +
    vocabularyContribution +
    uniformityContribution +
    connectiveContribution +
    openerContribution +
    emojiContribution
  const score = saturate(raw)

  const signals: AiLikelihoodSignal[] = [
    {
      id: 'dash-clauses',
      label: 'Em/en dash used as a clause connector',
      count: dashMatches,
      ratePer500: dashRate,
      contribution: dashContribution,
      detail: 'A punctuation habit heavily over-represented in LLM output relative to edited human prose.',
    },
    {
      id: 'structural-tics',
      label: 'Templated structures (triadic lists, negative parallelism)',
      count: tells.structures,
      ratePer500: structureRate,
      contribution: structureContribution,
      detail: '"Not just X, but Y" and repeated three-item lists, some of the most reliable structural tells in current model output.',
    },
    {
      id: 'elevated-vocabulary',
      label: 'Elevated vocabulary ("delve", "underscore", "robust", "realm"...)',
      count: tells.vocabulary,
      ratePer500: vocabularyRate,
      contribution: vocabularyContribution,
      detail: 'Words whose rate rises sharply in LLM-assisted text while remaining ordinary English on their own.',
    },
    {
      id: 'sentence-uniformity',
      label: 'Sentence-length uniformity',
      count: lengths.length,
      ratePer500: cv ?? 0,
      contribution: uniformityContribution,
      detail:
        cv === null
          ? 'Too few sentences to measure rhythm.'
          : `Coefficient of variation ${cv.toFixed(2)}; human prose is typically burstier than this.`,
    },
    {
      id: 'connective-density',
      label: 'Emphasis/connective adverbs ("notably", "ultimately", "arguably"...)',
      count: connectiveMatches,
      ratePer500: connectiveRate,
      contribution: connectiveContribution,
      detail:
        'Hedging and transition adverbs whose rate rises in LLM-assisted prose without any single use standing out as unusual English on its own.',
    },
    {
      id: 'emoji-density',
      label: 'Emoji used as decoration or emphasis',
      count: emojiCount,
      ratePer500: emojiRate,
      contribution: emojiContribution,
      detail: 'Checkmarks, rockets, sparkles and similar symbols used as bullet points or emphasis, a visual habit far more common in current model output than in edited human prose.',
    },
    {
      id: 'opener-repetition',
      label: 'Repeated sentence openers',
      count: lengths.length >= 6 ? Math.round((openerRepeatRate ?? 0) * lengths.length) : 0,
      ratePer500: openerRepeatRate ?? 0,
      contribution: openerContribution,
      detail:
        openerRepeatRate === null
          ? 'Too few sentences to measure how often openers repeat.'
          : `${Math.round(openerRepeatRate * 100)}% of sentences open on a discourse marker ("this", "however"...) that opens ${OPENER_REPEAT_THRESHOLD} or more sentences here; human prose usually rotates these more.`,
    },
  ]

  return {
    status: 'computed',
    score,
    band: bandFor(score),
    signals,
    wordsScored: words,
  }
}

/** The sentence's first alphabetic token, lowercased. Empty for a sentence with no letters at all (rare, but a fragment of only punctuation or digits is possible in real input). */
function firstWord(text: string): string {
  const match = text.trim().match(/[A-Za-z']+/)
  return match ? match[0].toLowerCase() : ''
}
