/**
 * Core types for the rewrite engine.
 *
 * The engine's job is narrow and stated honestly: reduce detectable AI-style
 * evidence in a document: both the statistical watermark signal the detector
 * measures, and human-perceptible "AI tells", while never fabricating
 * certainty about a result it cannot verify. It cannot guarantee defeating a
 * vendor's undisclosed watermark; see docs/REWRITE_PHILOSOPHY.md.
 */

import type { AnalysisResult, PassageFinding } from '@/lib/detector'

export type Strength = 'preserve' | 'balanced' | 'aggressive' | 'regenerate'
export type Tier = 'free' | 'pro'

export interface ScoredCandidate {
  text: string
  /** Cosine similarity between embeddings of the original passage and this candidate. 1 = identical meaning-vector. */
  semanticScore: number
  factLockPassed: boolean
  factLockDetail?: string
  /** Watermark z-score of the candidate text, using the exact same arithmetic as the detector. Null if not testable. */
  evidenceZ: number | null
  /** Combined score used to rank surviving candidates. -Infinity if the candidate was gated out. */
  paretoScore: number
}

export interface PassageRewrite {
  index: number
  original: string
  chosen: string | null
  candidates: ScoredCandidate[]
  beforeZ: number | null
  afterZ: number | null
  beforeStyleDeviation: number | null
  reason: 'tell-swap-only' | 'llm-rewrite' | 'unchanged-low-evidence' | 'unchanged-no-safe-candidate'
}

export interface RewriteRequest {
  text: string
  language?: string
  strength: Strength
  tier: Tier
}

export interface RewriteResult {
  status: 'ok' | 'error'
  error?: string
  documentBefore: AnalysisResult | null
  documentAfter: AnalysisResult | null
  passages: PassageRewrite[]
  revisedText: string
  /** Punctuation/phrase swaps made by the deterministic AI-tell pass, before any passage-level rewriting. Applies even when no passage was targeted for a full rewrite. */
  tellChangeCount: number
  roundsUsed: number
  tier: Tier
  strength: Strength
  processingTimeMs: number
  /**
   * Stated on every result, not just in marketing copy. See
   * docs/REWRITE_PHILOSOPHY.md. This array is reproduced verbatim by every
   * surface (UI, API package, MCP tool) so the honesty guarantee cannot drift
   * between them.
   */
  limits: string[]
}

export type { AnalysisResult, PassageFinding }
