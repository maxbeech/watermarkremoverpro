import { afterEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  defaultModelCacheDir,
  isModelCached,
  legacyModelCacheDir,
  migrateLegacyModelCache,
  resolveModelCacheDir,
} from './model-cache'
import type { PinnedModel } from '../models'

const MODEL: PinnedModel = { repo: 'onnx-community/Qwen2.5-0.5B-Instruct', revision: 'abc123' }

const temporaryHomes: string[] = []

function fakeHome(): string {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'wrp-cache-'))
  temporaryHomes.push(home)
  return home
}

afterEach(() => {
  while (temporaryHomes.length > 0) {
    fs.rmSync(temporaryHomes.pop()!, { recursive: true, force: true })
  }
})

describe('where the model cache lives', () => {
  it('defaults to the current brand, not the pre-rename one', () => {
    expect(defaultModelCacheDir('/home/x')).toBe('/home/x/.cache/watermarkremoverpro/models')
    expect(legacyModelCacheDir('/home/x')).toBe('/home/x/.cache/markwitness/models')
  })

  it('is configurable, and an explicit path wins', () => {
    const resolved = resolveModelCacheDir(
      { WATERMARKREMOVERPRO_MODEL_CACHE: '/models/here' },
      '/home/x',
    )
    expect(resolved).toEqual({ dir: '/models/here', overridden: true })
  })

  it('ignores an empty override rather than resolving to the process directory', () => {
    expect(resolveModelCacheDir({ WATERMARKREMOVERPRO_MODEL_CACHE: '  ' }, '/home/x')).toEqual({
      dir: '/home/x/.cache/watermarkremoverpro/models',
      overridden: false,
    })
  })
})

describe('migrating a pre-rename cache', () => {
  it('moves the existing weights instead of making the user download them again', () => {
    // The point of the migration. A rename that costs somebody a several
    // hundred megabyte download is a rename that gets reported as a bug.
    const home = fakeHome()
    const legacy = legacyModelCacheDir(home)
    fs.mkdirSync(path.join(legacy, MODEL.repo, MODEL.revision, 'onnx'), { recursive: true })
    fs.writeFileSync(path.join(legacy, MODEL.repo, MODEL.revision, 'onnx', 'model_q4.onnx'), 'weights')

    const location = resolveModelCacheDir({}, home)
    const migration = migrateLegacyModelCache(location, home)

    expect(migration.status).toBe('moved')
    expect(migration.note).toContain(location.dir)
    expect(isModelCached(location.dir, MODEL)).toBe(true)
    expect(fs.existsSync(legacy)).toBe(false)
    // The now-empty ~/.cache/markwitness goes too, rather than being left as litter.
    expect(fs.existsSync(path.dirname(legacy))).toBe(false)
  })

  it('says nothing when there is nothing to move', () => {
    const home = fakeHome()
    const migration = migrateLegacyModelCache(resolveModelCacheDir({}, home), home)
    expect(migration.status).toBe('nothing-to-move')
    expect(migration.note).toBeNull()
  })

  it('never merges two caches, and reports the one left behind', () => {
    // Merging is a guess about which copy of a shared file wins. The current
    // directory is the one in use, so the old one is named and left alone.
    const home = fakeHome()
    fs.mkdirSync(legacyModelCacheDir(home), { recursive: true })
    fs.mkdirSync(defaultModelCacheDir(home), { recursive: true })

    const migration = migrateLegacyModelCache(resolveModelCacheDir({}, home), home)
    expect(migration.status).toBe('both-exist')
    expect(migration.note).toContain(legacyModelCacheDir(home))
    expect(fs.existsSync(legacyModelCacheDir(home))).toBe(true)
  })

  it('leaves an explicitly configured directory alone', () => {
    // An operator who named a directory meant that directory, and did not ask
    // for a pre-rename cache to be moved into it.
    const home = fakeHome()
    fs.mkdirSync(legacyModelCacheDir(home), { recursive: true })
    const target = path.join(home, 'elsewhere')

    const migration = migrateLegacyModelCache(
      resolveModelCacheDir({ WATERMARKREMOVERPRO_MODEL_CACHE: target }, home),
      home,
    )
    expect(migration.status).toBe('nothing-to-move')
    expect(fs.existsSync(legacyModelCacheDir(home))).toBe(true)
    expect(fs.existsSync(target)).toBe(false)
  })
})

describe('knowing whether the weights are already here', () => {
  it('is false for a directory that does not exist', () => {
    expect(isModelCached(path.join(fakeHome(), 'nope'), MODEL)).toBe(false)
  })

  it('is false when the revision directory holds no weights', () => {
    // Config files alone are a kilobyte to re-fetch. The .onnx file is the
    // download worth avoiding, so it is the one that decides the answer.
    const dir = fakeHome()
    const revision = path.join(dir, MODEL.repo, MODEL.revision)
    fs.mkdirSync(revision, { recursive: true })
    fs.writeFileSync(path.join(revision, 'config.json'), '{}')
    expect(isModelCached(dir, MODEL)).toBe(false)
  })

  it('is true once a weights file is present under the pinned revision', () => {
    const dir = fakeHome()
    const onnx = path.join(dir, MODEL.repo, MODEL.revision, 'onnx')
    fs.mkdirSync(onnx, { recursive: true })
    fs.writeFileSync(path.join(onnx, 'model_q4.onnx'), 'weights')
    expect(isModelCached(dir, MODEL)).toBe(true)
  })

  it('does not accept a different revision of the same repo', () => {
    // The revision is pinned precisely so an upstream change cannot alter what
    // this build runs; the cache check has to respect the same pin.
    const dir = fakeHome()
    const onnx = path.join(dir, MODEL.repo, 'some-other-sha', 'onnx')
    fs.mkdirSync(onnx, { recursive: true })
    fs.writeFileSync(path.join(onnx, 'model_q4.onnx'), 'weights')
    expect(isModelCached(dir, MODEL)).toBe(false)
  })
})
