/**
 * The RewriteBackend abstraction boundary.
 *
 * Everything else in the rewrite engine (orchestrator, targeting, scoring,
 * fact-lock) is plain isomorphic TypeScript with no model dependency, matching
 * the detector's existing "one module, two environments" design. Only
 * candidate generation and embedding need an actual model, and different
 * environments need different runtimes to provide one: a browser backend
 * (WebGPU/WASM via Transformers.js), a Node backend (onnxruntime-node, used by
 * the MCP server and CLI), and a deterministic rule-based backend that needs
 * no model at all and is what ships as the always-available default (see
 * rule-based.ts).
 *
 * A backend never receives more than the single passage it's asked to
 * rewrite or embed, and never makes a network call with document text, only
 * (optionally, on first use) a request for its own model weights, which is a
 * distinct concern from the text being processed. See docs/REWRITE_PHILOSOPHY.md.
 */

export interface GenerateOptions {
  /** How many distinct candidates to produce. Diversity matters more than exact count. */
  count: number
  strength: 'preserve' | 'balanced' | 'aggressive' | 'regenerate'
  language?: string
}

export interface RewriteBackend {
  readonly id: string
  readonly modelTier: 'rule-based' | 'standard' | 'advanced'
  /** Generates candidate rewrites of a single passage. */
  generate(passage: string, options: GenerateOptions): Promise<string[]>
  /** Embeds text for semantic-similarity scoring. Returns a fixed-length vector. */
  embed(text: string): Promise<number[]>
  dispose?(): Promise<void> | void
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0
  let dot = 0
  let magA = 0
  let magB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }
  if (magA === 0 || magB === 0) return 0
  return dot / (Math.sqrt(magA) * Math.sqrt(magB))
}
