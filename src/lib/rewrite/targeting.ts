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

/**
 * Style-tell pressure (see measureStyleTells) at which a passage is worth
 * rewriting on that basis alone, with no watermark or register signal.
 *
 * Two, so a passage needs either two flagged constructions or one construction
 * plus a pair of elevated words. A single three-item list is ordinary English
 * and must not drag a passage into a rewrite on its own.
 */
const NOTABLE_TELL_PRESSURE = 2

/**
 * How often a passage with zero detected signal still gets targeted at
 * "balanced" strength, as a baseline hedge against a watermark scheme this
 * deployment holds no key for (see BASELINE_SAMPLE_EVERY below). One in
 * two, not every passage: "aggressive" already offers "touch nearly
 * everything regardless of what was found" on purpose, for a reader who
 * wants that trade explicitly. "Balanced" hedges more than a token amount
 * without collapsing into the same behaviour, so the strength ladder still
 * means something.
 *
 * This was one in three until a reader on a mostly-clean document reasonably
 * read "balanced" as touching about one sentence per paragraph, when the
 * intent was noticeably more coverage than "preserve" without going as far
 * as "aggressive". One in two roughly doubles how much of a clean document
 * gets a light pass, still well short of "aggressive"'s "touch anything
 * measurable at all".
 */
const BASELINE_SAMPLE_EVERY = 2

/** Deterministic, not random: the same document targets the same baseline sample on a re-run at the same strength, which is what keeps a "rewrite again" reproducibly different rather than reproducibly the same for no visible reason. */
function isBaselineSample(index: number): boolean {
  return index % BASELINE_SAMPLE_EVERY === 0
}

/**
 * @param tellPressure per-passage style-tell pressure, keyed by passage index.
 *   Optional: callers that only care about the statistical channel can omit
 *   it, and every passage then reads as pressure 0. The orchestrator always
 *   supplies it, because a passage whose only problem is how it is written is
 *   exactly the passage a user came here to fix, and the watermark z-score is
 *   silent about that.
 */
export function targetPassages(
  passages: PassageFinding[],
  strength: Strength,
  tellPressure?: ReadonlyMap<number, number>,
): PassageFinding[] {
  const pressure = (p: PassageFinding): number => tellPressure?.get(p.index) ?? 0
  const hasSignal = (p: PassageFinding): boolean =>
    p.survivesCorrection ||
    (p.watermarkZ !== null && p.watermarkZ > NOTABLE_Z) ||
    (p.styleDeviation !== null && p.styleDeviation > NOTABLE_STYLE_DEVIATION) ||
    pressure(p) >= NOTABLE_TELL_PRESSURE

  switch (strength) {
    case 'preserve':
      // Deliberately unchanged: "preserve" promises to touch only what a real
      // check reports as a finding, and style tells are reported separately.
      return passages.filter((p) => p.survivesCorrection)
    case 'balanced':
      // A real finding always qualifies; a passage with none still gets a
      // light pass on a bounded sample, so "balanced" never leaves a document
      // that measured completely clean completely untouched. Every candidate
      // this produces still has to clear the same similarity floor
      // (see minSimilarity) a signal-driven rewrite does, so the hedge cannot
      // itself be the thing that damages fidelity.
      return passages.filter((p) => hasSignal(p) || isBaselineSample(p.index))
    case 'aggressive':
      return passages.filter((p) => p.watermarkP !== null || p.styleDeviation !== null || pressure(p) > 0)
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
