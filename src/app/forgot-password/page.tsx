import type { Metadata } from 'next'
import Link from 'next/link'
import { ForgotPasswordForm } from '@/components/reset-password-forms'
import { AuthShell } from '@/components/auth-shell'

export const metadata: Metadata = {
  title: 'Reset your password',
  description: 'Request a password reset link for your WatermarkRemoverPro account.',
  alternates: { canonical: '/forgot-password' },
}

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      footer={
        <p>
          <Link href="/login" className="link-quiet">
            Back to sign in
          </Link>
        </p>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  )
}
