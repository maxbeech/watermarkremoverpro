/**
 * Tests the gating and result-shaping logic around the model-backed channel
 * without ever downloading or running the real ~100MB model: `@huggingface/
 * transformers` is mocked, so these run instantly and offline, in CI and
 * everywhere else.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DETECTOR_MODEL, DETECTOR_MODEL_LABELS } from './models'

const MODEL_ID = `${DETECTOR_MODEL.repo}@${DETECTOR_MODEL.revision}`
const AI = DETECTOR_MODEL_LABELS.ai
const HUMAN = DETECTOR_MODEL_LABELS.human

/** Registers a fake `pipeline()` for the next import of ml-classifier.ts. */
function mockTransformers(classify: (text: string) => Promise<unknown> | unknown) {
  vi.doMock('@huggingface/transformers', () => ({
    pipeline: vi.fn(async (_task: string, _repo: string, _opts: unknown) => {
      return async (text: string, _options: unknown) => classify(text)
    }),
    env: {},
  }))
}

async function freshModule() {
  vi.resetModules()
  return import('./ml-classifier')
}

describe('classifyDocument', () => {
  afterEach(() => {
    vi.doUnmock('@huggingface/transformers')
    vi.resetModules()
  })

  it('refuses to run on a language it was not trained on, without touching the model at all', async () => {
    const pipelineSpy = vi.fn()
    vi.doMock('@huggingface/transformers', () => ({ pipeline: pipelineSpy, env: {} }))
    const { classifyDocument } = await freshModule()

    const result = await classifyDocument('Bonjour le monde.', 'fr', { device: 'wasm' })

    expect(result.status).toBe('unsupported_language')
    expect(result.aiProbability).toBeNull()
    expect(result.label).toBeNull()
    expect(result.modelId).toBe(MODEL_ID)
    expect(pipelineSpy).not.toHaveBeenCalled()
  })

  it('refuses to run when the language is undetermined', async () => {
    const pipelineSpy = vi.fn()
    vi.doMock('@huggingface/transformers', () => ({ pipeline: pipelineSpy, env: {} }))
    const { classifyDocument } = await freshModule()

    const result = await classifyDocument('...', null, { device: 'wasm' })

    expect(result.status).toBe('unsupported_language')
    expect(pipelineSpy).not.toHaveBeenCalled()
  })

  it('reports the real probability the model assigns to the ai label', async () => {
    mockTransformers(() => [
      { label: HUMAN, score: 0.1 },
      { label: AI, score: 0.9 },
    ])
    const { classifyDocument } = await freshModule()

    const result = await classifyDocument('This is a document written for a test.', 'en', { device: 'wasm' })

    expect(result.status).toBe('ok')
    expect(result.aiProbability).toBeCloseTo(0.9)
    expect(result.label).toBe('ai')
    expect(result.modelId).toBe(MODEL_ID)
  })

  it('derives the ai probability from the human score when only that label is returned', async () => {
    mockTransformers(() => [{ label: HUMAN, score: 0.8 }])
    const { classifyDocument } = await freshModule()

    const result = await classifyDocument('Some plain writing.', 'en', { device: 'wasm' })

    expect(result.status).toBe('ok')
    expect(result.aiProbability).toBeCloseTo(0.2)
    expect(result.label).toBe('human')
  })

  it('labels human below the 0.5 threshold and ai at or above it', async () => {
    mockTransformers(() => [{ label: AI, score: 0.49 }])
    const { classifyDocument: classifyBelow } = await freshModule()
    const below = await classifyBelow('text', 'en', { device: 'wasm' })
    expect(below.label).toBe('human')

    mockTransformers(() => [{ label: AI, score: 0.5 }])
    const { classifyDocument: classifyAt } = await freshModule()
    const at = await classifyAt('text', 'en', { device: 'wasm' })
    expect(at.label).toBe('ai')
  })

  it('reports a genuine model failure as status "error", with the real message, never a fabricated score', async () => {
    mockTransformers(() => {
      throw new Error('WebGPU device lost')
    })
    const { classifyDocument } = await freshModule()

    const result = await classifyDocument('text', 'en', { device: 'webgpu' })

    expect(result.status).toBe('error')
    expect(result.aiProbability).toBeNull()
    expect(result.label).toBeNull()
    expect(result.detail).toContain('WebGPU device lost')
  })

  it('caches the pipeline by device, loading it only once per device across repeated calls', async () => {
    const pipelineFactory = vi.fn(async () => async () => [{ label: AI, score: 0.6 }])
    vi.doMock('@huggingface/transformers', () => ({ pipeline: pipelineFactory, env: {} }))
    const { classifyDocument } = await freshModule()

    await classifyDocument('one', 'en', { device: 'wasm' })
    await classifyDocument('two', 'en', { device: 'wasm' })
    await classifyDocument('three', 'en', { device: 'cpu' })

    expect(pipelineFactory).toHaveBeenCalledTimes(2)
  })
})
