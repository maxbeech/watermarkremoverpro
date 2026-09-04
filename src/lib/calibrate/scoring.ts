/**
 * Scoring and metrics calculation for calibration results.
 *
 * Computes before/after statistical profiles to measure the impact of substitutions.
 */

import type { TextMetrics, Substitution } from './types'
import { analyzeFrequency } from './frequency'
import { calculateTTR, calculateAverageFrequency, calculateLexicalDiversity } from './frequency'
import type { LanguageCode } from '@/lib/detector/languages'

/**
 * Calculates text metrics for a given text sample.
 *
 * Metrics include:
 * - tokens: Total word token count
 * - uniqueTokens: Number of distinct words
 * - typeTokenRatio (TTR): Unique / Total (diversity measure, 0-1)
 * - averageTokenFrequency: Average frequency of tokens
 * - lexicalDiversity: Normalized diversity score (0-1)
 */
export function calculateMetrics(text: string, language?: LanguageCode): TextMetrics {
  const analysis = analyzeFrequency(text, language)

  const ttr = calculateTTR(analysis.uniqueTokens, analysis.totalTokens)
  const avgFreq = calculateAverageFrequency(analysis.tokenCounts)
  const diversity = calculateLexicalDiversity(analysis.tokenCounts)

  return {
    tokens: analysis.totalTokens,
    uniqueTokens: analysis.uniqueTokens,
    typeTokenRatio: ttr,
    averageTokenFrequency: avgFreq,
    lexicalDiversity: diversity,
  }
}

/**
 * Compares two TextMetrics objects and returns the shift in each dimension.
 *
 * Returns:
 * - typeTokenRatio: Absolute change in TTR
 * - averageFrequency: Absolute change in average frequency
 * - lexicalDiversity: Absolute change in lexical diversity
 */
export function calculateMetricsShift(
  before: TextMetrics,
  after: TextMetrics,
): {
  typeTokenRatio: number
  averageFrequency: number
  lexicalDiversity: number
} {
  return {
    typeTokenRatio: after.typeTokenRatio - before.typeTokenRatio,
    averageFrequency: after.averageTokenFrequency - before.averageTokenFrequency,
    lexicalDiversity: after.lexicalDiversity - before.lexicalDiversity,
  }
}

/**
 * Calculates the lexical change percentage: how many tokens were replaced.
 *
 * @param totalTokens - Total tokens in the text
 * @param substitutions - Applied substitutions
 * @returns Percentage (0-100) of tokens that were replaced
 */
export function calculateLexicalChangePercent(
  totalTokens: number,
  substitutions: Substitution[],
): number {
  if (totalTokens === 0) return 0
  const changed = substitutions.filter((s) => s.reason === 'synonym').length
  return (changed / totalTokens) * 100
}

/**
 * Estimates the semantic drift of substitutions.
 *
 * For now, uses a simple heuristic:
 * - Built-in synonyms (from dictionary) have low drift (~0.1-0.3)
 * - Longer replacements have slightly higher drift
 * - This is a placeholder for more sophisticated embedding-based approaches
 *
 * @param substitutions - Applied substitutions
 * @returns Estimated drift score (0-1)
 */
export function estimateSemanticDrift(substitutions: Substitution[]): number {
  const applied = substitutions.filter((s) => s.reason === 'synonym')
  if (applied.length === 0) return 0

  let totalDrift = 0
  for (const sub of applied) {
    // Base drift from confidence (lower confidence = higher drift)
    let drift = 1 - sub.confidence

    // Multi-word replacements have slightly higher drift
    if (sub.replacement.includes(' ')) {
      drift += 0.1
    }

    // Case mismatches add drift
    if (sub.original[0] !== sub.replacement[0]) {
      drift += 0.05
    }

    totalDrift += Math.min(1, drift) // Cap at 1.0
  }

  // Average across substitutions, normalize to 0-1
  return Math.min(1, totalDrift / applied.length)
}

/**
 * Composes a full impact report comparing before and after texts.
 *
 * This is called after substitutions are applied to show the aggregate effect.
 */
export function composeImpactReport(
  beforeText: string,
  afterText: string,
  substitutions: Substitution[],
  language?: LanguageCode,
) {
  const beforeMetrics = calculateMetrics(beforeText, language)
  const afterMetrics = calculateMetrics(afterText, language)

  const applied = substitutions.filter((s) => s.reason === 'synonym')
  const lexicalChange = calculateLexicalChangePercent(beforeMetrics.tokens, substitutions)
  const metricsShift = calculateMetricsShift(beforeMetrics, afterMetrics)
  const semanticDrift = estimateSemanticDrift(substitutions)

  return {
    before: beforeMetrics,
    after: afterMetrics,
    substitutions: {
      applied: applied.length,
      skipped: substitutions.length - applied.length,
      total: substitutions.length,
    },
    comparison: {
      lexicalChangePercent: lexicalChange,
      tokensChanged: applied.length,
      metricsShift,
      estimatedSemanticDrift: semanticDrift,
    },
    summary: {
      // Positive shift in TTR is good (more diverse vocabulary)
      diversityImproved: metricsShift.typeTokenRatio > 0,
      frequencyBalanced: metricsShift.averageFrequency < 0, // Lower avg freq = more balanced
      tokenCountPreserved: beforeMetrics.tokens === afterMetrics.tokens,
    },
  }
}

/**
 * Formats metrics for display (rounds to reasonable precision).
 */
export function formatMetrics(metrics: TextMetrics): TextMetrics {
  return {
    tokens: metrics.tokens,
    uniqueTokens: metrics.uniqueTokens,
    typeTokenRatio: Math.round(metrics.typeTokenRatio * 1000) / 1000,
    averageTokenFrequency: Math.round(metrics.averageTokenFrequency * 100) / 100,
    lexicalDiversity: Math.round(metrics.lexicalDiversity * 1000) / 1000,
  }
}
