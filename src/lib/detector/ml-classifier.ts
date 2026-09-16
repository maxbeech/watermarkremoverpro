/**
 * The model-backed detection channel.
 *
 * Every other channel in this detector is deterministic arithmetic (see the
 * module doc comment in ./index.ts). This is the one genuine trained
 * classifier: a real RoBERTa sequence-classification model
 * (DETECTOR_MODEL, see ./models.ts), run entirely on-device via
 * Transformers.js, the same library and the same "pipeline cached by
 * (repo, revision, device, dtype)" pattern already used for the rewrite
 * engine's local model (src/lib/rewrite/backend/transformers-shared.ts).
 * This file does not import that one: the detector and the rewrite engine
 * are independent modules (rewrite depends on the detector, never the
 * reverse), so this keeps its own small, self-contained loader rather than
 * reaching across that boundary.
 *
 * `@huggingface/transformers` is imported dynamically so a caller that never
 * asks for model-backed classification (the default: every existing call to
 * checkDocument()) never pays for it in a bundle or a cold start. See
 * `includeModel` in ./index.ts.
 *
 * Browser callers pass a WebGPU/WASM env (weights cached by the browser
 * itself, via Transformers.js's own Cache API usage). Node callers (the API
 * routes, the MCP server) pass a `cpu` env with a `cacheDir`, the same
 * ~/.cache/watermarkremoverpro/models directory the rewrite engine's Node
 * backend already uses (src/lib/rewrite/backend/model-cache.ts). Sharing it
 * is safe, since Transformers.js keys its on-disk cache by repo and revision.
 */

import { DETECTOR_MODEL, DETECTOR_MODEL_LABELS, DETECTOR_MODEL_LANGUAGES } from './models'
import type { LanguageCode } from './languages'

export type MlClassifierStatus = 'ok' | 'unsupported_language' | 'unavailable' | 'error'
export type MlClassifierLabel = 'human' | 'ai'

export interface MlClassifierResult {
  status: MlClassifierStatus
  /** Probability (0-1) the model assigns to the 'ai' label. Null unless status is 'ok'. */
  aiProbability: number | null
  label: MlClassifierLabel | null
  modelId: string
  /** Populated only when status is 'error' or 'unavailable'. */
  detail?: string
}

export interface MlClassifierEnv {
  device: 'webgpu' | 'wasm' | 'cpu'
  cacheDir?: string
  onProgress?: (info: { status: string; file?: string; progress?: number }) => void
}

const MODEL_ID = `${DETECTOR_MODEL.repo}@${DETECTOR_MODEL.revision}`

async function loadTransformers() {
  return import('@huggingface/transformers')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const classifierCache = new Map<string, Promise<any>>()

function keyFor(env: MlClassifierEnv): string {
  return `${MODEL_ID}:${env.device}`
}

async function getClassifier(env: MlClassifierEnv) {
  const key = keyFor(env)
  let entry = classifierCache.get(key)
  if (!entry) {
    entry = (async () => {
      const { pipeline, env: tjsEnv } = await loadTransformers()
      if (env.cacheDir) tjsEnv.cacheDir = env.cacheDir
      return pipeline('text-classification', DETECTOR_MODEL.repo, {
        revision: DETECTOR_MODEL.revision,
        device: env.device,
        // int8 is the quantization this repo explicitly publishes
        // (onnx/model_int8.onnx), avoiding any dtype-to-filename ambiguity.
        dtype: 'int8',
        progress_callback: env.onProgress,
      })
    })()
    classifierCache.set(key, entry)
  }
  return entry
}

/**
 * Download and initialise the model without classifying anything.
 *
 * Exists so a caller can start the download at the moment it knows a
 * classification is coming, rather than at the moment it has the text. The
 * first load of this model is tens of megabytes; a UI that waits until the
 * text is ready before starting it shows a finished-looking result while the
 * model that is supposed to have produced it is still arriving. The pipeline is
 * cached by (repo, revision, device), so the later `classifyDocument` call
 * reuses exactly this instance rather than starting again.
 *
 * Resolves either way. A failure here is not the caller's problem to handle:
 * whatever went wrong will surface again, with its real message, on the
 * classification call that actually needs an answer.
 */
export async function warmClassifier(env: MlClassifierEnv): Promise<void> {
  try {
    await getClassifier(env)
  } catch {
    // Deliberately swallowed. See above.
  }
}

/**
 * Runs the model on `text`, unconditionally. Callers wanting the
 * "does this language even have a trusted model" gate should call
 * `classifyDocument` instead; this is the raw primitive it's built on, kept
 * separate so a caller who has already made that decision (or is testing the
 * model directly) isn't forced through the language check again.
 */
export async function classifyText(
  text: string,
  env: MlClassifierEnv,
): Promise<Pick<MlClassifierResult, 'aiProbability' | 'label'>> {
  const classifier = await getClassifier(env)
  // top_k: null returns every class's score (not just the winning label), so
  // aiProbability is always the model's actual probability for 'ai', never
  // just "whichever label happened to win" recast as a number.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const output = (await (classifier as any)(text, { top_k: null })) as Array<{ label: string; score: number }>
  const scores = Array.isArray(output[0]) ? (output[0] as unknown as Array<{ label: string; score: number }>) : output
  const aiScore = scores.find((s) => s.label === DETECTOR_MODEL_LABELS.ai)?.score ?? null
  const humanScore = scores.find((s) => s.label === DETECTOR_MODEL_LABELS.human)?.score ?? null
  const aiProbability = aiScore ?? (humanScore !== null ? 1 - humanScore : null)
  return { aiProbability, label: (aiProbability ?? 0) >= 0.5 ? 'ai' : 'human' }
}

/**
 * The gated entry point every caller should use: honest about the one thing
 * this specific model was never trained to do, which is anything other than
 * English (see DETECTOR_MODEL_LANGUAGES in ./models.ts). Never fabricates a
 * result for a language it has no evidence about: the same "status beside a
 * nullable number" discipline the rest of AnalysisResult follows.
 */
export async function classifyDocument(
  text: string,
  language: LanguageCode | null,
  env: MlClassifierEnv,
): Promise<MlClassifierResult> {
  if (!language || !(DETECTOR_MODEL_LANGUAGES as readonly string[]).includes(language)) {
    return {
      status: 'unsupported_language',
      aiProbability: null,
      label: null,
      modelId: MODEL_ID,
      detail: `This model is trained on English text only. Document language: ${language ?? 'undetermined'}.`,
    }
  }

  try {
    const { aiProbability, label } = await classifyText(text, env)
    return { status: 'ok', aiProbability, label, modelId: MODEL_ID }
  } catch (err) {
    return {
      status: 'error',
      aiProbability: null,
      label: null,
      modelId: MODEL_ID,
      detail: (err as Error).message,
    }
  }
}
