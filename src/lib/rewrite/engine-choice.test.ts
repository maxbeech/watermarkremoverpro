import { describe, expect, it } from 'vitest'
import {
  DEFAULT_MODEL_CHOICE,
  MODEL_CHOICES,
  configuredModelChoice,
  decideRewriteEngine,
  isModelChoice,
} from './engine-choice'

const CACHE = '/home/someone/.cache/watermarkremoverpro/models'

describe('choosing a rewrite engine', () => {
  it('defaults to auto', () => {
    expect(DEFAULT_MODEL_CHOICE).toBe('auto')
  })

  it('uses the local model when its weights are already here, without being asked', () => {
    // The behaviour this module exists for. Before it, a machine that had
    // already downloaded the model kept getting the weaker engine unless the
    // caller remembered to name the better one.
    const choice = decideRewriteEngine({ requested: 'auto', modelCached: true, cacheDir: CACHE })
    expect(choice.engine).toBe('advanced')
    expect(choice.reason).toContain(CACHE)
  })

  it('uses the deterministic engine when the weights are not here, and says how to get them', () => {
    const choice = decideRewriteEngine({ requested: 'auto', modelCached: false, cacheDir: CACHE })
    expect(choice.engine).toBe('standard')
    expect(choice.reason).toContain(CACHE)
    expect(choice.reason).toContain('advanced')
  })

  it('honours an explicit request either way', () => {
    expect(decideRewriteEngine({ requested: 'standard', modelCached: true, cacheDir: CACHE }).engine).toBe(
      'standard',
    )
    expect(decideRewriteEngine({ requested: 'advanced', modelCached: false, cacheDir: CACHE }).engine).toBe(
      'advanced',
    )
  })

  it('warns that an explicit advanced request on a cold cache will download', () => {
    const choice = decideRewriteEngine({ requested: 'advanced', modelCached: false, cacheDir: CACHE })
    expect(choice.reason).toMatch(/download/i)
  })

  it('always explains itself', () => {
    // Every decision is reported. A caller can never be left wondering which
    // engine produced a result.
    for (const requested of MODEL_CHOICES) {
      for (const modelCached of [true, false]) {
        const choice = decideRewriteEngine({ requested, modelCached, cacheDir: CACHE })
        expect(choice.reason.length, `${requested}/${modelCached}`).toBeGreaterThan(20)
        expect(choice.requested).toBe(requested)
      }
    }
  })
})

describe('configuredModelChoice', () => {
  it('falls back to the default when nothing is configured', () => {
    expect(configuredModelChoice(undefined, 'X')).toBe('auto')
    expect(configuredModelChoice('  ', 'X')).toBe('auto')
  })

  it('accepts a valid value, case-insensitively', () => {
    expect(configuredModelChoice('ADVANCED', 'X')).toBe('advanced')
  })

  it('throws on a typo rather than silently running a different engine', () => {
    expect(() => configuredModelChoice('advnced', 'WATERMARKREMOVERPRO_REWRITE_MODEL')).toThrow(
      /WATERMARKREMOVERPRO_REWRITE_MODEL is "advnced"/,
    )
  })

  it('recognises exactly the three choices', () => {
    expect(MODEL_CHOICES).toEqual(['auto', 'standard', 'advanced'])
    expect(isModelChoice('auto')).toBe(true)
    expect(isModelChoice('turbo')).toBe(false)
    expect(isModelChoice(7)).toBe(false)
  })
})
