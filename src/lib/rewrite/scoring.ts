/**
 * Candidate scoring: semantic similarity + fact-lock (hard gate) + evidence
 * reduction, the last measured by re-running the detector's own arithmetic on
 * the candidate text rather than a separate watermark classifier.
 */

import { tokenize } from '@/lib/detector/tokenize'
import { testWatermarkPassage } from '@/lib/detector/watermark'
import type { DetectionKey } from '@/lib/detector/keys'
import { cosineSimilarity, type RewriteBackend } from './backend/types'
import { extractFacts, verifyFacts, type ExtractedFacts } from './fact-lock'
import type { ScoredCandidate } from './types'

export interface ScoreOptions {
  minSimilarity: number
  keys: DetectionKey[]
}

export async function scoreCandidate(
  originalText: string,
  originalFacts: ExtractedFacts,
  candidateText: string,
  backend: RewriteBackend,
  options: ScoreOptions,
): Promise<ScoredCandidate> {
  const [origEmbed, candEmbed] = await Promise.all([backend.embed(originalText), backend.embed(candidateText)])
  const semanticScore = cosineSimilarity(origEmbed, candEmbed)

  const factLock = verifyFacts(originalFacts, candidateText)

  const bestZ = bestWatermarkZ(candidateText, options.keys)

  const gated = !factLock.passed || semanticScore < options.minSimilarity
  const paretoScore = gated ? -Infinity : semanticScore - normalizedZPenalty(bestZ)

  return {
    text: candidateText,
    semanticScore,
    factLockPassed: factLock.passed,
    factLockDetail: factLock.detail,
    evidenceZ: bestZ,
    paretoScore,
  }
}

export async function scoreCandidates(
  originalText: string,
  candidateTexts: string[],
  backend: RewriteBackend,
  options: ScoreOptions,
): Promise<ScoredCandidate[]> {
  const originalFacts = extractFacts(originalText)
  return Promise.all(candidateTexts.map((c) => scoreCandidate(originalText, originalFacts, c, backend, options)))
}

/** Best (lowest, i.e. least evidence) candidate that passed both gates, or null if none survived. */
export function pickBest(candidates: ScoredCandidate[]): ScoredCandidate | null {
  const survivors = candidates.filter((c) => c.paretoScore > -Infinity)
  if (survivors.length === 0) return null
  return survivors.sort((a, b) => b.paretoScore - a.paretoScore)[0]
}

function bestWatermarkZ(text: string, keys: DetectionKey[]): number | null {
  if (keys.length === 0) return null
  const tokens = tokenize(text)
  let best: number | null = null
  for (const key of keys) {
    const { z } = testWatermarkPassage(tokens, key)
    if (z === null) continue
    if (best === null || z < best) best = z // lower z = less evidence = better for this purpose
  }
  return best
}

/** Converts an evidence z-score into a 0-ish penalty subtracted from the semantic score, so higher evidence ranks worse without letting a wildly negative z dominate the ranking. */
function normalizedZPenalty(z: number | null): number {
  if (z === null) return 0
  return Math.max(0, z) * 0.05
}
