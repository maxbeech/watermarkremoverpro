import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { OPEN_REFERENCE_KEY } from '@/lib/detector/keys'
import { effectiveRewriteModel } from '../models'
import type { RewriteBackend } from './types'
import { describeEngine, resetModelCacheMigrationForTests, runRewriteOnNode } from './node-engine'

/**
 * The reporting contract, exercised end to end without downloading a model.
 *
 * `createBackend` stands in for the real Transformers.js backend. Everything
 * else is the production path: the same cache probe, the same decision, the
 * same reporting.
 */

const SAMPLE = `
The committee met on Tuesday evening to consider the revised drainage proposal for the eastern
site. Several members asked whether the survey had been completed in full, and the chair noted
that the report had been circulated only two days beforehand. A decision was deferred until the
next meeting, when the surveyor is expected to attend in person and answer questions directly.
The clerk agreed to write to the applicant setting out the outstanding points, including access
arrangements and the likely effect on the neighbouring lane. Members were broadly sympathetic to
the scheme but felt that the drawings submitted so far did not show enough detail to judge it
properly. Nothing further was decided, and the matter will return in its current form unless the
applicant chooses to withdraw it in the meantime.
`.trim()

const REQUEST = { text: SAMPLE, strength: 'balanced' as const, tier: 'free' as const }

let cacheDir: string

const stubBackend: RewriteBackend = {
  id: 'stub-advanced',
  modelTier: 'advanced',
  async generate(passage) {
    return [`${passage} It was noted.`]
  },
  async embed() {
    return [1, 0, 0]
  },
}

const throwingFactory = () => {
  throw new Error('onnxruntime is not available on this platform')
}

beforeEach(() => {
  cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wrp-engine-'))
  resetModelCacheMigrationForTests()
})

afterEach(() => {
  fs.rmSync(cacheDir, { recursive: true, force: true })
})

/** Puts a weights-shaped file where the cache probe looks for the free tier's model. */
function pretendTheModelIsDownloaded() {
  const { model } = effectiveRewriteModel('free', { device: 'cpu', lowMemory: false })
  const dir = path.join(cacheDir, model.repo, model.revision, 'onnx')
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'model_q4.onnx'), 'weights')
}

const env = (over: Record<string, string> = {}) => ({
  WATERMARKREMOVERPRO_MODEL_CACHE: cacheDir,
  ...over,
})

describe('runRewriteOnNode', () => {
  it('runs the deterministic engine when the model is not downloaded, and says why', async () => {
    const { result, engine } = await runRewriteOnNode(REQUEST, [OPEN_REFERENCE_KEY], {
      env: env(),
      createBackend: () => stubBackend,
    })

    expect(result.status).toBe('ok')
    expect(engine.used).toBe('standard')
    expect(engine.requested).toBe('auto')
    expect(engine.failure).toBeNull()
    expect(engine.reason).toContain(cacheDir)
  })

  it('runs the local model, unasked, once the weights are on the machine', async () => {
    // The behavioural change this work is for: a machine that has the model
    // gets the model, without the caller having to remember to name it.
    pretendTheModelIsDownloaded()

    const { engine } = await runRewriteOnNode(REQUEST, [OPEN_REFERENCE_KEY], {
      env: env(),
      createBackend: () => stubBackend,
    })

    expect(engine.used).toBe('advanced')
    expect(engine.backendId).toBe('stub-advanced')
  })

  it('honours an explicit standard request even with the weights present', async () => {
    pretendTheModelIsDownloaded()
    const { engine } = await runRewriteOnNode(REQUEST, [OPEN_REFERENCE_KEY], {
      env: env(),
      model: 'standard',
      createBackend: () => stubBackend,
    })
    expect(engine.used).toBe('standard')
  })

  it('takes its default from configuration', async () => {
    // Config, not a hardcoded special case: a machine that should always use
    // the local model says so once rather than at every call site.
    const { engine } = await runRewriteOnNode(REQUEST, [OPEN_REFERENCE_KEY], {
      env: env({ WATERMARKREMOVERPRO_REWRITE_MODEL: 'advanced' }),
      createBackend: () => stubBackend,
    })
    expect(engine.requested).toBe('advanced')
    expect(engine.used).toBe('advanced')
  })

  it('refuses a misspelled configured value rather than running a different engine', async () => {
    await expect(
      runRewriteOnNode(REQUEST, [OPEN_REFERENCE_KEY], {
        env: env({ WATERMARKREMOVERPRO_REWRITE_MODEL: 'advnced' }),
      }),
    ).rejects.toThrow(/WATERMARKREMOVERPRO_REWRITE_MODEL/)
  })
})

describe('when the local model cannot load', () => {
  it('reports the switch and attaches the reason, rather than degrading silently', async () => {
    const { result, engine } = await runRewriteOnNode(REQUEST, [OPEN_REFERENCE_KEY], {
      env: env(),
      model: 'advanced',
      createBackend: throwingFactory,
    })

    expect(result.status).toBe('ok')
    expect(engine.used).toBe('standard')
    expect(engine.requested).toBe('advanced')
    expect(engine.failure?.message).toContain('onnxruntime is not available')
    expect(engine.reason).toMatch(/failed to load/)
    // The escape hatch is named in the message, so a caller who wants a hard
    // failure does not have to go looking for it.
    expect(engine.reason).toContain('WATERMARKREMOVERPRO_REWRITE_STRICT')
  })

  it('throws instead when configured to refuse a substitute', async () => {
    await expect(
      runRewriteOnNode(REQUEST, [OPEN_REFERENCE_KEY], {
        env: env({ WATERMARKREMOVERPRO_REWRITE_STRICT: '1' }),
        model: 'advanced',
        createBackend: throwingFactory,
      }),
    ).rejects.toThrow(/onnxruntime is not available/)
  })

  it('never reports a failure when none happened', async () => {
    const { engine } = await runRewriteOnNode(REQUEST, [OPEN_REFERENCE_KEY], {
      env: env(),
      model: 'standard',
    })
    expect(engine.failure).toBeNull()
  })
})

describe('describeEngine', () => {
  it('names the engine and carries the reason in one line', async () => {
    const { engine } = await runRewriteOnNode(REQUEST, [OPEN_REFERENCE_KEY], {
      env: env(),
      model: 'standard',
    })
    const line = describeEngine(engine)
    expect(line).toContain('standard (rule-based, no download)')
    expect(line).toContain(engine.reason)
  })
})
