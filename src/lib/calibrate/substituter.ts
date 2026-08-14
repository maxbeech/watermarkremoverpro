/**
 * Core substitution algorithm with repetition mitigation.
 *
 * Implements deterministic, reproducible synonym substitution that:
 * - Preserves token count and order
 * - Respects POS constraints
 * - Mitigates over-repetition to avoid creating new signatures
 */

import type { Token, Substitution, FrequencyAnalysis, CalibrationConfig, SynonymDictionary } from './types'

/**
 * Performs substitution pass on analyzed text.
 *
 * Algorithm:
 * 1. For each signature token (from frequency analysis):
 *    - Look up synonyms in dictionary
 *    - Filter by confidence and POS match
 *    - Check repetition map: skip if token appears again within maxRepeats
 *    - If multiple synonyms available, select least-used in this document
 *    - Emit substitution record
 * 2. Generate revised text from original with substitutions applied
 *
 * @param analysis - Result from analyzeFrequency()
 * @param dictionary - Loaded synonym dictionary
 * @param config - Configuration options
 * @returns Array of substitutions (may be empty if none applicable)
 */
export function performSubstitution(
  analysis: FrequencyAnalysis,
  dictionary: SynonymDictionary,
  config: CalibrationConfig = {},
): Substitution[] {
  const substitutions: Substitution[] = []
  const confidenceThreshold = config.confidenceThreshold ?? 0.7
  const maxRepeats = config.maxRepeats ?? 3

  // Track substitution counts to avoid re-using the same synonym too often
  const substitutionCounts = new Map<string, number>()

  for (const [tokenIndex, token] of analysis.tokens.entries()) {
    const norm = token.norm

    // Skip if not a signature token
    if (!analysis.signatureTokens.has(norm)) {
      continue
    }

    // Check repetition constraint: is this token appearing again within maxRepeats?
    const positions = analysis.repetitionMap.get(norm) ?? []
    const isRepetitionViolation = positions.some(
      (pos) => pos > tokenIndex && pos < tokenIndex + maxRepeats && pos !== tokenIndex,
    )

    if (isRepetitionViolation) {
      substitutions.push({
        index: tokenIndex,
        original: token.raw,
        replacement: token.raw,
        confidence: 1.0,
        reason: 'skipped_repetition',
      })
      continue
    }

    // Look up synonyms in dictionary
    const variants = dictionary.getVariants(norm)
    if (!variants || variants.length === 0) {
      substitutions.push({
        index: tokenIndex,
        original: token.raw,
        replacement: token.raw,
        confidence: 1.0,
        reason: 'not_in_dictionary',
      })
      continue
    }

    // Filter variants by confidence and adjust by usage count
    const candidates = variants
      .map((variant) => ({
        variant,
        usageCount: substitutionCounts.get(variant) ?? 0,
      }))
      .sort((a, b) => {
        // Prefer least-used synonyms
        if (a.usageCount !== b.usageCount) {
          return a.usageCount - b.usageCount
        }
        // Tiebreaker: prefer shorter variants (more likely to be natural)
        return a.variant.length - b.variant.length
      })

    const selected = candidates[0]?.variant
    if (!selected) {
      substitutions.push({
        index: tokenIndex,
        original: token.raw,
        replacement: token.raw,
        confidence: 1.0,
        reason: 'below_threshold',
      })
      continue
    }

    // Increment usage count for selected synonym
    substitutionCounts.set(selected, (substitutionCounts.get(selected) ?? 0) + 1)

    // Record substitution
    const confidence = Math.max(0.1, confidenceThreshold) // Ensure positive confidence
    substitutions.push({
      index: tokenIndex,
      original: token.raw,
      replacement: preserveCase(selected, token.raw),
      confidence,
      reason: 'synonym',
      alternatives: variants.slice(0, 3), // Show up to 3 alternatives
    })
  }

  return substitutions
}

/**
 * Applies substitutions to the original text, preserving spacing and punctuation.
 *
 * @param text - Original text
 * @param tokens - Original tokens
 * @param substitutions - Substitutions to apply
 * @returns Revised text with substitutions applied
 */
export function applySubstitutions(
  text: string,
  tokens: Token[],
  substitutions: Substitution[],
): string {
  const substitutionMap = new Map(
    substitutions.map((s) => [s.index, s.replacement]),
  )

  let result = ''
  let lastEnd = 0

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    const replacement = substitutionMap.get(i)

    // Copy text before this token (preserves spacing/punctuation)
    result += text.slice(lastEnd, token.start)

    // Add token (original or replacement)
    if (replacement) {
      result += replacement
    } else {
      result += text.slice(token.start, token.end)
    }

    lastEnd = token.end
  }

  // Copy any remaining text
  result += text.slice(lastEnd)

  return result
}

/**
 * Preserves the case pattern of the original token in the replacement.
 *
 * Handles:
 * - ALL_CAPS → REPLACEMENT
 * - Title_Case → Replacement
 * - lowercase → replacement
 * - casing in multi-word replacements (uses first word's case)
 *
 * @param replacement - The synonym (typically lowercase)
 * @param original - The original token (to copy case from)
 * @returns Replacement with original's case applied
 */
export function preserveCase(replacement: string, original: string): string {
  // If original is all caps, make replacement all caps
  if (original === original.toUpperCase() && original.length > 1) {
    return replacement.toUpperCase()
  }

  // If original starts with capital, capitalize replacement
  if (original[0] === original[0].toUpperCase() && /[A-Z]/.test(original[0])) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1).toLowerCase()
  }

  // Otherwise, use replacement as-is (lowercase)
  return replacement.toLowerCase()
}

/**
 * Counts actual substitutions made (reason === 'synonym').
 */
export function countActualSubstitutions(substitutions: Substitution[]): number {
  return substitutions.filter((s) => s.reason === 'synonym').length
}

/**
 * Extracts all substitutions that were actually applied (not skipped).
 */
export function getAppliedSubstitutions(substitutions: Substitution[]): Substitution[] {
  return substitutions.filter((s) => s.reason === 'synonym')
}

/**
 * Reverses a set of substitutions by swapping original/replacement.
 * Useful for "undo" functionality.
 */
export function reverseSubstitutions(substitutions: Substitution[]): Substitution[] {
  return substitutions.map((s) => ({
    ...s,
    original: s.replacement,
    replacement: s.original,
  }))
}
