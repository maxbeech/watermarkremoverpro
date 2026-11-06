import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AnalysisResult, AnalysisStatus } from './detector'
import { recordCompletedCheck } from './analytics-check'
import { track } from './openhelm-analytics'
vi.mock('./openhelm-analytics', () => ({ track: vi.fn() }))
afterEach(() => vi.clearAllMocks())
const result = (status: AnalysisStatus) => ({ status, watermark: { anyDetected: false } } as Pick<AnalysisResult, 'status' | 'watermark'>)
describe('successful check value', () => {
  it.each(['empty_document', 'unsupported_language', 'language_undetermined'] as const)('retains %s diagnostics without claiming delivered analysis', status => {
    expect(recordCompletedCheck(result(status), 'auto')).toBe(false)
    expect(track).toHaveBeenCalledWith('check_completed', { language: 'auto', status, mark_detected: false })
    expect(track).not.toHaveBeenCalledWith('check_succeeded', expect.anything())
  })
  it('records a completed useful analysis with metadata only', () => {
    expect(recordCompletedCheck(result('ok'), 'en')).toBe(true)
    expect(track).toHaveBeenCalledWith('check_succeeded', { language: 'en', status: 'ok', mark_detected: false })
    expect(vi.mocked(track).mock.calls).toHaveLength(2)
  })
})
