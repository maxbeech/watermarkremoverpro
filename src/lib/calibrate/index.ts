/**
 * MarkWitness Calibration Engine
 *
 * A local-first, deterministic text normalization utility that helps writers
 * understand which word-frequency patterns trigger statistical AI detection.
 *
 * The lighter, deterministic layer behind the fuller on-device rewrite engine
 * (../rewrite), which also targets the passages a real check flags and scores
 * candidates against the detector's own arithmetic. This module suggests
 * substitutions with before/after metrics; it does not itself score or target.
 *
 * All processing is local: no text ever leaves the device.
 */

export * from './types'
export { calibrateText } from './engine'
export { analyzeFrequency, calculateTTR, calculateAverageFrequency, calculateLexicalDiversity } from './frequency'
export { loadDictionary, getDictionaryStats, clearDictionaryCache } from './dictionary'
export { performSubstitution, applySubstitutions, preserveCase, countActualSubstitutions, getAppliedSubstitutions } from './substituter'
export { calculateMetrics, calculateMetricsShift, calculateLexicalChangePercent, formatMetrics } from './scoring'
export { getTodayUsage, recordUsage, resetDailyUsage, getPreference, setPreference, getPreferences, saveToHistory, getRecentHistory, clearStorage, closeDatabase, getStorageStats, type UsageRecord, type HistoryEntry } from './storage'
export { checkDailyBudget, recordCalibration, getDailyUsage, getDailyLimit, getNextResetTime, getSecondsTilReset, getBudgetPercentage, formatBudgetStatus } from './metering'
