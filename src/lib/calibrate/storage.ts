/**
 * Storage layer for calibration engine.
 *
 * Manages local state using IndexedDB:
 * - Daily usage tracking (for freemium budget)
 * - User preferences (config, language, etc.)
 * - Calibration history (optional, for analytics)
 *
 * All data is local; nothing is sent to the server except through explicit API calls.
 */

import type { CalibrationConfig } from './types'

const DB_NAME = 'markwitness_calibrator'
const DB_VERSION = 1

// Store names
const STORES = {
  USAGE: 'usage',
  PREFERENCES: 'preferences',
  HISTORY: 'history',
} as const

// Preference keys
export type PreferenceKey =
  | 'confidenceThreshold'
  | 'maxRepeats'
  | 'targetDiversity'
  | 'lastLanguage'
  | 'autoDetectLanguage'

/**
 * Usage record for a single day.
 * Keyed by ISO date string (YYYY-MM-DD).
 */
export interface UsageRecord {
  date: string // ISO date string
  substitutions: number // Total substitutions performed
  tokens: number // Total tokens processed
  calibrations: number // Number of calibrations run
  lastReset?: string // ISO timestamp of last reset (if not midnight)
}

/**
 * Calibration history entry.
 */
export interface HistoryEntry {
  id: string // UUID
  date: string // ISO date string
  timestamp: string // ISO timestamp
  language: string
  originalTokens: number
  tokensChanged: number
  textHash: string // SHA-256 of original text
  metricsShift?: {
    typeTokenRatio: number
    averageFrequency: number
    lexicalDiversity: number
  }
  sessionId: string // Browser session ID
}

/**
 * Database client singleton.
 * Lazy-initializes the database on first access.
 */
let dbInstance: IDBDatabase | null = null
let dbInitPromise: Promise<IDBDatabase> | null = null

/**
 * Gets or initializes the database connection.
 */
async function getDatabase(): Promise<IDBDatabase> {
  if (dbInstance) {
    return dbInstance
  }

  if (dbInitPromise) {
    return dbInitPromise
  }

  dbInitPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new Error(`Failed to open database: ${request.error?.message}`))
    }

    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create usage store
      if (!db.objectStoreNames.contains(STORES.USAGE)) {
        db.createObjectStore(STORES.USAGE, { keyPath: 'date' })
      }

      // Create preferences store
      if (!db.objectStoreNames.contains(STORES.PREFERENCES)) {
        db.createObjectStore(STORES.PREFERENCES, { keyPath: 'key' })
      }

      // Create history store
      if (!db.objectStoreNames.contains(STORES.HISTORY)) {
        const histStore = db.createObjectStore(STORES.HISTORY, { keyPath: 'id' })
        histStore.createIndex('date', 'date', { unique: false })
        histStore.createIndex('timestamp', 'timestamp', { unique: false })
        histStore.createIndex('language', 'language', { unique: false })
      }
    }
  })

  return dbInitPromise
}

/**
 * Gets today's usage record, creating it if it doesn't exist.
 */
export async function getTodayUsage(): Promise<UsageRecord> {
  const db = await getDatabase()
  const today = new Date().toISOString().split('T')[0]

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.USAGE], 'readonly')
    const store = tx.objectStore(STORES.USAGE)
    const request = store.get(today)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      resolve(
        request.result || {
          date: today,
          substitutions: 0,
          tokens: 0,
          calibrations: 0,
        },
      )
    }
  })
}

/**
 * Records usage for today.
 * Increments tokens and substitutions counters.
 */
export async function recordUsage(tokens: number, substitutions: number): Promise<void> {
  const db = await getDatabase()
  const today = new Date().toISOString().split('T')[0]

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.USAGE], 'readwrite')
    const store = tx.objectStore(STORES.USAGE)

    // First, get the current record
    const getRequest = store.get(today)

    getRequest.onsuccess = () => {
      const current = getRequest.result || {
        date: today,
        substitutions: 0,
        tokens: 0,
        calibrations: 0,
      }

      // Update counts
      current.substitutions += substitutions
      current.tokens += tokens
      current.calibrations += 1

      const putRequest = store.put(current)
      putRequest.onerror = () => reject(putRequest.error)
      putRequest.onsuccess = () => resolve()
    }

    getRequest.onerror = () => reject(getRequest.error)
  })
}

