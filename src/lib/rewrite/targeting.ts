/**
 * Passage targeting: decides which passages a rewrite pass should touch, using
 * the detector's own per-passage findings, not a separate "is this suspicious"
 * model, the same z-scores and FDR-survival flags a user's own check would
 * show them.
 */

import type { PassageFinding, Strength } from './types'

/** z-score above which a passage is worth touching even if it didn't survive FDR correction (a long document can bury real signal under conservative multiple-comparison correction). */
const NOTABLE_Z = 2.5
const NOTABLE_STYLE_DEVIATION = 2.0

export function targetPassages(passages: PassageFinding[], strength: Strength): PassageFinding[] {
  switch (strength) {
    case 'preserve':
      return passages.filter((p) => p.survivesCorrection)
    case 'balanced':
      return passages.filter(
        (p) =>
          p.survivesCorrection ||
          (p.watermarkZ !== null && p.watermarkZ > NOTABLE_Z) ||
          (p.styleDeviation !== null && p.styleDeviation > NOTABLE_STYLE_DEVIATION),
      )
    case 'aggressive':
      return passages.filter((p) => p.watermarkP !== null || p.styleDeviation !== null)
    case 'regenerate':
      return passages
  }
}

/** Minimum acceptable semantic similarity between a candidate and the original passage, by strength. Looser as the user explicitly asks for more change. */
export function minSimilarity(strength: Strength): number {
  switch (strength) {
    case 'preserve':
      return 0.92
    case 'balanced':
      return 0.85
    case 'aggressive':
      return 0.78
    case 'regenerate':
      return 0.65
  }
}

/** Candidate count per passage, by tier. Pro generates more candidates for a better Pareto choice. */
export function candidateCount(tier: 'free' | 'pro'): number {
  return tier === 'pro' ? 4 : 2
}

/** Hard cap on rewrite rounds, regardless of strength. Prevents unbounded drift from the original document. */
export const MAX_ROUNDS = 5
