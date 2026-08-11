/**
 * Feature extraction — the single source of truth for what gets measured.
 *
 * This module is used by BOTH scripts/build-baselines.ts (to measure the
 * reference corpora) and the runtime distributional channel (to measure a
 * user's document). That is deliberate and load-bearing: if the baseline were
 * measured by one implementation and the document by another, every z score the
 * product reports would be comparing two subtly different quantities, and the
 * discrepancy would be invisible because both numbers would look reasonable.
 * One function, both callers.
 *
 * The features are the standard subject-independent register measures: how long
 * words and sentences are, how much sentence length varies, how much vocabulary
 * is reused, and how punctuation is distributed. None of them detects AI. They
 * describe writing, and the product says so wherever they are shown.
 */

import { FUNCTION_WORDS, type LanguageCode } from './languages'
import { punctuationCounts, splitSentences, tokenize, type Token } from './tokenize'
import { mean, stdDev } from './stats'

/** Tokens per analysis chunk. Baseline statistics and document statistics are
 *  both estimated over chunks of this size so the two are comparable. */
export const CHUNK_TOKENS = 400

/** A chunk shorter than this is dropped rather than measured — the variance
 *  estimates on a 40-word fragment are noise. */
export const MIN_CHUNK_TOKENS = 120

export const FEATURE_NAMES = [
  'meanWordLength',
  'mattr',
  'hapaxRatio',
  'meanSentenceLength',
  'sentenceLengthCv',
  'functionWordRate',
  'commaRate',
  'semicolonRate',
  'colonRate',
  'dashRate',
  'quoteRate',
  'parenthesisRate',
  'exclamationRate',
  'questionRate',
] as const

export type FeatureName = (typeof FEATURE_NAMES)[number]
export type FeatureVector = Record<FeatureName, number>

export interface ChunkMeasurement {
  features: FeatureVector
  /** Rate per 1,000 tokens for each of the language's function words. */
  functionWordRates: Record<string, number>
  tokenCount: number
}

/**
 * Moving-average type-token ratio.
 *
 * Plain TTR falls as a text gets longer, purely arithmetically, so comparing a
 * 300-word essay's TTR to a 900-word one measures length rather than vocabulary.
 * MATTR averages TTR over a sliding window and is length-stable, which is the
 * only reason a single baseline can serve documents of different sizes.
 */
export function movingAverageTtr(tokens: Token[], window = 100): number {
  if (tokens.length === 0) return 0
  if (tokens.length <= window) {
    return new Set(tokens.map((t) => t.norm)).size / tokens.length
  }

  const counts = new Map<string, number>()
  let distinct = 0
  const ratios: number[] = []

  for (let i = 0; i < tokens.length; i++) {
    const add = tokens[i].norm
    const prevAdd = counts.get(add) ?? 0
    if (prevAdd === 0) distinct++
    counts.set(add, prevAdd + 1)

    if (i >= window) {
      const drop = tokens[i - window].norm
      const prevDrop = counts.get(drop) ?? 0
      if (prevDrop === 1) distinct--
      counts.set(drop, prevDrop - 1)
    }
    if (i >= window - 1) ratios.push(distinct / window)
  }
  return mean(ratios)
}

export function hapaxRatio(tokens: Token[]): number {
  if (tokens.length === 0) return 0
  const counts = new Map<string, number>()
  for (const t of tokens) counts.set(t.norm, (counts.get(t.norm) ?? 0) + 1)
  let hapax = 0
  for (const n of counts.values()) if (n === 1) hapax++
  return hapax / counts.size
}

export function measureChunk(text: string, language: LanguageCode): ChunkMeasurement {
  const tokens = tokenize(text)
  const n = tokens.length
  const per1000 = (count: number) => (n > 0 ? (count / n) * 1000 : 0)

  const sentences = splitSentences(text)
  const sentenceLengths = sentences.map((s) => tokenize(s.text).length).filter((l) => l > 0)
  const meanSentence = sentenceLengths.length > 0 ? mean(sentenceLengths) : 0
  const sdSentence = sentenceLengths.length > 1 ? stdDev(sentenceLengths) : 0

  const punct = punctuationCounts(text)
  const functionWordSet = new Set(FUNCTION_WORDS[language])
  let functionWordHits = 0
  const wordCounts = new Map<string, number>()
  let totalChars = 0

  for (const t of tokens) {
    totalChars += t.norm.length
    if (functionWordSet.has(t.norm)) {
      functionWordHits++
      wordCounts.set(t.norm, (wordCounts.get(t.norm) ?? 0) + 1)
    }
  }

  const functionWordRates: Record<string, number> = {}
  for (const word of FUNCTION_WORDS[language]) {
    functionWordRates[word] = per1000(wordCounts.get(word) ?? 0)
  }

  const features: FeatureVector = {
    meanWordLength: n > 0 ? totalChars / n : 0,
    mattr: movingAverageTtr(tokens),
    hapaxRatio: hapaxRatio(tokens),
    meanSentenceLength: meanSentence,
    // Coefficient of variation of sentence length — "burstiness". Reported as a
    // ratio so it does not simply track mean sentence length.
    sentenceLengthCv: meanSentence > 0 ? sdSentence / meanSentence : 0,
    functionWordRate: per1000(functionWordHits),
    commaRate: per1000(punct.comma),
    semicolonRate: per1000(punct.semicolon),
    colonRate: per1000(punct.colon),
    dashRate: per1000(punct.dash),
    quoteRate: per1000(punct.quote),
    parenthesisRate: per1000(punct.parenthesis),
    exclamationRate: per1000(punct.exclamation),
    questionRate: per1000(punct.question),
  }

  return { features, functionWordRates, tokenCount: n }
}

/**
 * Split text into measurement chunks on sentence boundaries.
 *
 * Chunking on sentences rather than a fixed token offset keeps sentence-length
 * statistics meaningful — a chunk that starts mid-sentence would record a
 * truncated first sentence as a real short one.
 */
export function chunkText(text: string): string[] {
  const sentences = splitSentences(text)
  const chunks: string[] = []
  let current: string[] = []
  let currentTokens = 0

  for (const sentence of sentences) {
    const count = tokenize(sentence.text).length
    current.push(sentence.text)
    currentTokens += count
    if (currentTokens >= CHUNK_TOKENS) {
      chunks.push(current.join(' '))
      current = []
      currentTokens = 0
    }
  }
  if (currentTokens >= MIN_CHUNK_TOKENS) chunks.push(current.join(' '))
  return chunks
}
