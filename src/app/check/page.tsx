import type { Metadata } from 'next'
import { Checker } from '@/components/checker/checker'
import { JsonLd, faqPageLd } from '@/components/json-ld'
import { CORE_FAQ, Faq } from '@/components/faq'
import { PageHeader, Section, Wrap } from '@/components/brand/ui'
import { PLANS } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Check your writing for an AI provenance mark',
  description:
    'Paste your own writing and get a calibrated confidence band, a per-passage breakdown and the stated limits. Runs in your browser, and the document is never uploaded.',
  alternates: { canonical: '/check' },
}

export default function CheckPage() {
  return (
    <>
      <JsonLd data={faqPageLd(CORE_FAQ)} />
      <PageHeader
        eyebrow="Free, no account, nothing uploaded"
        title="Check a document"
        lead={`Up to ${PLANS.anonymous.wordCap.toLocaleString()} words without an account. The analysis runs on your device: the engine is downloaded to your browser and your text is measured there, so there is nothing for us to store, log or hand to anyone.`}
      />

      <Section tight>
        <Wrap>
          <Checker />
        </Wrap>
      </Section>

      <Faq items={CORE_FAQ} title="Before you read too much into a result" />
    </>
  )
}
