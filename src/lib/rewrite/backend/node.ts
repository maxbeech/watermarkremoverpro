/**
 * The Node advanced backend: the same real local LLM as backend/browser.ts,
 * run via onnxruntime-node instead of WebGPU/WASM. Used by the MCP server
 * and the local package/CLI, never by anything running in the browser
 * (it imports node:os/node:path, which do not exist there).
 *
 * Caches weights to ~/.cache/markwitness/models, downloaded from the
 * Hugging Face CDN on first use, never from a WatermarkRemoverPro-operated server.
 */

import os from 'node:os'
import path from 'node:path'
import type { GenerateOptions, RewriteBackend } from './types'
import { generateWithTransformers, embedWithTransformers, type TransformersEnv } from './transformers-shared'
import { effectiveRewriteModel } from '../models'
import type { Tier } from '../types'

const CACHE_DIR = path.join(os.homedir(), '.cache', 'markwitness', 'models')

export function createTransformersNodeBackend(tier: Tier): RewriteBackend {
  // device: 'cpu' deliberately never triggers the browser-only "weak
  // hardware, downgrade Pro to the Free model" rule in effectiveRewriteModel:
  // a developer machine or server running onnxruntime-node is not the case
  // that rule protects against, and Node has no WebGPU signal to check.
  const { model, dtype } = effectiveRewriteModel(tier, { device: 'cpu', lowMemory: false })

  const env: TransformersEnv = {
    device: 'cpu',
    dtype,
    cacheDir: CACHE_DIR,
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
