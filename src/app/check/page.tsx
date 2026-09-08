import type { Metadata } from 'next'
import Link from 'next/link'
import { Checker } from '@/components/checker/checker'
import { JsonLd, faqPageLd } from '@/components/json-ld'
import { CORE_FAQ, Faq } from '@/components/faq'
import { ButtonLink, Eyebrow, PageHeader, Section, Wrap } from '@/components/brand/ui'
import { PLANS, SITE } from '@/lib/site'

export const metadata: Metadata = {
  title: 'AI Watermark Checker: check your writing for an AI provenance mark',
  description:
    'Paste your own writing and get a calibrated confidence band, a per-passage breakdown and the stated limits. Free, no account, and the document never leaves your browser.',
  alternates: { canonical: '/check' },
}

/**
 * The check on its own.
 *
 * Kept as a dedicated page because "AI watermark checker" and its neighbours
 * are a distinct search intent from "rewrite my text", and a page that answers
 * exactly that question ranks and reads better than a homepage that does two
 * things. It shares every component with the homepage flow (the same input
 * surface, the same engine, the same result view), so the two cannot drift.
 */
export default function CheckPage() {
  return (
    <>
      <JsonLd data={faqPageLd(CORE_FAQ)} />
      <PageHeader
        eyebrow="Free · no account · nothing uploaded"
        title="Check your writing for an AI provenance mark"
        lead={`Up to ${PLANS.anonymous.wordCap.toLocaleString()} words without an account. The engine downloads to your browser and your text is measured there, so there is nothing for us to store, log or hand to anyone.`}
      />

      <Section tight>
        <Wrap>
          <Checker />
        </Wrap>
      </Section>

      {/* The cross-link that makes this page part of the product rather than a
          dead end: most people who check are here because someone questioned
          their writing, and the next thing they want is to do something about
          it. */}
      <Section surface="deep" tight>
        <Wrap>
          <div className="rounded-[var(--radius-hero)] border border-ink-200 bg-white p-8">
            <Eyebrow>After the check</Eyebrow>
            <h2 className="t-title mt-4 text-ink-900">
              Want the evidence reduced as well as measured?
            </h2>
            <p className="t-lead mt-4 text-ink-600">
              The main {SITE.name} flow rewrites the passages that carry detectable AI-style
              evidence and then runs this exact check on the result, so you see the text and the
              measurement together. Same engine, same on-device guarantee, one step.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/">Clean up my text</ButtonLink>
              <Link href="/method" className="link-quiet self-center text-sm font-medium text-ink-700">
                How the measurement works
              </Link>
            </div>
          </div>
        </Wrap>
      </Section>

      <Faq items={CORE_FAQ} title="Before you read too much into a result" />
    </>
  )
}
