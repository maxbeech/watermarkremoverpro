import type { Metadata } from 'next'
import { ResetPasswordForm } from '@/components/reset-password-forms'
import { BandRule } from '@/components/brand/band'

export const metadata: Metadata = {
  title: 'Set a new password',
  description: 'Set a new password for your WatermarkRemoverPro account.',
  alternates: { canonical: '/reset-password' },
  robots: { index: false, follow: false },
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  return (
    <section className="paper mx-auto max-w-md px-5 py-16">
      <h1 className="t-title text-ink-900">Set a new password</h1>
      <BandRule at={52} className="mt-5 max-w-[6rem]" />
      <div className="mt-7 rounded-[4px] border border-ink-200 bg-white p-6 shadow-[var(--shadow-raised)]">
        <ResetPasswordForm token={token ?? null} />
      </div>
    </section>
  )
}
