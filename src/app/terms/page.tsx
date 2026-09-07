import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/brand/ui'
import { SITE, PLANS } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Terms of service',
  description:
    'The terms for using WatermarkRemoverPro: what the free and Pro plans include, what the service can and cannot promise about detection and rewriting, and how billing, cancellation and liability work.',
  alternates: { canonical: '/terms' },
}

const LAST_UPDATED = '7 September 2026'

export default function TermsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Terms of service"
        lead="By creating an account, subscribing to Pro, or using the API or MCP server, you agree to these terms. If you're just running a check or a rewrite in the browser without an account, most of this doesn't apply to you, but the limits in the section below still do."
      />
      <article className="mx-auto max-w-3xl px-5 py-12">
        <p className="text-sm text-ink-400">Last updated {LAST_UPDATED}.</p>

        <Section title="1. What the service is">
          <P>
            {SITE.name} is a tool for checking your own writing for a statistical AI provenance mark
            and, separately, for rewriting your own writing on-device to reduce detectable AI-style
            evidence. It is intended for use on text you wrote, or otherwise have the right to check
            and edit, not for screening writing that belongs to someone else. If you want to screen
            someone else&apos;s work, that&apos;s a different job: see{' '}
            <a href="https://learnaway.ai" target="_blank" rel="noreferrer">
              Learnaway
            </a>
            .
          </P>
        </Section>

        <Section title="2. Accounts">
          <P>
            You must provide an accurate email address and keep your password secure. You&apos;re
            responsible for activity on your account, including anything done with an API key issued
            under it. Tell us at {SITE.contactEmail} if you believe your account or an API key has
            been compromised, and revoke the key from your dashboard immediately.
          </P>
        </Section>

        <Section title="3. Plans and billing">
          <P>
            The free plan includes {PLANS.free.wordCap.toLocaleString()} words per document and{' '}
            {PLANS.free.checksPerMonth} checks a month, at no cost. The Pro plan is a £{PLANS.pro.price}{' '}
            per month subscription, billed in advance and processed by Stripe;
            current plan details are always shown on <Link href="/pricing">the pricing page</Link>,
            which is the source of truth if it ever differs from this paragraph.
          </P>
          <P>
            Pro renews automatically each month until you cancel. You can cancel any time from your
            dashboard or by emailing {SITE.contactEmail}; cancelling stops future renewal but does not
            refund the current billing period, and your plan stays at Pro until that period ends. We
            don&apos;t currently offer refunds for partial months, except where the law requires it.
          </P>
          <P>
            Rewriting (<code className="figure">reduce_ai_evidence</code> and{' '}
            <code className="figure">calibrate_text</code>) runs on-device and is unlimited on every
            plan, free included, because it costs us nothing to serve. Checking through the API or MCP
            server is metered at {SITE.name}&apos;s published per-word rate regardless of plan; Pro
            changes your word cap and monthly check allowance, not whether metered API checks are
            billed.
          </P>
        </Section>

        <Section title="4. What the service does not promise">
          <P>
            This is the part worth reading carefully, because it&apos;s also printed on every result
            and every exported report:
          </P>
          <Ul
            items={[
              'A detected mark is not proof that a document was AI-generated. It is evidence that a statistical pattern matching a specific key was found in it.',
              'An absent mark is not proof that a document was written by a person. Marks are not applied by every generator, survive editing poorly, and cannot be detected without the key used to apply them, and no model vendor publishes its key.',
              "Rewriting reduces detectable evidence; it does not and cannot guarantee defeating a model vendor's undisclosed watermark, because nobody outside that vendor holds the key it was applied with.",
              'The style measurement compares a document to reference prose in the same language. It measures register, not authorship, and is not evidence of how a document was produced.',
            ]}
          />
          <P>
            See <Link href="/limits">the stated limits page</Link> for the full list. You are
            responsible for how you use a result, including in any dispute with a third party; treat a
            result as one input to your own judgement, not a verdict.
          </P>
        </Section>

        <Section title="5. Acceptable use">
          <P>You agree not to:</P>
          <Ul
            items={[
              'Use the service to check or rewrite text you did not write and do not have the right to edit.',
              'Attempt to circumvent metering, rate limits, or plan allowances.',
              'Reverse-engineer, scrape, or resell access to the hosted checking API or MCP server outside a normal API key relationship.',
              'Use the service in a way that violates applicable law, including academic-integrity policies that apply to you.',
            ]}
          />
        </Section>

        <Section title="6. API keys and MCP access">
          <P>
            API keys work on any plan and are metered per the published rate. The MCP server&apos;s{' '}
            <code className="figure">check_document</code> tool calls the same hosted API when an API
            key is configured, and runs entirely locally with no billing and no data leaving the
            machine when it isn&apos;t. Keep API keys out of client-side code and public repositories;
            we treat a leaked key the same as any other, and you&apos;re responsible for usage billed
            to it until you revoke it.
          </P>
        </Section>

        <Section title="7. Availability">
          <P>
            We aim to keep the service available but don&apos;t guarantee uninterrupted uptime. We may
            change, suspend, or discontinue features, including on the free plan, with reasonable
            notice where practical. If we discontinue the paid plan entirely, we&apos;ll give existing
            Pro subscribers at least 30 days&apos; notice and pro-rate or refund the unused portion of
            the current billing period.
          </P>
        </Section>

        <Section title="8. Termination">
          <P>
            You can stop using the service and delete your account at any time by emailing{' '}
            {SITE.contactEmail}. We may suspend or terminate an account for violating section 5, for
            non-payment, or for activity that puts the service or other users at risk, and will tell
            you why when we do.
          </P>
        </Section>

        <Section title="9. Liability">
          <P>
            The service is provided as-is. To the extent permitted by law, we are not liable for
            indirect, incidental, or consequential damages arising from your use of the service or
            reliance on a result it produced, including decisions made using a check result or a
            rewritten document. Nothing here excludes liability that cannot lawfully be excluded, such
            as liability for death or personal injury caused by negligence, or for fraud.
          </P>
        </Section>

        <Section title="10. Changes to these terms">
          <P>
            If we change these terms materially, we&apos;ll update the date at the top of this page and,
            for signed-in users, note it on the dashboard. Continuing to use the service after a change
            takes effect means you accept the new terms; if you don&apos;t, stop using the service and,
            if you&apos;re on Pro, cancel your subscription.
          </P>
        </Section>

        <Section title="11. Governing law">
          <P>
            These terms are governed by the law of England and Wales, and the courts of England and
            Wales have exclusive jurisdiction over any dispute arising from them, except where
            mandatory consumer-protection law in your own country gives you the right to bring a claim
            elsewhere.
          </P>
        </Section>

        <Section title="Contact">
          <P>Questions about these terms: {SITE.contactEmail}.</P>
        </Section>

        <p className="mt-12 border-t border-ink-200 pt-6 text-xs leading-relaxed text-ink-400">
          This page describes the product as it actually works, but it is not a substitute for advice
          from a lawyer qualified in your jurisdiction, particularly for the liability and governing-law
          sections; get one before relying on it.
        </p>
      </article>
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="t-heading text-ink-900">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[15px] leading-relaxed text-ink-600">{children}</p>
}

function Ul({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-ink-600">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}
