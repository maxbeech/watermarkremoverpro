'use client'

import { useState } from 'react'
import type { ApiKeyRecord } from '@/lib/api-keys'

/**
 * API key management.
 *
 * The full key is shown exactly once, at creation, and the UI says so before
 * the user clicks away. Only its SHA-256 is stored, so "show it again later" is
 * not a feature we are withholding. It is genuinely unrecoverable.
 */
export function ApiKeyManager({ initialKeys, pro }: { initialKeys: ApiKeyRecord[]; pro: boolean }) {
  const [keys, setKeys] = useState(initialKeys)
  const [issued, setIssued] = useState<string | null>(null)
  const [label, setLabel] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const create = async () => {
    setBusy(true)
    setError(null)
    const res = await fetch('/api/v1/keys', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ label: label || 'Untitled key' }),
    })
    const body = await res.json().catch(() => null)
    if (!res.ok) {
      setError(body?.message ?? `Could not create a key (${res.status}).`)
      setBusy(false)
      return
    }
    setIssued(body.secret)
    setKeys((prev) => [body.key, ...prev])
    setLabel('')
    setBusy(false)
  }

  const revoke = async (id: string) => {
    const res = await fetch(`/api/v1/keys?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    if (res.ok) {
      setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, revokedAt: new Date().toISOString() } : k)))
    } else {
      const body = await res.json().catch(() => null)
      setError(body?.message ?? 'Could not revoke that key.')
    }
  }

  return (
    <div className="rounded-[4px] border border-ink-200 bg-white shadow-[var(--shadow-panel)]">
      <header className="border-b border-ink-100 px-5 py-4">
        <h2 className="t-heading text-ink-900">API keys</h2>
        <p className="mt-1 text-sm text-ink-500">
          For the JSON API and the hosted MCP mode. {pro ? '' : 'Keys work on any plan; the API is metered and the free allowance applies.'}
        </p>
      </header>

      <div className="px-5 py-4">
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="What is this key for?"
            className="min-w-48 flex-1 rounded border border-ink-200 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={create}
            disabled={busy}
            className="rounded-[3px] bg-seal-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-seal-700 disabled:bg-ink-300"
          >
            {busy ? 'Creating…' : 'Create a key'}
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-signal-700">{error}</p>}

        {issued && (
          <div className="mt-4 rounded border border-signal-500 bg-signal-100 p-3">
            <p className="text-sm font-medium text-signal-700">
              Copy this now. It is not stored and cannot be shown again.
            </p>
            <p className="figure mt-2 break-all rounded bg-white px-3 py-2 text-sm text-ink-900">{issued}</p>
          </div>
        )}

        {keys.length > 0 && (
          <ul className="mt-4 divide-y divide-ink-100 border-t border-ink-100">
            {keys.map((key) => (
              <li key={key.id} className="flex flex-wrap items-baseline justify-between gap-3 py-3 text-sm">
                <span>
                  <span className="text-ink-800">{key.label}</span>{' '}
                  <span className="figure text-ink-400">{key.keyPrefix}…</span>
                </span>
                {key.revokedAt ? (
                  <span className="text-xs text-ink-400">revoked</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => revoke(key.id)}
                    className="text-xs text-ink-500 underline underline-offset-2 hover:text-signal-700"
                  >
                    Revoke
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
