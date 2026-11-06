import type { AnalysisResult } from './detector'
import { EVENTS } from './analytics-events'
import { track } from './openhelm-analytics'

/** Completion diagnostics include refusals; delivered value requires an actual analysis. */
export function recordCompletedCheck(result: Pick<AnalysisResult, 'status' | 'watermark'>, language: string) {
  const params = { language, status: result.status, mark_detected: result.watermark.anyDetected }
  track(EVENTS.checkCompleted, params)
  if (result.status !== 'ok') return false
  track(EVENTS.checkSucceeded, params)
  return true
}
