import type { Metadata } from 'next'
import { ResetPasswordForm } from '@/components/reset-password-forms'
import { AuthShell } from '@/components/auth-shell'

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
    <AuthShell title="Set a new password">
      <ResetPasswordForm token={token ?? null} />
    </AuthShell>
  )
}
