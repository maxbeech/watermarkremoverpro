import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthForm } from '@/components/auth-form'
import { PLANS } from '@/lib/site'
import { BandRule } from '@/components/brand/band'

export const metadata: Metadata = {
  title: 'Create an account',
  description: 'A free MarkWitness account raises the per-document limit, unlocks every supported language, and saves your check history.',
  alternates: { canonical: '/signup' },
}

export default function SignupPage() {
  return (
    <section className="paper mx-auto max-w-md px-5 py-16">
      <h1 className="t-title text-ink-900">Create an account</h1>
      <BandRule at={52} className="mt-5 max-w-[6rem]" />
      <p className="mt-5 text-sm leading-relaxed text-ink-600">
        Free: {PLANS.free.wordCap.toLocaleString()} words per document, {PLANS.free.checksPerMonth} checks
        a month, every supported language, and saved history you can return to.
      </p>
      <div className="mt-7 rounded-[4px] border border-ink-200 bg-white p-6 shadow-[var(--shadow-raised)]">
        <AuthForm mode="signup" />
      </div>
      <p className="mt-6 text-sm text-ink-500">
        Already have one? <Link href="/login" className="link-quiet">Sign in</Link>
      </p>
      <p className="mt-6 text-xs leading-relaxed text-ink-400">
        You do not need an account to run a check. The no-signup check at /check runs in your browser
        and stores nothing. An account exists to raise limits and keep history, not to gate the tool.
      </p>
    </section>
  )
}