/**
 * Resets today's usage (called at midnight or when switching days).
 */
export async function resetDailyUsage(): Promise<void> {
  const db = await getDatabase()
  const today = new Date().toISOString().split('T')[0]

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.USAGE], 'readwrite')
    const store = tx.objectStore(STORES.USAGE)
    const request = store.put({
      date: today,
      substitutions: 0,
      tokens: 0,
      calibrations: 0,
      lastReset: new Date().toISOString(),
    })

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

/**
 * Gets a preference value.
 */
export async function getPreference<T>(key: PreferenceKey): Promise<T | null> {
  const db = await getDatabase()

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.PREFERENCES], 'readonly')
    const store = tx.objectStore(STORES.PREFERENCES)
    const request = store.get(key)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const result = request.result
      resolve(result ? (result.value as T) : null)
    }
  })
}

/**
 * Sets a preference value.
 */
export async function setPreference<T>(key: PreferenceKey, value: T): Promise<void> {
  const db = await getDatabase()

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.PREFERENCES], 'readwrite')
    const store = tx.objectStore(STORES.PREFERENCES)
    const request = store.put({ key, value })

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

/**
 * Gets all preferences as a configuration object.
 */
export async function getPreferences(): Promise<Partial<CalibrationConfig & { lastLanguage?: string; autoDetectLanguage?: boolean }>> {
  const db = await getDatabase()

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.PREFERENCES], 'readonly')
    const store = tx.objectStore(STORES.PREFERENCES)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const prefs: Record<string, unknown> = {}
      for (const item of request.result) {
        prefs[item.key] = item.value
      }
      resolve(prefs)
    }
  })
}

/**
 * Saves a calibration to history (optional, for analytics).
 */
export async function saveToHistory(entry: Omit<HistoryEntry, 'id'>): Promise<void> {
  const db = await getDatabase()
  const id = crypto.randomUUID()

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.HISTORY], 'readwrite')
    const store = tx.objectStore(STORES.HISTORY)
    const request = store.put({ ...entry, id })

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

/**
 * Gets recent history entries.
 */
export async function getRecentHistory(limit: number = 50): Promise<HistoryEntry[]> {
  const db = await getDatabase()

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.HISTORY], 'readonly')
    const store = tx.objectStore(STORES.HISTORY)
    const index = store.index('timestamp')
    const request = index.openCursor(null, 'prev') // Reverse order (newest first)

    const results: HistoryEntry[] = []

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result
      if (cursor && results.length < limit) {
        results.push(cursor.value as HistoryEntry)
        cursor.continue()
      } else {
        resolve(results)
      }
    }

    request.onerror = () => reject(request.error)
  })
}

/**
 * Clears all storage (useful for testing or user reset).
 */
export async function clearStorage(): Promise<void> {
  const db = await getDatabase()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      [STORES.USAGE, STORES.PREFERENCES, STORES.HISTORY],
      'readwrite',
    )

    for (const storeName of Object.values(STORES)) {
      const request = tx.objectStore(storeName).clear()
      request.onerror = () => reject(request.error)
    }

    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/**
 * Closes the database connection.
 */
export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
    dbInitPromise = null
  }
}

/**
 * Gets database statistics for debugging.
 */
export async function getStorageStats(): Promise<{
  usageRecords: number
  preferences: number
  historyEntries: number
}> {
  const db = await getDatabase()

  const counts: Record<string, number> = {}

  for (const storeName of Object.values(STORES)) {
    const count = await new Promise<number>((resolve, reject) => {
      const tx = db.transaction([storeName], 'readonly')
      const store = tx.objectStore(storeName)
      const request = store.count()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })

    counts[storeName] = count
  }

  return {
    usageRecords: counts[STORES.USAGE] || 0,
    preferences: counts[STORES.PREFERENCES] || 0,
    historyEntries: counts[STORES.HISTORY] || 0,
  }
}
