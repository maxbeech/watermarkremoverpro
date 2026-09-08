import { afterEach, describe, expect, it, vi } from 'vitest'
import { forgetIdentity, identityLabel, readIdentity } from './identity'

/**
 * A localStorage stand-in, so the identity can be exercised without a DOM.
 * `throws` reproduces the private-window case, where reading storage does not
 * return null but raises.
 */
function fakeWindow({ throws = false }: { throws?: boolean } = {}) {
  const store = new Map<string, string>()
  const storage = {
    getItem: (key: string) => {
      if (throws) throw new Error('storage is blocked')
      return store.get(key) ?? null
    },
    setItem: (key: string, value: string) => {
      if (throws) throw new Error('storage is blocked')
      store.set(key, value)
    },
    removeItem: (key: string) => {
      if (throws) throw new Error('storage is blocked')
      store.delete(key)
    },
  }
  vi.stubGlobal('window', { localStorage: storage })
  return store
}

afterEach(() => vi.unstubAllGlobals())

describe('readIdentity', () => {
  it('returns null where there is no window at all, rather than throwing', () => {
    expect(readIdentity()).toBeNull()
  })

  it('mints an identity on first use and reuses it afterwards', () => {
    fakeWindow()
    const first = readIdentity()
    expect(first?.id).toMatch(/^anon_[0-9a-f]{12}$/)
    expect(readIdentity()?.id).toBe(first?.id)
  })

  it('replaces stored rubbish rather than handing it back', () => {
    const store = fakeWindow()
    store.set('wmrp.workspace.identity', '{"id":"not-anon"}')
    expect(readIdentity()?.id).toMatch(/^anon_/)
  })

  it('returns null when the browser refuses storage, so the workspace can say so', () => {
    fakeWindow({ throws: true })
    expect(readIdentity()).toBeNull()
  })

  it('forgetting is a no-op where storage refuses', () => {
    fakeWindow({ throws: true })
    expect(() => forgetIdentity()).not.toThrow()
  })

  it('forgetting means the next read mints a different identity', () => {
    fakeWindow()
    const first = readIdentity()!
    forgetIdentity()
    expect(readIdentity()?.id).not.toBe(first.id)
  })
})

describe('identityLabel', () => {
  it('says Guest when there is no identity to show', () => {
    expect(identityLabel(null)).toBe('Guest')
  })

  it('shows a short suffix rather than the whole id', () => {
    expect(identityLabel({ id: 'anon_0123456789ab', createdAt: '2026-09-08T00:00:00.000Z' })).toBe(
      'Guest 6789ab',
    )
  })
})
