/**
 * Model/tier registry.
 *
 * Every tier has a real, working, zero-download backend (see
 * backend/rule-based.ts): deterministic synonym/tell substitution. That
 * ships today, unconditionally, on every surface.
 *
 * The `advanced` backend is a genuine small local LLM, run entirely on-device
 * via Transformers.js: WebGPU (falling back to WASM) in the browser through
 * backend/browser.ts, onnxruntime-node in the MCP server/CLI through
 * backend/node.ts. Both share backend/transformers-shared.ts. It downloads
 * real model weights from the Hugging Face CDN on first use (never from a
 * MarkWitness-operated server) and caches them locally. Entries below are
 * pinned to an exact repo id and commit revision, the same
 * pin-don't-trust-a-moving-target discipline already used for detection keys
 * in detector/keys.ts, so a later upstream change to the named repo can never
 * silently change what a deployed build downloads and runs.
 *
 * Free resolves to the 0.5B model; Pro resolves to the 1.5B model with a
 * higher-precision quant. Both are Apache-2.0 (Qwen2.5) and instruction
 * tuned. Verified reachable at pin time: onnx-community/Qwen2.5-0.5B-Instruct
 * and onnx-community/Qwen2.5-1.5B-Instruct both publish q4/q4f16/int8 ONNX
 * variants; Xenova/paraphrase-multilingual-MiniLM-L12-v2 covers embedding for
 * all five supported languages in one 118M-parameter model.
 *
 * If WebGPU is unavailable or device memory looks constrained, capabilities.ts
 * downgrades Pro to the Free-tier model rather than attempting a larger model
 * on CPU. That's the concrete mechanism satisfying "strictly on-device, no
 * exceptions" on weak hardware: a smaller local model, never a server call.
 */

import type { Tier } from './types'

export type AdvancedDtype = 'q4' | 'q4f16' | 'int8' | 'fp16'

export interface PinnedModel {
  /** Hugging Face repo id, e.g. "onnx-community/Qwen2.5-0.5B-Instruct". */
  repo: string
  /** Exact commit SHA this deployment pins to. A repo update never changes what ships until this is bumped deliberately. */
  revision: string
}

export interface ModelTierInfo {
  tier: Tier
  backendId: 'rule-based' | 'advanced'
  label: string
  description: string
  /** Populated once an advanced backend is integrated; null means "no download needed". */
  approxDownloadBytes: number | null
  /** The rewrite (causal-LM) model this tier prefers, when the advanced backend is used. */
  rewriteModel: PinnedModel | null
  /** Preferred weight precision for the rewrite model on capable hardware (WebGPU or a modern CPU). */
  dtype: AdvancedDtype | null
}

/** Shared across tiers: one multilingual sentence encoder is enough for semantic-similarity scoring at any tier. */
export const EMBEDDING_MODEL: PinnedModel = {
  repo: 'Xenova/paraphrase-multilingual-MiniLM-L12-v2',
  revision: '2c4055b12046f11709e9df2c122e59ffbdc2f900',
}

export const MODEL_TIERS: Record<Tier, ModelTierInfo> = {
  free: {
    tier: 'free',
    backendId: 'rule-based',
    label: 'Standard (on-device, rule-based)',
    description:
      'Deterministic dictionary substitution and AI-tell pattern swaps. No download, instant, unlimited use.',
    approxDownloadBytes: null,
    rewriteModel: {
      repo: 'onnx-community/Qwen2.5-0.5B-Instruct',
      revision: 'cc5cc01a65cc3ff17bdb73a7de33d879f62599b0',
    },
    dtype: 'q4',
  },
  pro: {
    tier: 'pro',
    backendId: 'rule-based',
    label: 'Advanced (on-device)',
    description:
      'More candidates generated per passage and the extended AI-tell library, same on-device guarantee. Optionally backed by a larger local model (see rewriteModel) once the caller opts in to the download.',
    approxDownloadBytes: null,
    rewriteModel: {
      repo: 'onnx-community/Qwen2.5-1.5B-Instruct',
      revision: '6287331f475a3e20e8c879be8fd4bf3551ad9d34',
    },
    dtype: 'q4f16',
  },
}

export interface RuntimeEnvironment {
  device: 'webgpu' | 'wasm' | 'cpu'
  lowMemory: boolean
}

/**
 * Resolves which pinned model/dtype a tier actually gets, given what the
 * caller's runtime can handle.
 *
 * The downgrade-to-Free-model rule only applies in a browser without WebGPU
 * ("wasm") or a WebGPU browser reporting low memory: a 1.5B model on
 * WASM/CPU-in-a-browser-tab is genuinely too slow to be usable. `device:
 * 'cpu'` (Node: the MCP server, the CLI, the published package) is
 * deliberately exempt: a developer machine or server running
 * onnxruntime-node is not the weak-hardware case this rule exists to
 * protect against, and treating "no WebGPU" as universally disqualifying
 * would silently downgrade every Node Pro-tier call to the Free model,
 * which is a real bug this shape is written to avoid repeating.
 *
 * The `q4f16` dtype (fp16 activations) is WebGPU-only for the same reason:
 * CPUs generally lack fast native fp16 arithmetic, so both WASM-in-browser
 * and Node stay on plain `q4`, which every pinned repo publishes.
 */
export function effectiveRewriteModel(tier: Tier, environment: RuntimeEnvironment): { model: PinnedModel; dtype: AdvancedDtype } {
  const weakBrowserHardware = environment.device === 'wasm' || (environment.device === 'webgpu' && environment.lowMemory)
  const useFreeModel = tier === 'free' || weakBrowserHardware
  const info = useFreeModel ? MODEL_TIERS.free : MODEL_TIERS.pro
  const dtype: AdvancedDtype = environment.device === 'webgpu' ? (info.dtype ?? 'q4') : 'q4'
  return { model: info.rewriteModel ?? MODEL_TIERS.free.rewriteModel!, dtype }
}
