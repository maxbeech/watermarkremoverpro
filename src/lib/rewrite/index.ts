/**
 * Public surface of the rewrite engine.
 *
 * `reduceEvidence` is the one entry point every caller (browser UI, MCP tool,
 * CLI/package) should use. It wires the isomorphic orchestrator to the
 * rule-based backend, which needs no environment-specific setup. A caller that
 * has a model-backed backend available can call `rewriteDocument` directly
 * with that backend instead.
 */

import type { DetectionKey } from '@/lib/detector/keys'
import { createRuleBasedBackend } from './backend/rule-based'
import { rewriteDocument, REWRITE_LIMITS } from './orchestrator'
import type { LanguageCode } from '@/lib/detector/languages'
import type { RewriteRequest, RewriteResult } from './types'

export async function reduceEvidence(request: RewriteRequest, keys: DetectionKey[]): Promise<RewriteResult> {
  const backend = createRuleBasedBackend((request.language as LanguageCode) ?? 'en')
  return rewriteDocument(request, backend, keys)
}

export { rewriteDocument, REWRITE_LIMITS }
export { createRuleBasedBackend } from './backend/rule-based'
export { targetPassages, minSimilarity, candidateCount, MAX_ROUNDS } from './targeting'
export { extractFacts, verifyFacts } from './fact-lock'
export { MODEL_TIERS } from './models'
export type { RewriteBackend, GenerateOptions } from './backend/types'
export type { RewriteRequest, RewriteResult, PassageRewrite, ScoredCandidate, Strength, Tier } from './types'
