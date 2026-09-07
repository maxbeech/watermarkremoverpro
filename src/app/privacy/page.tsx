import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/brand/ui'
import { SITE } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Privacy policy',
  description:
    'What WatermarkRemoverPro collects, what it never sees, and why: the free checker and the rewriter run entirely on your device, and everything server-side is scoped to what an account or a paid API call actually needs.',
  alternates: { canonical: '/privacy' },
}

const LAST_UPDATED = '7 September 2026'

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Privacy policy"
        lead="The short version: the free check and the rewriter run on your device and nothing about your document reaches our servers. An account, a saved check, or a paid API/MCP call is different, and this page says exactly what that involves."
      />
      <article className="mx-auto max-w-3xl px-5 py-12">
        <p className="text-sm text-ink-400">Last updated {LAST_UPDATED}.</p>

        <Section title="Who this covers">
          <P>
            This policy covers {SITE.name} at {SITE.url.replace('https://', '')}, operated by Max Beech
            (&ldquo;we&rdquo;, &ldquo;us&rdquo;). It does not cover Learnaway, a separate product for
            screening someone else&apos;s writing rather than your own; see that product&apos;s own
            policy for how it handles the documents people upload to it.
          </P>
        </Section>

        <Section title="On-device features: nothing is sent">
          <P>
            The free checker at <Link href="/check">/check</Link>, the free rewriter at{' '}
            <Link href="/rewrite">/rewrite</Link>, and the calibrator all download the detection or
            rewrite engine to your browser and run entirely there. Your document is measured or
            rewritten on your own device and never transmitted to us, on any tier. You can confirm
            this yourself by opening your browser&apos;s network tab while a check or rewrite runs. We do not receive, log, or retain the text of documents processed this way, because
            we never see them in the first place.
          </P>
        </Section>

        <Section title="What we collect when you create an account">
          <P>Creating an account (email and password, or an OAuth provider) stores:</P>
          <Ul
            items={[
              'Your email address and, if you gave one, a display name.',
              'A session token, the IP address and user-agent string of each sign-in, used to keep you signed in and to detect suspicious activity.',
              'Your plan (free or Pro) and, once you subscribe, a Stripe customer ID linking your account to your subscription.',
            ]}
          />
        </Section>

        <Section title="API keys">
          <P>
            Creating an API key for the JSON API or the hosted MCP mode stores a label and a SHA-256
            hash of the key, plus when it was created, last used, and revoked. The key itself is shown
            once at creation and cannot be recovered or shown again, by you or by us, so a database
            disclosure would not hand over a working credential.
          </P>
        </Section>

        <Section title="Server-side checks: API and MCP">
          <P>
            A check made through the JSON API or the hosted MCP mode (i.e. with{' '}
            <code className="figure">MARKWITNESS_API_KEY</code> set) necessarily runs on our servers,
            because a programmatic caller has no browser to run the on-device engine in. We record the
            word count, the billable units, and a SHA-256 hash of the document (not the document
            itself) against your account, purely to meter usage and enforce plan limits. The{' '}
            <code className="figure">reduce_ai_evidence</code> and <code className="figure">calibrate_text</code>{' '}
            rewrite tools have no server-side mode at all, on any tier: they always run in the calling
            process, never on our infrastructure.
          </P>
        </Section>

        <Section title="Saved checks and evidence reports">
          <P>
            Saved checks (visible on your dashboard) and PDF evidence reports are different: generating
            one stores the full analysis result against your account, including the text of the
            passages that were tested, so the report you download later matches the numbers you
            originally saw rather than a fresh re-run that might differ. This is the one place we
            retain excerpts of your document text server-side, and it only happens when you explicitly
            request a saved check or a report. Email {SITE.contactEmail} to have any saved check
            deleted.
          </P>
        </Section>

        <Section title="Payment">
          <P>
            Subscription payments are handled entirely by Stripe. We never receive or store your card
            details: only a Stripe customer ID and your subscription status, used to keep your
            account&apos;s plan in sync with what you&apos;re paying for. See{' '}
            <a href="https://stripe.com/privacy" target="_blank" rel="noreferrer">
              Stripe&apos;s own privacy policy
            </a>{' '}
            for how it handles payment data.
          </P>
        </Section>

        <Section title="Email">
          <P>
            Account and billing emails (password resets, receipts) are sent through our own
            transactional email provider on request. If that provider isn&apos;t configured on a given
            deployment, the email is not sent and nothing is silently faked; the affected flow (for
            example, password reset) fails visibly server-side rather than pretending to have worked.
          </P>
        </Section>

        <Section title="Error monitoring">
          <P>
            We use Sentry to catch crashes and server errors so we can fix them. It is configured with
            default personal data collection switched off (<code className="figure">sendDefaultPii: false</code>),
            so it is not intended to capture your document text, email, or IP address as a matter of
            course; an error report may still incidentally include technical context such as a request
            path or a stack trace.
          </P>
        </Section>

        <Section title="Who we share data with">
          <P>Only the processors needed to run the service itself:</P>
          <Ul
            items={[
              'Neon (Postgres database hosting) for account, API key and saved-check data.',
              'Stripe for payment processing and subscription status.',
              'Our transactional email provider, for account and billing email, when configured.',
              'Sentry, for error monitoring.',
              'Vercel, for hosting and CDN delivery.',
            ]}
          />
          <P>We do not sell personal data, and we do not use it for advertising.</P>
        </Section>

        <Section title="Your rights">
          <P>
            Depending on where you live, you may have rights to access, correct, export, or delete
            your personal data, and to object to or restrict certain processing. There is currently no
            self-service account-deletion button; email {SITE.contactEmail} from the address on the
            account and we will delete the account and associated saved checks. API usage records
            (word counts and billable units, not document content) may be retained for a reasonable
            period afterwards for billing and fraud-prevention records.
          </P>
        </Section>

        <Section title="International transfers">
          <P>
            We are based in the United Kingdom. Our infrastructure providers (Neon, Stripe, Sentry,
            Vercel) may process data in the UK, the EU, and the United States under their own
            standard safeguards.
          </P>
        </Section>

        <Section title="Changes to this policy">
          <P>
            If this policy changes materially, we&apos;ll update the date at the top of this page. We
            won&apos;t use a material change to justify handling previously collected data in a way
            you didn&apos;t agree to.
          </P>
        </Section>

        <Section title="Contact">
          <P>
            Questions, deletion requests, or anything else: {SITE.contactEmail}.
          </P>
        </Section>

        <p className="mt-12 border-t border-ink-200 pt-6 text-xs leading-relaxed text-ink-400">
          This page is a plain description of what the product actually does and stores, written from
          the code rather than from a template, but it is not a substitute for advice from a lawyer
          qualified in your jurisdiction: get one before relying on it for compliance purposes
          (GDPR, UK GDPR, CCPA, or otherwise).
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
