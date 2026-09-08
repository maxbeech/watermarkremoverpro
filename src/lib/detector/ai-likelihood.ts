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

export interface AiLikelihoodSignal {
  id: 'dash-clauses' | 'stock-phrases' | 'elevated-vocabulary' | 'structural-tics' | 'sentence-uniformity'
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

  const raw =
    dashContribution + structureContribution + vocabularyContribution + uniformityContribution
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
  ]

  return {
    status: 'computed',
    score,
    band: bandFor(score),
    signals,
    wordsScored: words,
  }
}
