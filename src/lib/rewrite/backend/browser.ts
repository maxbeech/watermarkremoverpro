/**
 * The browser advanced backend: a real local LLM run via Transformers.js,
 * WebGPU when available, WASM otherwise, entirely inside the page (a Worker,
 * in the shipped UI, see src/components/rewrite). Model weights are
 * downloaded straight from the Hugging Face CDN and cached by the browser;
 * this file never sends the document text anywhere.
 *
 * Not wired into src/lib/rewrite/index.ts on purpose: creating this backend
 * downloads real weights, which the always-available rule-based default must
 * never do implicitly. A caller opts in explicitly (see rewrite-tool.tsx).
 */

import type { GenerateOptions, RewriteBackend } from './types'
import { generateWithTransformers, embedWithTransformers, type TransformersEnv } from './transformers-shared'
import { effectiveRewriteModel, type PinnedModel } from '../models'
import { detectBrowserCapability } from '../capabilities'
import type { Tier } from '../types'

export interface BrowserBackendProgress {
  status: string
  file?: string
  progress?: number
}

export interface CreateBrowserBackendOptions {
  tier: Tier
  onProgress?: (info: BrowserBackendProgress) => void
}

export async function createTransformersBrowserBackend(
  options: CreateBrowserBackendOptions,
): Promise<{ backend: RewriteBackend; model: PinnedModel; device: 'webgpu' | 'wasm' }> {
  const capability = await detectBrowserCapability()
  const device = capability.hasWebGPU ? 'webgpu' : 'wasm'
  const { model, dtype } = effectiveRewriteModel(options.tier, { device, lowMemory: capability.lowMemory })

  const env: TransformersEnv = {
    device,
    dtype,
    onProgress: options.onProgress,
  }

  const backend: RewriteBackend = {
    id: `transformers-browser:${model.repo}:${device}`,
    modelTier: 'advanced',
    async generate(passage: string, genOptions: GenerateOptions) {
      return generateWithTransformers(passage, genOptions, model, env)
    },
    async embed(text: string) {
      return embedWithTransformers(text, env)
    },
  }

  return { backend, model, device }
}
