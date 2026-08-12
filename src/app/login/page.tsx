import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthForm } from '@/components/auth-form'
import { BandRule } from '@/components/brand/band'

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your MarkWitness account for saved check history, higher limits and API keys.',
  alternates: { canonical: '/login' },
}

export default function LoginPage() {
  return (
    <section className="paper mx-auto max-w-md px-5 py-16">
      <h1 className="t-title text-ink-900">Sign in</h1>
      <BandRule at={52} className="mt-5 max-w-[6rem]" />
      <div className="mt-7 rounded-[4px] border border-ink-200 bg-white p-6 shadow-[var(--shadow-raised)]">
        <AuthForm mode="signin" />
      </div>
      <p className="mt-6 text-sm text-ink-500">
        No account? <Link href="/signup" className="link-quiet">Create one</Link>
      </p>
      <p className="mt-2 text-sm text-ink-500">
        <Link href="/forgot-password" className="link-quiet">Forgot your password?</Link>
      </p>
    </section>
  )
}
