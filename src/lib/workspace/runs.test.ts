import { describe, expect, it } from 'vitest'
import type { RewriteResult } from '@/lib/rewrite'
import { newRun, pruneRuns, runTitle, summariseRun, trimResultForStorage, type RunRecord } from './runs'

const SETTINGS = { language: '', strength: 'balanced', engineId: 'standard' } as const

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
      { index: 0, chosen: 'x' },
      { index: 1, chosen: null },
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
      processingTimeMs: 120,
    })
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
