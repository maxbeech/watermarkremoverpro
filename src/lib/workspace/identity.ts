/**
 * The anonymous workspace identity.
 *
 * The workspace needs something to hang a history off, and this product cannot
 * use an account for it: the whole promise is that the document never leaves
 * the device, so a server-side session keyed to a stored draft would be a
 * contradiction, not a feature. What exists instead is a local identity: an
 * opaque id minted in the browser on first use, kept in localStorage, never
 * transmitted, and shown in the sidebar so it is obvious that "your history"
 * means "this browser's history" and nothing more.
 *
 * Signing in later does not migrate it, and the UI says so rather than
 * implying a sync that is not happening.
 */

const STORAGE_KEY = 'wmrp.workspace.identity'

export interface AnonIdentity {
  id: string
  createdAt: string
}

/** Twelve hex characters is 48 bits: far more than enough to tell two tabs apart. */
function mintId(): string {
  const bytes = new Uint8Array(6)
  globalThis.crypto.getRandomValues(bytes)
  return `anon_${[...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')}`
}

function isIdentity(value: unknown): value is AnonIdentity {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as AnonIdentity).id === 'string' &&
    (value as AnonIdentity).id.startsWith('anon_') &&
    typeof (value as AnonIdentity).createdAt === 'string'
  )
}

/**
 * Read the identity for this browser, minting one on first use.
 *
 * Returns null rather than throwing when storage is unavailable (a private
 * window with storage blocked, or a server render). The workspace stays usable
 * in that case; it just cannot keep a history, and it says so.
 */
export function readIdentity(): AnonIdentity | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed: unknown = JSON.parse(stored)
      if (isIdentity(parsed)) return parsed
    }
    const fresh: AnonIdentity = { id: mintId(), createdAt: new Date().toISOString() }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh))
    return fresh
  } catch {
    return null
  }
}

/** Forget the local identity. Paired with clearing the history, never on its own. */
export function forgetIdentity(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to do: an identity that could not be written cannot be removed.
  }
}

/** The short form shown in the sidebar. */
export function identityLabel(identity: AnonIdentity | null): string {
  if (!identity) return 'Guest'
  return `Guest ${identity.id.slice(-6)}`
}
