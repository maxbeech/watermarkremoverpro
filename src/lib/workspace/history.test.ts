import { describe, expect, it } from 'vitest'
import { normalize } from './history'
import { newRun, type RunRecord } from './runs'

const SETTINGS = { language: '', strength: 'balanced', engineId: 'standard', excludedWords: [] as string[] } as const

describe('normalize', () => {
  it('leaves a fully-formed record untouched', () => {
    const record = newRun('draft', SETTINGS)
    expect(normalize(record)).toBe(record)
  })

  it('backfills versions on a record saved before that field existed', () => {
    const legacy = { ...newRun('draft', SETTINGS) } as RunRecord
    // @ts-expect-error simulating a record IndexedDB actually holds from before this field shipped
    delete legacy.versions
    const normalized = normalize(legacy)
    expect(normalized.versions).toEqual([])
    // Every other field survives untouched.
    expect(normalized.originalText).toBe('draft')
  })
})
