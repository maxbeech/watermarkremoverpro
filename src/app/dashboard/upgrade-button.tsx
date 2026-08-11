'use client'

import { useState } from 'react'

export function UpgradeButton({ billingLive }: { billingLive: boolean }) {
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!billingLive) {
    return (
      <span className="text-sm text-ink-400">
        Pro is not purchasable on this deployment, because no payment processor is configured.
      </span>
    )
  }

  const start = async () => {
    setBusy(true)
    setError(null)
    const res = await fetch('/api/billing/checkout', { method: 'POST' })
    const body = await res.json().catch(() => null)
    if (!res.ok || !body?.url) {
      setError(body?.message ?? `Checkout could not be started (${res.status}).`)
      setBusy(false)
      return
    }
    window.location.href = body.url
  }

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={start}
        disabled={busy}
        className="rounded bg-ink-900 px-4 py-2 text-sm font-medium text-ink-50 disabled:bg-ink-300"
      >
        {busy ? 'Starting…' : 'Upgrade to Pro'}
      </button>
      {error && <p className="mt-2 text-xs text-signal-700">{error}</p>}
    </div>
  )
}
