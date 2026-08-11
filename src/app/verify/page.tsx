import type { Metadata } from 'next'
import Link from 'next/link'
import { VerifyDemo } from './verify-demo'
import { OPEN_REFERENCE_KEY } from '@/lib/detector/keys'

export const metadata: Metadata = {
  title: 'Verify the detector',
  description:
    'Mark a passage under the published reference key in your own browser and watch the MarkWitness detector find it — then watch the same text score at chance under a different key.',
  alternates: { canonical: '/verify' },
}

export default function VerifyPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 pt-12 pb-16">
      <h1 className="font-serif text-3xl text-ink-900">Verify the detector</h1>
      <p className="mt-4 text-lg leading-relaxed text-ink-600">
        You should not have to take our word for it. This page marks text under our published
        reference key, runs the detector on it, and shows you both numbers — in your browser, with
        the same code the real check uses.
      </p>

      <div className="mt-8">
        <VerifyDemo />
      </div>

      <section className="mt-12">
        <h2 className="font-serif text-2xl text-ink-900">Why the second panel is the important one</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
          A large z on marked text proves less than it appears to on its own — any function that
          returns a big number for text produced by a particular generator would pass that test. The
          control is the same text scored under a <em>different</em> key. If the detector were
          responding to something about how the text reads, it would light up there too. It does not,
          because the statistic is a property of the key-text pair and nothing else.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
          The same pair of assertions is a test in the repository, so it runs on every change rather
          than only when someone visits this page.
        </p>
      </section>

      <section className="mt-10 rounded-lg border border-ink-200 bg-white p-5">
        <h2 className="font-serif text-xl text-ink-900">About this reference key</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex flex-wrap gap-2">
            <dt className="w-28 shrink-0 text-ink-500">Identifier</dt>
            <dd className="figure text-ink-800">{OPEN_REFERENCE_KEY.id}</dd>
          </div>
          <div className="flex flex-wrap gap-2">
            <dt className="w-28 shrink-0 text-ink-500">Green fraction</dt>
            <dd className="figure text-ink-800">{OPEN_REFERENCE_KEY.gamma}</dd>
          </div>
          <div className="flex flex-wrap gap-2">
            <dt className="w-28 shrink-0 text-ink-500">Provenance</dt>
            <dd className="text-ink-800">{OPEN_REFERENCE_KEY.provenance}</dd>
          </div>
        </dl>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-600">
          This key is public on purpose — it exists to make the method auditable, not to detect any
          real model’s output. It detects text marked under this published scheme and nothing else.
          What it demonstrates is that the machinery works, so that when a vendor or institution key
          is configured you know what it is doing.{' '}
          <Link href="/method" className="underline underline-offset-2 hover:text-ink-900">
            The method page
          </Link>{' '}
          explains why no vendor key is public.
        </p>
      </section>
    </article>
  )
}
