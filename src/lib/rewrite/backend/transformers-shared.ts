/**
 * Shared Transformers.js plumbing for the advanced backend.
 *
 * Used by both backend/browser.ts (WebGPU/WASM) and backend/node.ts
 * (onnxruntime-node); the only difference between them is which `device`
 * and cache directory they pass in here. Pipelines are cached per
 * (repo, revision, device, dtype) so a document with many passages loads the
 * model once, not once per passage.
 *
 * `@huggingface/transformers` is imported dynamically so a caller that never
 * requests the advanced backend (the default rule-based path) never pays for
 * it in a bundle or a cold start.
 */

import type { PinnedModel, AdvancedDtype } from '../models'
import { EMBEDDING_MODEL } from '../models'
import type { GenerateOptions } from './types'

export type TransformersDevice = 'webgpu' | 'wasm' | 'cpu'

export interface TransformersEnv {
  device: TransformersDevice
  dtype: AdvancedDtype
  cacheDir?: string
  onProgress?: (info: { status: string; file?: string; progress?: number }) => void
}

async function loadTransformers() {
  return import('@huggingface/transformers')
}

function keyFor(model: PinnedModel, device: string, dtype: string): string {
  return `${model.repo}@${model.revision}:${device}:${dtype}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const generatorCache = new Map<string, Promise<any>>()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const embedderCache = new Map<string, Promise<any>>()

async function getGenerator(model: PinnedModel, env: TransformersEnv) {
  const key = keyFor(model, env.device, env.dtype)
  let entry = generatorCache.get(key)
  if (!entry) {
    entry = (async () => {
      const { pipeline, env: tjsEnv } = await loadTransformers()
      if (env.cacheDir) tjsEnv.cacheDir = env.cacheDir
      return pipeline('text-generation', model.repo, {
        revision: model.revision,
        device: env.device,
        dtype: env.dtype,
        progress_callback: env.onProgress,
      })
    })()
    generatorCache.set(key, entry)
  }
  return entry
}

async function getEmbedder(env: TransformersEnv) {
  const key = keyFor(EMBEDDING_MODEL, env.device, 'q8')
  let entry = embedderCache.get(key)
  if (!entry) {
    entry = (async () => {
      const { pipeline, env: tjsEnv } = await loadTransformers()
      if (env.cacheDir) tjsEnv.cacheDir = env.cacheDir
      return pipeline('feature-extraction', EMBEDDING_MODEL.repo, {
        revision: EMBEDDING_MODEL.revision,
        device: env.device,
        dtype: 'q8',
        progress_callback: env.onProgress,
      })
    })()
    embedderCache.set(key, entry)
  }
  return entry
}

const STRENGTH_INSTRUCTION: Record<GenerateOptions['strength'], string> = {
  preserve:
    'Make the smallest possible wording changes: swap a handful of words for close synonyms and vary sentence rhythm slightly. Keep the structure and every fact identical.',
  balanced:
    'Rewrite this in your own words while keeping the same meaning, structure and level of detail. Vary sentence length and word choice naturally.',
  aggressive:
    'Rewrite this substantially: restructure sentences, change word choice throughout, and write as a person would, while keeping every fact, number, name and claim exactly as given.',
  regenerate:
    'Rewrite this passage completely in a distinct voice, reorganizing sentence structure and phrasing, while keeping every fact, number, name and claim exactly as given.',
}

function buildMessages(
  passage: string,
  strength: GenerateOptions['strength'],
  language: string | undefined,
): Array<{ role: string; content: string }> {
  const languageClause = language && language !== 'en' ? ` Respond in the same language as the passage (code: ${language}).` : ''
  const system =
    'You are a careful copy editor reducing statistical AI-writing patterns in a passage the user wrote themselves. ' +
    'Strictly preserve every fact, number, date, name and negation in the passage. ' +
    'Reply with ONLY the rewritten passage text: no preamble, no quotation marks, no explanation.' +
    languageClause
  return [
    { role: 'system', content: system },
    { role: 'user', content: `${STRENGTH_INSTRUCTION[strength]}\n\nPassage:\n${passage}` },
  ]
}

/** Extracts the assistant's reply text from a text-generation pipeline's chat output. */
function extractReply(output: unknown): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const first = Array.isArray(output) ? (output[0] as any) : output
  const generated = first?.generated_text
  if (Array.isArray(generated)) {
    const last = generated[generated.length - 1]
    return typeof last?.content === 'string' ? last.content : ''
  }
  return typeof generated === 'string' ? generated : ''
}

export async function generateWithTransformers(
  passage: string,
  options: GenerateOptions,
  model: PinnedModel,
  env: TransformersEnv,
): Promise<string[]> {
  const generator = await getGenerator(model, env)
  const messages = buildMessages(passage, options.strength, options.language)
  const count = Math.max(1, options.count)
  const maxNewTokens = Math.min(500, Math.max(60, Math.ceil(passage.length / 3) + 40))

  const results: string[] = []
  for (let i = 0; i < count; i++) {
    // Increasing temperature per candidate is the real diversity mechanism
    // here (this model has no batched multi-sequence sampling exposed
    // through the pipeline API), so each call is a genuinely distinct draw.
    const temperature = 0.45 + i * 0.22
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const output = await (generator as any)(messages, {
      max_new_tokens: maxNewTokens,
      do_sample: true,
      temperature,
      top_p: 0.92,
      repetition_penalty: 1.15,
    })
    const reply = extractReply(output).trim().replace(/^["'“]|["'”]$/g, '')
    if (reply.length > 0) results.push(reply)
  }
  return Array.from(new Set(results))
}

export async function embedWithTransformers(text: string, env: TransformersEnv): Promise<number[]> {
  const embedder = await getEmbedder(env)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const output = await (embedder as any)(text, { pooling: 'mean', normalize: true })
  return Array.from(output.data as ArrayLike<number>)
}
