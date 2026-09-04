/**
 * Main calibration engine orchestrator.
 *
 * Coordinates the full pipeline:
 * 1. Analyze text frequency
 * 2. Load dictionary for language
 * 3. Perform substitutions with repetition mitigation
 * 4. Calculate before/after metrics
 * 5. Compose final result
 */

import type {
  CalibrationRequest,
  CalibrationResult,
  CalibrationConfig,
  Substitution,
} from './types'
import { analyzeFrequency } from './frequency'
import { loadDictionary } from './dictionary'
import { performSubstitution, applySubstitutions } from './substituter'
import { calculateMetrics, calculateMetricsShift, calculateLexicalChangePercent, composeImpactReport } from './scoring'
import { resolveLanguage } from '@/lib/detector'
import { tokenize } from '@/lib/detector/tokenize'
import type { LanguageCode } from '@/lib/detector/languages'

/**
 * Main calibration function.
 *
 * Performs deterministic, local-only text normalization via synonym substitution.
 * The lighter layer behind the fuller on-device rewrite engine (src/lib/rewrite):
 * suggests substitutions with before/after metrics rather than a targeted,
 * scored rewrite. See docs/REWRITE_PHILOSOPHY.md.
 *
 * All processing is local (no network calls, no text upload).
 *
 * @param request - Calibration request with text, language, mode, and optional config
 * @returns Calibration result with before/after metrics and substitutions
 *
 * @example
 * const result = await calibrateText({
 *   text: 'The quick brown fox jumps over the lazy dog.',
 *   language: 'en',
 *   mode: 'preview',
 *   config: { confidenceThreshold: 0.7, maxRepeats: 3 }
 * })
 */
export async function calibrateText(request: CalibrationRequest): Promise<CalibrationResult> {
  const startTime = performance.now()
  const { text, language, mode, config } = request

  try {
    // Validate input
    if (!text || text.trim().length === 0) {
      return {
        status: 'error',
        error: 'Text is empty',
        original: { text: '', tokens: 0, metrics: defaultMetrics() },
        substitutions: [],
        revised: { text: '', tokens: 0, metrics: defaultMetrics() },
        comparison: defaultComparison(),
        processingTimeMs: performance.now() - startTime,
      }
    }

    // Resolve language (auto-detect if not specified)
    const resolved = resolveLanguage(text, language)
    const targetLanguage = (resolved.language || 'en') as LanguageCode

    // Step 1: Analyze frequency and identify signature tokens
    const analysis = analyzeFrequency(text, targetLanguage)

    // Step 2: Load dictionary for the language
    let dictionary
    try {
      dictionary = await loadDictionary(targetLanguage)
    } catch (err) {
      return {
        status: 'error',
        error: `Dictionary not available for language: ${targetLanguage}`,
        original: { text, tokens: analysis.totalTokens, metrics: calculateMetrics(text, targetLanguage) },
        substitutions: [],
        revised: { text, tokens: analysis.totalTokens, metrics: calculateMetrics(text, targetLanguage) },
        comparison: defaultComparison(),
        processingTimeMs: performance.now() - startTime,
      }
    }

    // Step 3: Perform substitutions with repetition mitigation
    const substitutions = performSubstitution(analysis, dictionary, config)

    // Step 4: Apply substitutions to text
    const revisedText = applySubstitutions(text, analysis.tokens, substitutions)

    // Step 5: Calculate metrics
    const originalMetrics = calculateMetrics(text, targetLanguage)
    const revisedMetrics = calculateMetrics(revisedText, targetLanguage)
    const metricsShift = calculateMetricsShift(originalMetrics, revisedMetrics)
    const lexicalChange = calculateLexicalChangePercent(analysis.totalTokens, substitutions)

    // Build final result
    const result: CalibrationResult = {
      status: 'ok',
      original: {
        text,
        tokens: analysis.totalTokens,
        metrics: originalMetrics,
      },
      substitutions,
      revised: {
        text: revisedText,
        tokens: analysis.totalTokens, // Preserved by design
        metrics: revisedMetrics,
      },
      comparison: {
        lexicalChangePercent: lexicalChange,
        tokensChanged: substitutions.filter((s) => s.reason === 'synonym').length,
        metricsShift,
      },
      processingTimeMs: performance.now() - startTime,
      language: targetLanguage,
    }

    // In 'apply' mode, include the timestamp
    if (mode === 'apply') {
      result.appliedAt = new Date().toISOString()
    }

    return result
  } catch (err) {
    return {
      status: 'error',
      error: (err as Error).message || 'Unknown error during calibration',
      original: { text, tokens: tokenize(text).length, metrics: calculateMetrics(text) },
      substitutions: [],
      revised: { text, tokens: tokenize(text).length, metrics: calculateMetrics(text) },
      comparison: defaultComparison(),
      processingTimeMs: performance.now() - startTime,
    }
  }
}

/**
 * Default metrics object (zero state).
 */
function defaultMetrics() {
  return {
    tokens: 0,
    uniqueTokens: 0,
    typeTokenRatio: 0,
    averageTokenFrequency: 0,
    lexicalDiversity: 0,
  }
}

/**
 * Default comparison object (zero state).
 */
function defaultComparison() {
  return {
    lexicalChangePercent: 0,
    tokensChanged: 0,
    metricsShift: {
      typeTokenRatio: 0,
      averageFrequency: 0,
      lexicalDiversity: 0,
    },
  }
}

/**
 * Type-safe re-export of main types for public API.
 */
export type { CalibrationRequest, CalibrationResult, CalibrationConfig, Substitution } from './types'
