import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthForm } from '@/components/auth-form'
import { AuthShell } from '@/components/auth-shell'
import { PLANS } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Create an account',
  description: 'A free WatermarkRemoverPro account raises the per-document limit, unlocks every supported language, and saves your check history.',
  alternates: { canonical: '/signup' },
}

export default function SignupPage() {
  return (
    <AuthShell
      title="Create an account"
      lead={`Free: ${PLANS.free.wordCap.toLocaleString()} words per document, ${PLANS.free.checksPerMonth} checks a month, every supported language, and saved history you can return to.`}
      footer={
        <>
          <p>
            Already have one?{' '}
            <Link href="/login" className="link-quiet">
              Sign in
            </Link>
          </p>
          <p className="text-xs leading-relaxed text-ink-500">
            You do not need an account to run a check. The no-signup check at /check runs in your
            browser and stores nothing. An account exists to raise limits and keep history, not to
            gate the tool.
          </p>
        </>
      }
    >
      <AuthForm mode="signup" />
    </AuthShell>
  )
}
