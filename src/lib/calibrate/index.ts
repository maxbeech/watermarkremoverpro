/**
 * MarkWitness Calibration Engine
 *
 * A local-first, deterministic text normalization utility that helps writers
 * understand which word-frequency patterns trigger statistical AI detection.
 *
 * This engine is NOT a watermark removal tool. It's a companion to the detection
 * engine, helping users understand their writing's statistical profile and
 * suggesting natural rewrites that adjust word frequencies without altering voice.
 *
 * 100% local processing: no text ever leaves the device.
 */

export * from './types'
export { calibrateText } from './engine'
export { analyzeFrequency, calculateTTR, calculateAverageFrequency, calculateLexicalDiversity } from './frequency'
export { loadDictionary, getDictionaryStats, clearDictionaryCache } from './dictionary'
export { performSubstitution, applySubstitutions, preserveCase, countActualSubstitutions, getAppliedSubstitutions } from './substituter'
export { calculateMetrics, calculateMetricsShift, calculateLexicalChangePercent, formatMetrics } from './scoring'
export { getTodayUsage, recordUsage, resetDailyUsage, getPreference, setPreference, getPreferences, saveToHistory, getRecentHistory, clearStorage, closeDatabase, getStorageStats, type UsageRecord, type HistoryEntry } from './storage'
export { checkDailyBudget, recordCalibration, getDailyUsage, getDailyLimit, getNextResetTime, getSecondsTilReset, getBudgetPercentage, formatBudgetStatus } from './metering'
