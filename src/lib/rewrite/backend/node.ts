/**
 * The Node advanced backend: the same real local LLM as backend/browser.ts,
 * run via onnxruntime-node instead of WebGPU/WASM. Used by the MCP server
 * and the local package/CLI, never by anything running in the browser
 * (it imports node:os/node:path, which do not exist there).
 *
 * Caches weights to ~/.cache/watermarkremoverpro/models (see ./model-cache.ts,
 * which also relocates a pre-rename cache rather than making anyone download
 * the weights twice), fetched from the Hugging Face CDN on first use, never
 * from a WatermarkRemoverPro-operated server.
 */

import type { GenerateOptions, RewriteBackend } from './types'
import { generateWithTransformers, embedWithTransformers, type TransformersEnv } from './transformers-shared'
import { effectiveRewriteModel } from '../models'
import type { Tier } from '../types'
import { resolveModelCacheDir } from './model-cache'

export function createTransformersNodeBackend(tier: Tier): RewriteBackend {
  // device: 'cpu' deliberately never triggers the browser-only "weak
  // hardware, downgrade Pro to the Free model" rule in effectiveRewriteModel:
  // a developer machine or server running onnxruntime-node is not the case
  // that rule protects against, and Node has no WebGPU signal to check.
  const { model, dtype } = effectiveRewriteModel(tier, { device: 'cpu', lowMemory: false })

  const env: TransformersEnv = {
    device: 'cpu',
    dtype,
    cacheDir: resolveModelCacheDir().dir,
  }

  return {
    id: `transformers-node:${model.repo}`,
    modelTier: 'advanced',
    async generate(passage: string, options: GenerateOptions) {
      return generateWithTransformers(passage, options, model, env)
    },
    async embed(text: string) {
      return embedWithTransformers(text, env)
    },
  }
}
