import { describe, expect, it } from 'vitest'
import type { RewriteResult } from '@/lib/rewrite'
import {
  appendVersion,
  describeVersionAge,
  MAX_VERSIONS,
  newRun,
  pruneRuns,
  runTitle,
  summariseRun,
  trimResultForStorage,
  type RunRecord,
  type RunVersion,
} from './runs'

const SETTINGS = { language: '', strength: 'balanced', engineId: 'standard', excludedWords: [] as string[] } as const

describe('runTitle', () => {
  it('uses the first non-empty line', () => {
    expect(runTitle('\n\n  The committee met on Tuesday.\nAnd again.')).toBe(
      'The committee met on Tuesday.',
    )
  })

  it('collapses runs of whitespace', () => {
    expect(runTitle('Two   spaces\there')).toBe('Two spaces here')
  })

  it('truncates a long first line rather than wrapping the sidebar', () => {
    const title = runTitle('x'.repeat(200))
    expect(title).toHaveLength(58)
    expect(title.endsWith('…')).toBe(true)
  })

  it('says a draft is empty rather than rendering a blank row', () => {
    expect(runTitle('   \n  \n')).toBe('Empty draft')
  })
})

describe('newRun', () => {
  it('starts pending, with the draft kept verbatim', () => {
    const record = newRun('  Some draft.  ', SETTINGS)
    expect(record.status).toBe('pending')
    expect(record.originalText).toBe('  Some draft.  ')
    expect(record.revisedText).toBe('')
    expect(record.revision).toBe(0)
    expect(record.id.startsWith('run_')).toBe(true)
  })
})

describe('trimResultForStorage', () => {
  it('drops the scored candidates and keeps everything that is rendered', () => {
    const result = {
      passages: [
        {
          index: 0,
          original: 'a',
          chosen: 'b',
          candidates: [{ text: 'b', semanticScore: 1, factLockPassed: true, evidenceZ: null, tellPressure: 0, paretoScore: 1 }],
          beforeZ: 1,
          afterZ: 0.5,
          beforeStyleDeviation: null,
          reason: 'llm-rewrite',
        },
      ],
      revisedText: 'b',
    } as unknown as RewriteResult

    const trimmed = trimResultForStorage(result)
    expect(trimmed.passages[0].candidates).toEqual([])
    expect(trimmed.passages[0].chosen).toBe('b')
    expect(trimmed.revisedText).toBe('b')
    // The input is not mutated: the live view still shows the candidates.
    expect(result.passages[0].candidates).toHaveLength(1)
  })
})

describe('summariseRun', () => {
  const base = {
    passages: [
      { index: 0, original: 'a', chosen: 'x' },
      { index: 1, original: 'b', chosen: null },
    ],
    tellChangeCount: 4,
    processingTimeMs: 120,
    documentBefore: {
      passages: [{}, {}, {}],
      aiLikelihood: { score: 71, band: 'elevated' },
      watermark: { results: [{ z: 3.1 }], anyDetected: true },
      passageCorrection: { survived: 2 },
    },
    documentAfter: {
      passages: [{}, {}, {}],
      aiLikelihood: { score: 24, band: 'low' },
      watermark: { results: [{ z: 0.4 }], anyDetected: false },
      passageCorrection: { survived: 0 },
    },
  } as unknown as RewriteResult

  it('reads the headline figures off the result', () => {
    expect(summariseRun(base)).toEqual({
      passagesRewritten: 1,
      passagesInDocument: 3,
      tellSwaps: 4,
      likelihoodBefore: 71,
      likelihoodAfter: 24,
      band: 'low',
      watermarkBefore: 3.1,
      watermarkAfter: 0.4,
      survivedBefore: 2,
      survivedAfter: 0,
      markDetected: false,
      markDetectedBefore: true,
      processingTimeMs: 120,
      // The fixture above has no lexicalShiftPercent (it predates the field,
      // same as a real run stored before this change), so this exercises the
      // `?? 0` fallback rather than a real measurement.
      lexicalShift: 0,
    })
  })

  it('does not count a passage whose winning candidate was the passage itself', () => {
    // pickBest can return the original text as the best candidate. Counting
    // that as a rewrite produced "1 of 3 passages rewritten" next to a diff
    // that correctly showed nothing changed.
    const unchanged = {
      ...base,
      passages: [{ index: 0, original: 'a', chosen: 'a' }],
    } as unknown as RewriteResult
    expect(summariseRun(unchanged).passagesRewritten).toBe(0)
  })

  it('keeps a figure that could not be measured as null rather than zero', () => {
    const noAnalysis = { ...base, documentBefore: null, documentAfter: null } as RewriteResult
    const summary = summariseRun(noAnalysis)
    expect(summary.likelihoodBefore).toBeNull()
    expect(summary.likelihoodAfter).toBeNull()
    expect(summary.watermarkAfter).toBeNull()
    expect(summary.survivedAfter).toBeNull()
    expect(summary.passagesInDocument).toBeNull()
  })
})

