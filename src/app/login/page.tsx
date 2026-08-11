import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthForm } from '@/components/auth-form'

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your MarkWitness account for saved check history, higher limits and API keys.',
  alternates: { canonical: '/login' },
}

export default function LoginPage() {
  return (
    <section className="mx-auto max-w-md px-5 py-14">
      <h1 className="font-serif text-2xl text-ink-900">Sign in</h1>
      <div className="mt-6"><AuthForm mode="signin" /></div>
      <p className="mt-6 text-sm text-ink-500">
        No account? <Link href="/signup" className="underline underline-offset-2 hover:text-ink-900">Create one</Link>
      </p>
    </section>
  )
}
