'use client'

import { useState } from 'react'
import { createAuthClient } from 'better-auth/react'
import { buttonClass } from '@/components/brand/ui'

const client = createAuthClient()

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

function ErrorNotice({ message }: { message: string }) {
  return (
    <p className="rounded-[var(--radius-control)] border border-signal-400 bg-signal-100 px-3.5 py-2.5 text-sm text-signal-700">
      {message}
    </p>
  )
}

/** Requests a reset-password email for the given address. */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)

    const result = await client.requestPasswordReset({ email, redirectTo: '/reset-password' })

    setBusy(false)
    if (result.error) {
      setError(result.error.message ?? 'Could not send the reset email.')
      return
    }
    // The response looks the same whether or not the address has an account.
    // A form that says "no account with that email" lets anyone enumerate who
    // has signed up.
    setSent(true)
  }

  if (sent) {
    return (
      <p className="rounded-[var(--radius-control)] border border-ink-200 bg-ink-50 px-3.5 py-2.5 text-sm text-ink-700">
        If an account exists for that address, a reset link is on its way.
      </p>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
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

      {error && <ErrorNotice message={error} />}

      <button type="submit" disabled={busy} className={buttonClass('primary', 'w-full')}>
        {busy ? 'Sending…' : 'Send reset link'}
      </button>
    </form>
  )
}

/** Consumes a reset token from the emailed link and sets a new password. */
export function ResetPasswordForm({ token }: { token: string | null }) {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  if (!token) {
    return <ErrorNotice message="This reset link is missing its token. Request a new one." />
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)

    const result = await client.resetPassword({ newPassword: password, token })

    setBusy(false)
    if (result.error) {
      setError(result.error.message ?? 'Could not reset the password. The link may have expired.')
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <p className="rounded-[var(--radius-control)] border border-ink-200 bg-ink-50 px-3.5 py-2.5 text-sm text-ink-700">
        Password reset. <a href="/login" className="link-quiet">Sign in</a> with your new password.
      </p>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="New password" hint="At least 10 characters.">
        <input
          type="password"
          required
          minLength={10}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          className={INPUT}
        />
      </Field>

      {error && <ErrorNotice message={error} />}

      <button type="submit" disabled={busy} className={buttonClass('primary', 'w-full')}>
        {busy ? 'Working…' : 'Reset password'}
      </button>
    </form>
  )
}
