import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthForm } from '@/components/auth-form'
import { AuthShell } from '@/components/auth-shell'

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your WatermarkRemoverPro account for saved check history, higher limits and API keys.',
  alternates: { canonical: '/login' },
}

export default function LoginPage() {
  return (
    <AuthShell
      title="Sign in"
      footer={
        <>
          <p>
            No account?{' '}
            <Link href="/signup" className="link-quiet">
              Create one
            </Link>
          </p>
          <p>
            <Link href="/forgot-password" className="link-quiet">
              Forgot your password?
            </Link>
          </p>
        </>
      }
    >
      <AuthForm mode="signin" />
    </AuthShell>
  )
}
