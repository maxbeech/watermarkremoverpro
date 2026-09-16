/**
 * The workspace history, in this browser and nowhere else.
 *
 * One IndexedDB store of run records, keyed by id and indexed by update time.
 * There is no server copy, no sync and no export path that leaves the machine:
 * the product's promise is that a document is never transmitted, and a history
 * feature that quietly posted drafts to an account would break it more
 * comprehensively than anything else in the app.
 *
 * Every function resolves rather than rejecting when storage is unavailable
 * (private windows can refuse IndexedDB outright). The workspace stays usable
 * without a history and says that is what happened, instead of failing the
 * rewrite the visitor actually asked for.
 */

import { pruneRuns, type RunRecord } from './runs'

/**
 * A record already sitting in a visitor's IndexedDB predates whatever field
 * this build added most recently: `versions` did not exist before it, so a
 * run saved by an earlier build and read back by this one is missing it
 * entirely, not merely empty. Every record leaving this file goes through
 * here so the rest of the app can keep treating `RunRecord` as fully formed
 * rather than re-deriving "was this saved by an old build" at every call site.
 */
export function normalize(record: RunRecord): RunRecord {
  return record.versions ? record : { ...record, versions: [] }
}

const DB_NAME = 'wmrp_workspace'
const DB_VERSION = 1
const STORE = 'runs'

let connection: Promise<IDBDatabase | null> | null = null

function open(): Promise<IDBDatabase | null> {
  if (connection) return connection

  connection = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null)
      return
    }
    let request: IDBOpenDBRequest
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION)
    } catch {
      resolve(null)
      return
    }
    request.onerror = () => resolve(null)
    request.onblocked = () => resolve(null)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('updatedAt', 'updatedAt', { unique: false })
      }
    }
  })

  return connection
}

function run<T>(
  mode: IDBTransactionMode,
  body: (store: IDBObjectStore, resolve: (value: T) => void) => void,
  fallback: T,
): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve) => {
        if (!db) {
          resolve(fallback)
          return
        }
        try {
          const tx = db.transaction([STORE], mode)
          tx.onerror = () => resolve(fallback)
          tx.onabort = () => resolve(fallback)
          body(tx.objectStore(STORE), resolve)
        } catch {
          resolve(fallback)
        }
      }),
  )
}

/** True when this browser can actually keep a history. */
export async function historyAvailable(): Promise<boolean> {
  return (await open()) !== null
}

/** Write a run, then drop anything past the cap. Returns the record as stored. */
export async function saveRun(record: RunRecord): Promise<RunRecord> {
  const stored = { ...record, updatedAt: new Date().toISOString() }
  await run<void>(
    'readwrite',
    (store, resolve) => {
      const request = store.put(stored)
      request.onsuccess = () => resolve(undefined)
      request.onerror = () => resolve(undefined)
    },
    undefined,
  )

  const all = await listRuns()
  const { drop } = pruneRuns(all)
  for (const old of drop) await deleteRun(old.id)

  return stored
}

export async function loadRun(id: string): Promise<RunRecord | null> {
  const record = await run<RunRecord | null>(
    'readonly',
    (store, resolve) => {
      const request = store.get(id)
      request.onsuccess = () => resolve((request.result as RunRecord | undefined) ?? null)
      request.onerror = () => resolve(null)
    },
    null,
  )
  return record ? normalize(record) : null
}

/** Newest first. */
export async function listRuns(): Promise<RunRecord[]> {
  const records = await run<RunRecord[]>(
    'readonly',
    (store, resolve) => {
      const request = store.getAll()
      request.onsuccess = () => resolve((request.result as RunRecord[]) ?? [])
      request.onerror = () => resolve([])
    },
    [],
  )
  return records.map(normalize).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function deleteRun(id: string): Promise<void> {
  await run<void>(
    'readwrite',
    (store, resolve) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve(undefined)
      request.onerror = () => resolve(undefined)
    },
    undefined,
  )
}

export async function clearRuns(): Promise<void> {
  await run<void>(
    'readwrite',
    (store, resolve) => {
      const request = store.clear()
      request.onsuccess = () => resolve(undefined)
      request.onerror = () => resolve(undefined)
    },
    undefined,
  )
}
