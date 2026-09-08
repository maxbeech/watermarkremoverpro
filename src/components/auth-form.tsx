'use client'

import { useState } from 'react'
import { createAuthClient } from 'better-auth/react'
import { buttonClass } from '@/components/brand/ui'

const client = createAuthClient()

/**
 * Sign in / sign up.
 *
 * Errors are shown as the server described them. "Something went wrong" on an
 * auth form is how people end up locked out with no idea whether they typed the
 * wrong password or the service is down.
 */
export function AuthForm({ mode }: { mode: 'signin' | 'signup' }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)

    const result =
      mode === 'signup'
        ? await client.signUp.email({ email, password, name: name || email.split('@')[0] })
        : await client.signIn.email({ email, password })

    if (result.error) {
      setError(result.error.message ?? `Sign ${mode === 'signup' ? 'up' : 'in'} failed.`)
      setBusy(false)
      return
    }
    window.location.href = '/dashboard'
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {mode === 'signup' && (
        <Field label="Name (optional)">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            className={INPUT}
          />
        </Field>
      )}

      <Field label="Email">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          className={INPUT}
        />
      </Field>

      <Field label="Password" hint={mode === 'signup' ? 'At least 10 characters.' : undefined}>
        <input
          type="password"
          required
          minLength={mode === 'signup' ? 10 : undefined}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          className={INPUT}
        />
      </Field>

      {error && (
        <p className="rounded-[var(--radius-control)] border border-signal-400 bg-signal-100 px-3.5 py-2.5 text-sm text-signal-700">
          {error}
        </p>
      )}

      <button type="submit" disabled={busy} className={buttonClass('primary', 'w-full')}>
        {busy ? 'Working…' : mode === 'signup' ? 'Create account' : 'Sign in'}
      </button>
    </form>
  )
}

const INPUT =
  'w-full rounded-[var(--radius-control)] border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-800 ' +
  'transition-colors duration-150 hover:border-ink-300 focus:border-seal-400'

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="t-eyebrow text-ink-500">{label}</span>
      {hint && <span className="ml-2 text-xs text-ink-400">{hint}</span>}
      <div className="mt-2">{children}</div>
    </label>
  )
}

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={async () => {
        await client.signOut()
        window.location.href = '/'
      }}
      className="link-quiet text-sm text-ink-500"
    >
      Sign out
    </button>
  )
}