describe('appendVersion', () => {
  it('starts a history from nothing', () => {
    const versions = appendVersion([], 'first draft', 'rewrite', 24)
    expect(versions).toHaveLength(1)
    expect(versions[0]).toMatchObject({ text: 'first draft', source: 'rewrite', likelihood: 24 })
    expect(versions[0].id).toBeTruthy()
    expect(versions[0].createdAt).toBeTruthy()
  })

  it('appends distinct text, oldest first', () => {
    let versions = appendVersion([], 'v1', 'rewrite', 50)
    versions = appendVersion(versions, 'v2', 'edit', 40)
    versions = appendVersion(versions, 'v3', 'paragraph', null)
    expect(versions.map((v) => v.text)).toEqual(['v1', 'v2', 'v3'])
    expect(versions.map((v) => v.source)).toEqual(['rewrite', 'edit', 'paragraph'])
  })

  it('does not record a version identical to the current one', () => {
    let versions = appendVersion([], 'same text', 'rewrite', 50)
    versions = appendVersion(versions, 'same text', 'rerun', 50)
    expect(versions).toHaveLength(1)
  })

  it('does record a change back to earlier text as its own new version (a restore is not a no-op)', () => {
    let versions = appendVersion([], 'v1', 'rewrite', 50)
    versions = appendVersion(versions, 'v2', 'edit', 40)
    versions = appendVersion(versions, 'v1', 'restore', 50)
    expect(versions.map((v) => v.text)).toEqual(['v1', 'v2', 'v1'])
    expect(versions[2].source).toBe('restore')
  })

  it('keeps a null likelihood as null rather than reusing the previous score', () => {
    const versions = appendVersion([{ id: 'a', text: 'v1', source: 'rewrite', likelihood: 60, createdAt: 't' }], 'v2', 'edit', null)
    expect(versions[1].likelihood).toBeNull()
  })

  it('caps history at MAX_VERSIONS, dropping the oldest first', () => {
    let versions: RunVersion[] = []
    for (let i = 0; i < MAX_VERSIONS + 5; i++) {
      versions = appendVersion(versions, `v${i}`, 'edit', i)
    }
    expect(versions).toHaveLength(MAX_VERSIONS)
    expect(versions[0].text).toBe(`v${5}`)
    expect(versions[versions.length - 1].text).toBe(`v${MAX_VERSIONS + 4}`)
  })
})

describe('describeVersionAge', () => {
  const now = new Date('2026-09-10T12:00:00.000Z')

  it('says "just now" for anything under 30 seconds', () => {
    expect(describeVersionAge('2026-09-10T11:59:45.000Z', now)).toBe('just now')
  })

  it('reports whole minutes', () => {
    expect(describeVersionAge('2026-09-10T11:55:00.000Z', now)).toBe('5 minutes ago')
    expect(describeVersionAge('2026-09-10T11:59:00.000Z', now)).toBe('1 minute ago')
  })

  it('reports whole hours once past 60 minutes', () => {
    expect(describeVersionAge('2026-09-10T09:00:00.000Z', now)).toBe('3 hours ago')
    expect(describeVersionAge('2026-09-10T11:00:00.000Z', now)).toBe('1 hour ago')
  })

  it('reports whole days once past 24 hours', () => {
    expect(describeVersionAge('2026-09-08T12:00:00.000Z', now)).toBe('2 days ago')
  })
})

describe('pruneRuns', () => {
  const record = (id: string, updatedAt: string): RunRecord =>
    ({ ...newRun('draft', SETTINGS), id, updatedAt }) as RunRecord

  it('keeps the newest and drops the overflow', () => {
    const records = [
      record('a', '2026-09-01T00:00:00.000Z'),
      record('b', '2026-09-03T00:00:00.000Z'),
      record('c', '2026-09-02T00:00:00.000Z'),
    ]
    const { keep, drop } = pruneRuns(records, 2)
    expect(keep.map((r) => r.id)).toEqual(['b', 'c'])
    expect(drop.map((r) => r.id)).toEqual(['a'])
  })

  it('drops nothing when under the cap', () => {
    expect(pruneRuns([record('a', '2026-09-01T00:00:00.000Z')], 25).drop).toEqual([])
  })
})
