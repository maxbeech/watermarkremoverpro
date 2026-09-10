/**
 * Where the on-device model weights live, and how to tell whether they are
 * already here.
 *
 * Node only: imports node:fs/node:os/node:path, so nothing that runs in a
 * browser may import this file. The browser backend has no equivalent, because
 * the browser caches model weights itself through the Cache API.
 *
 * Two jobs:
 *
 * 1. Resolve the cache directory. It moved with the rename, from
 *    ~/.cache/markwitness/models to ~/.cache/watermarkremoverpro/models, and
 *    the move relocates an existing cache rather than making anybody download
 *    a gigabyte of weights a second time. WATERMARKREMOVERPRO_MODEL_CACHE
 *    overrides the location entirely, and an override is never migrated into,
 *    because an operator who named a directory meant that directory.
 *
 * 2. Answer whether a given pinned model is already cached. That is what lets
 *    the default engine choice be "use the local model when it is here" rather
 *    than either "never use it" or "stall the caller's first call on a large
 *    download they did not ask for". See ../engine-choice.ts.
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { ENV_MODEL_CACHE } from '@/lib/env-names'
import type { PinnedModel } from '../models'

/** The directory names under ~/.cache, current and pre-rename. */
export const CACHE_NAMESPACE = 'watermarkremoverpro'
export const LEGACY_CACHE_NAMESPACE = 'markwitness'

export const defaultModelCacheDir = (home: string): string =>
  path.join(home, '.cache', CACHE_NAMESPACE, 'models')

export const legacyModelCacheDir = (home: string): string =>
  path.join(home, '.cache', LEGACY_CACHE_NAMESPACE, 'models')

export interface CacheLocation {
  dir: string
  /** True when the caller named the directory, in which case nothing is migrated into it. */
  overridden: boolean
}

export function resolveModelCacheDir(
  env: Record<string, string | undefined> = process.env,
  home: string = os.homedir(),
): CacheLocation {
  const configured = env[ENV_MODEL_CACHE]
  if (typeof configured === 'string' && configured.trim().length > 0) {
    return { dir: path.resolve(configured.trim()), overridden: true }
  }
  return { dir: defaultModelCacheDir(home), overridden: false }
}

export type CacheMigrationStatus = 'moved' | 'copied' | 'nothing-to-move' | 'both-exist' | 'failed'

export interface CacheMigration {
  status: CacheMigrationStatus
  from: string
  to: string
  /** Always populated for a status a caller should say out loud; null for the ordinary case. */
  note: string | null
}

/**
 * Moves a pre-rename cache to the current location, once.
 *
 * A rename that costs the user a multi-hundred-megabyte download is a rename
 * that gets reported as a bug, so this relocates what is already on disk.
 * `rename` first because it is atomic and instant; a copy is the fallback for
 * the one case rename cannot serve (the two paths on different filesystems,
 * which a symlinked or mounted ~/.cache makes real).
 *
 * Never throws. A failed migration leaves the legacy directory untouched and
 * says what went wrong, and the caller reports it: the consequence is a
 * re-download, which is a slow first call rather than a wrong answer, and
 * hiding it would make the slow call inexplicable.
 */
export function migrateLegacyModelCache(
  location: CacheLocation,
  home: string = os.homedir(),
): CacheMigration {
  const from = legacyModelCacheDir(home)
  const to = location.dir
  const base: Omit<CacheMigration, 'status' | 'note'> = { from, to }

  if (location.overridden) {
    return { ...base, status: 'nothing-to-move', note: null }
  }
  if (!fs.existsSync(from)) {
    return { ...base, status: 'nothing-to-move', note: null }
  }
  if (fs.existsSync(to)) {
    // Merging two caches is a guess about which copy of a shared file wins.
    // Leave both alone and say so; the current one is the one in use.
    return {
      ...base,
      status: 'both-exist',
      note: `A pre-rename model cache is still at ${from}. ${to} is the one in use, so the old directory is doing nothing and can be deleted.`,
    }
  }

  try {
    fs.mkdirSync(path.dirname(to), { recursive: true })
    fs.renameSync(from, to)
    pruneEmptyLegacyParent(from)
    return { ...base, status: 'moved', note: `Moved the on-device model cache from ${from} to ${to}.` }
  } catch (renameErr) {
    try {
      fs.cpSync(from, to, { recursive: true })
      fs.rmSync(from, { recursive: true, force: true })
      pruneEmptyLegacyParent(from)
      return { ...base, status: 'copied', note: `Copied the on-device model cache from ${from} to ${to}.` }
    } catch (copyErr) {
      return {
        ...base,
        status: 'failed',
        note:
          `Could not move the on-device model cache from ${from} to ${to} ` +
          `(${(renameErr as Error).message}; copy also failed: ${(copyErr as Error).message}). ` +
          'The weights will be downloaded again on first use.',
      }
    }
  }
}

/** Removes ~/.cache/markwitness once its only child is gone, and never complains if it cannot. */
function pruneEmptyLegacyParent(legacyModelsDir: string): void {
  const parent = path.dirname(legacyModelsDir)
  try {
    if (fs.readdirSync(parent).length === 0) fs.rmdirSync(parent)
  } catch {
    // A non-empty or unreadable directory is not this function's business.
  }
}

/**
 * Whether a pinned model's weights are already on disk.
 *
 * Transformers.js's filesystem cache keys a pinned revision as
 * `<cacheDir>/<repo>/<revision>/<file>` (verified against the installed
 * @huggingface/transformers 4.2.0: see buildResourcePaths in
 * src/utils/hub.js, which uses the request URL as the key only when the
 * revision is "main", and this product always pins an exact commit). So the
 * question is whether that directory holds the expensive part.
 *
 * "The expensive part" is deliberately the weights, not the whole file set: a
 * missing config.json costs a kilobyte to re-fetch, whereas the .onnx file is
 * the download worth avoiding. A partially populated cache therefore reads as
 * cached and completes itself on load, which is what the library does anyway.
 */
export function isModelCached(cacheDir: string, model: PinnedModel): boolean {
  const dir = path.join(cacheDir, model.repo, model.revision)
  try {
    if (!fs.statSync(dir).isDirectory()) return false
  } catch {
    return false
  }
  return containsWeights(dir)
}

const WEIGHT_EXTENSIONS = ['.onnx', '.onnx_data']

function containsWeights(dir: string, depth = 0): boolean {
  if (depth > 3) return false
  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return false
  }
  for (const entry of entries) {
    if (entry.isFile() && WEIGHT_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) return true
    if (entry.isDirectory() && containsWeights(path.join(dir, entry.name), depth + 1)) return true
  }
  return false
}
