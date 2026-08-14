/**
 * Frequency analysis module for identifying signature tokens.
 *
 * Analyzes token frequencies to identify patterns that might trigger
 * statistical AI detection (signature tokens).
 */

import type { Token, FrequencyAnalysis } from './types'
import type { LanguageCode } from '@/lib/detector/languages'
import { tokenize, normalizeToken } from '@/lib/detector/tokenize'

/** Common signature token patterns from watermarked text analysis */
const SIGNATURE_PATTERNS: Record<LanguageCode, Set<string>> = {
  en: new Set([
    // High-frequency function words that vary in human vs. AI writing
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'of', 'to', 'for', 'with',
    // Particular bigrams that appear in green-list watermarks
    'of the', 'in the', 'to the', 'and the', 'is a', 'was a',
  ]),
  es: new Set([
    'el', 'la', 'los', 'las', 'de', 'en', 'y', 'o', 'pero', 'por', 'para',
    'de la', 'en el', 'de los', 'y el', 'es un', 'es una',
  ]),
  fr: new Set([
    'le', 'la', 'les', 'un', 'une', 'des', 'de', 'à', 'et', 'ou', 'mais',
    'de la', 'en le', 'et le', 'est un', 'est une', 'à la',
  ]),
  de: new Set([
    'der', 'die', 'das', 'den', 'dem', 'des', 'von', 'zu', 'und', 'oder', 'aber',
    'von der', 'in der', 'und der', 'ist ein', 'ist eine', 'im dem',
  ]),
  pt: new Set([
    'o', 'a', 'os', 'as', 'de', 'em', 'para', 'por', 'com', 'e', 'ou',
    'de o', 'em o', 'e o', 'é um', 'é uma', 'no o',
  ]),
}

/**
 * Analyzes text for frequency patterns and signature tokens.
 *
 * Returns frequency distribution and identifies tokens that are candidates
 * for substitution (high-frequency, likely to trigger watermark detection).
 */
export function analyzeFrequency(text: string, language?: LanguageCode): FrequencyAnalysis {
  const tokens = tokenize(text)
  const tokenCounts = new Map<string, number>()
  const repetitionMap = new Map<string, number[]>()

  // Count token frequencies
  for (let i = 0; i < tokens.length; i++) {
    const norm = tokens[i].norm
    tokenCounts.set(norm, (tokenCounts.get(norm) ?? 0) + 1)

    // Track positions for repetition analysis
    if (!repetitionMap.has(norm)) {
      repetitionMap.set(norm, [])
    }
    repetitionMap.get(norm)!.push(i)
  }

  // Identify signature tokens based on:
  // 1. Known signature patterns for the language
  // 2. High frequency (> median)
  const signatureTokens = new Set<string>()
  const lang = language || 'en'
  const patterns = SIGNATURE_PATTERNS[lang as LanguageCode] || SIGNATURE_PATTERNS.en

  const frequencies = Array.from(tokenCounts.values()).sort((a, b) => a - b)
  const medianFrequency = frequencies[Math.floor(frequencies.length / 2)] ?? 1

  for (const [token, count] of tokenCounts.entries()) {
    // Mark as signature if:
    // 1. It's in the known signature pattern set, OR
    // 2. It appears more than 1.5x the median frequency
    if (patterns.has(token) || count > medianFrequency * 1.5) {
      signatureTokens.add(token)
    }
  }

  return {
    tokens,
    tokenCounts,
    uniqueTokens: tokenCounts.size,
    totalTokens: tokens.length,
    signatureTokens,
    repetitionMap,
  }
}

/**
 * Calculates type-token ratio (TTR), a measure of lexical diversity.
 * TTR = unique tokens / total tokens
 * Higher TTR indicates more diverse vocabulary.
 */
export function calculateTTR(uniqueTokens: number, totalTokens: number): number {
  if (totalTokens === 0) return 0
  return uniqueTokens / totalTokens
}

/**
 * Calculates average frequency of tokens.
 * Used to detect if substitution is making the text more balanced.
 */
export function calculateAverageFrequency(tokenCounts: Map<string, number>): number {
  if (tokenCounts.size === 0) return 0
  let sum = 0
  for (const count of tokenCounts.values()) {
    sum += count
  }
  return sum / tokenCounts.size
}

/**
 * Calculates lexical diversity score (0-1) based on frequency distribution.
 * Uses Gini coefficient conceptually: more uniform = higher diversity.
 */
export function calculateLexicalDiversity(tokenCounts: Map<string, number>): number {
  const counts = Array.from(tokenCounts.values()).sort((a, b) => a - b)
  const n = counts.length
  if (n === 0) return 0

  // Calculate Gini coefficient
  let sum = 0
  for (let i = 0; i < n; i++) {
    sum += (i + 1) * counts[i]
  }

  const totalCount = counts.reduce((a, b) => a + b, 0)
  const gini = (2 * sum) / (n * totalCount) - (n + 1) / n

  // Invert: higher Gini (inequality) = lower diversity
  // Return normalized score (0-1)
  return Math.max(0, Math.min(1, 1 - gini))
}
