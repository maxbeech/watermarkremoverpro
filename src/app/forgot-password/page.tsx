import type { Metadata } from 'next'
import Link from 'next/link'
import { ForgotPasswordForm } from '@/components/reset-password-forms'
import { BandRule } from '@/components/brand/band'

export const metadata: Metadata = {
  title: 'Reset your password',
  description: 'Request a password reset link for your MarkWitness account.',
  alternates: { canonical: '/forgot-password' },
}

export default function ForgotPasswordPage() {
  return (
    <section className="paper mx-auto max-w-md px-5 py-16">
      <h1 className="t-title text-ink-900">Reset your password</h1>
      <BandRule at={52} className="mt-5 max-w-[6rem]" />
      <div className="mt-7 rounded-[4px] border border-ink-200 bg-white p-6 shadow-[var(--shadow-raised)]">
        <ForgotPasswordForm />
      </div>
      <p className="mt-6 text-sm text-ink-500">
        <Link href="/login" className="link-quiet">Back to sign in</Link>
      </p>
    </section>
  )
}
