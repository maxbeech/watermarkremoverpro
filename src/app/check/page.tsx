import type { Metadata } from 'next'
import { Checker } from '@/components/checker/checker'
import { JsonLd, faqPageLd } from '@/components/json-ld'
import { CORE_FAQ, Faq } from '@/components/faq'

export const metadata: Metadata = {
  title: 'Check your writing for an AI provenance mark',
  description:
    'Paste your own writing and get a calibrated confidence band, a per-passage breakdown and the stated limits. Runs in your browser — the document is never uploaded.',
  alternates: { canonical: '/check' },
}

export default function CheckPage() {
  return (
    <>
      <JsonLd data={faqPageLd(CORE_FAQ)} />
      <section className="mx-auto max-w-3xl px-5 pt-12 pb-6">
        <h1 className="font-serif text-3xl text-ink-900">Check a document</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
          Up to 1,500 words without an account. The analysis runs on your device: the engine is
          downloaded to your browser and your text is measured there, so there is nothing for us to
          store, log or hand to anyone.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-10">
        <Checker />
      </section>

      <Faq items={CORE_FAQ} title="Before you read too much into a result" />
    </>
  )
}
