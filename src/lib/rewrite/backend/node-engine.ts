/**
 * Running a rewrite in a Node process, engine choice included.
 *
 * The ONE implementation of "pick an engine, run the rewrite, report what
 * actually happened" for every Node caller: the MCP server, the CLI, and
 * anything built on @watermarkremoverpro/rewrite-engine/node. Before this,
 * the MCP server and the CLI each had their own copy of the try/catch around
 * the advanced backend, and they already disagreed about what to tell the
 * caller when it failed.
 *
 * Node only (it resolves a filesystem cache directory). Nothing that runs in a
 * browser may import it; the browser has its own path through
 * ./browser.ts and src/components/workspace/use-rewrite-runner.ts.
 *
 * The reporting contract, which is the reason this file exists:
 *
 *  - `engine.used` names the engine that did the work, always.
 *  - `engine.reason` says why that engine, always, in a sentence a caller can
 *    print verbatim.
 *  - `engine.failure` is non-null exactly when the local model was chosen and
 *    could not run, and carries the underlying error message.
 *
 * A switch to the deterministic engine is therefore reported rather than
 * silent, which is the project rule. It is also refusable: set
 * WATERMARKREMOVERPRO_REWRITE_STRICT=1 and a failure of the local model throws
 * instead, for a pipeline that would rather stop than quietly produce a
 * weaker result than it asked for.
 */

import type { DetectionKey } from '@/lib/detector/keys'
import { ENV_REWRITE_MODEL, ENV_REWRITE_STRICT } from '@/lib/env-names'
import { reduceEvidence } from '../index'
import { rewriteDocument } from '../orchestrator'
import { effectiveRewriteModel } from '../models'
import type { RewriteRequest, RewriteResult } from '../types'
import type { RewriteBackend } from './types'
import {
  configuredModelChoice,
  decideRewriteEngine,
  type ModelChoice,
} from '../engine-choice'
import { createTransformersNodeBackend } from './node'
import {
  isModelCached,
  migrateLegacyModelCache,
  resolveModelCacheDir,
  type CacheMigration,
} from './model-cache'

export interface EngineReport {
  requested: ModelChoice
  /**
   * The engine that was in place for this run. "advanced" does not imply the
   * model generated anything: a document with no targetable passage is not
   * sent to any rewriter, and the result's own passage counts are what say
   * how much work happened. It DOES imply that had there been work, this is
   * what would have done it, and that nothing failed on the way.
   */
  used: 'standard' | 'advanced'
  /** The backend that ran, e.g. "transformers-node:onnx-community/Qwen2.5-0.5B-Instruct". */
  backendId: string
  reason: string
  modelCacheDir: string
  /** Non-null only when a pre-rename cache was found; the caller prints the note. */
  cacheMigration: CacheMigration | null
  /** Non-null only when the local model was chosen and could not run. */
  failure: { message: string } | null
}

export interface RunRewriteOptions {
  model?: ModelChoice
  env?: Record<string, string | undefined>
  /**
   * Test seam. Substituting the backend is how the reporting contract above
   * gets tested without downloading half a gigabyte of weights in CI, and how
   * the "the local model could not load" branch gets exercised deterministically
   * rather than by unplugging a network cable. Production callers omit it.
   */
  createBackend?: (tier: RewriteRequest['tier']) => RewriteBackend
}

export interface RunRewriteOutcome {
  result: RewriteResult
  engine: EngineReport
}

/**
 * The cache is relocated at most once per process, not once per call. Repeating
 * the filesystem probe on every rewrite would cost a stat per call to answer a
 * question that cannot change while the process runs.
 */
let migrationForProcess: CacheMigration | null | undefined

export async function runRewriteOnNode(
  request: RewriteRequest,
  keys: DetectionKey[],
  options: RunRewriteOptions = {},
): Promise<RunRewriteOutcome> {
  const env = options.env ?? process.env
  const requested = options.model ?? configuredModelChoice(env[ENV_REWRITE_MODEL], ENV_REWRITE_MODEL)
  const strict = (env[ENV_REWRITE_STRICT] ?? '').trim() === '1'

  const location = resolveModelCacheDir(env)
  if (migrationForProcess === undefined) {
    const migration = migrateLegacyModelCache(location)
    migrationForProcess = migration.note === null ? null : migration
  }

  // Which model this tier resolves to on this machine decides which directory
  // to look in, so the cached check asks about the model that would actually
  // be loaded rather than about the tier's nominal one.
  const { model } = effectiveRewriteModel(request.tier, { device: 'cpu', lowMemory: false })
  const choice = decideRewriteEngine({
    requested,
    modelCached: isModelCached(location.dir, model),
    cacheDir: location.dir,
  })

  const report = (over: Partial<EngineReport>): EngineReport => ({
    requested,
    used: choice.engine,
    backendId: 'rule-based',
    reason: choice.reason,
    modelCacheDir: location.dir,
    cacheMigration: migrationForProcess ?? null,
    failure: null,
    ...over,
  })

  if (choice.engine === 'advanced') {
    try {
      const backend = (options.createBackend ?? createTransformersNodeBackend)(request.tier)
      const result = await rewriteDocument(request, backend, keys)
      return { result, engine: report({ used: 'advanced', backendId: backend.id }) }
    } catch (err) {
      const message = (err as Error).message
      if (strict) {
        // Configured to refuse a weaker result than the one requested.
        throw new Error(
          `The local model could not run (${message}), and ${ENV_REWRITE_STRICT}=1 refuses the deterministic engine as a substitute.`,
        )
      }
      const result = await reduceEvidence(request, keys)
      return {
        result,
        engine: report({
          used: 'standard',
          reason:
            `${choice.reason} It then failed to load, so the deterministic engine finished the job instead. ` +
            `Set ${ENV_REWRITE_STRICT}=1 to make this a hard failure.`,
          failure: { message },
        }),
      }
    }
  }

  const result = await reduceEvidence(request, keys)
  return { result, engine: report({ used: 'standard' }) }
}

/** One line naming the engine that ran, for a CLI or a log. */
export function describeEngine(engine: EngineReport): string {
  const head =
    engine.used === 'advanced'
      ? `advanced (${engine.backendId}; cached under ${engine.modelCacheDir})`
      : 'standard (rule-based, no download)'
  return `${head}: ${engine.reason}`
}

/** Test seam: forget the once-per-process cache migration. */
export function resetModelCacheMigrationForTests(): void {
  migrationForProcess = undefined
}
