import type { Metadata } from 'next'
import Link from 'next/link'
import { API_PRICE_PENCE_PER_1K_WORDS, PLANS } from '@/lib/site'
import { JsonLd, faqPageLd, softwareApplicationLd } from '@/components/json-ld'
import { Faq } from '@/components/faq'
import { stripeConfigured } from '@/lib/billing'

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Free on-device checks with no signup, a free account tier, and Pro with the dated PDF evidence report plus metered API and MCP access.',
  alternates: { canonical: '/pricing' },
}

const FAQ = [
  {
    question: 'What does Pro give me that free does not?',
    answer:
      'The dated evidence report, which the free tier structurally cannot produce: the free check runs in your browser and deliberately leaves nothing behind, so there is no stored record to date, anchor or hand to anyone. Pro also runs the analysis server-side against every detection key the deployment holds, including any vendor key that cannot be shipped to a browser without publishing it, plus batch upload and metered API and MCP access.',
  },
  {
    question: 'Is the API billed separately from the subscription?',
    answer: `Yes. Pro includes API and MCP access, and calls are metered at ${API_PRICE_PENCE_PER_1K_WORDS}p per 1,000 words, rounded up. A document too short for a statistic to be computed still consumes one unit, because the measurement was still performed. The machine-readable version of all of this is at /pricing.json.`,
  },
  {
    question: 'Is there a discount for students?',
    answer:
      'The free account tier is intended to cover the student case: 5,000 words per document and 20 checks a month is more than an appeal needs. If you need the evidence report and cost is the obstacle, write to us.',
  },
]

export default function PricingPage() {
  const billingLive = stripeConfigured()

  return (
    <>
      <JsonLd data={[softwareApplicationLd(), faqPageLd(FAQ)]} />
      <section className="mx-auto max-w-5xl px-5 pt-12">
        <h1 className="font-serif text-3xl text-ink-900">Pricing</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-600">
          The measurement is the same on every tier. What you pay for is the server-side path: keys a
          browser cannot hold, a stored record, and a document you can hand to someone else.
        </p>

        {!billingLive && (
          <div className="mt-6 rounded-lg border border-signal-500 bg-signal-100 px-4 py-3 text-sm text-signal-700">
            <p className="font-medium">Paid plans are not yet purchasable on this deployment.</p>
            <p className="mt-1 leading-relaxed">
              No payment processor is configured here, so the Pro checkout is switched off rather than
              shown as a button that fails. Free and account-tier checks work normally. This notice
              disappears when billing credentials are configured.
            </p>
          </div>
        )}

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <Tier
            name={PLANS.anonymous.name}
            price="Free"
            note="No account"
            features={[...PLANS.anonymous.features]}
            cta={{ label: 'Run a check', href: '/check' }}
          />
          <Tier
            name={PLANS.free.name}
            price="Free"
            note="Sign up"
            features={[...PLANS.free.features]}
            cta={{ label: 'Create an account', href: '/signup' }}
          />
          <Tier
            name={PLANS.pro.name}
            price={`£${PLANS.pro.price}`}
            note="per month"
            highlight
            features={[...PLANS.pro.features]}
            cta={
              billingLive
                ? { label: 'Upgrade to Pro', href: '/dashboard' }
                : { label: 'Billing not configured', href: '/dashboard', disabled: true }
            }
          />
        </div>

        <div className="mt-8 rounded-lg border border-ink-200 bg-white p-6">
          <h2 className="font-serif text-xl text-ink-900">For programmatic callers</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-600">
            The JSON API and the MCP server expose the same engine, metered at{' '}
            <span className="figure">{API_PRICE_PENCE_PER_1K_WORDS}p</span> per 1,000 words. An agent
            assembling a deliverable can disclose provenance before handoff rather than leaving the
            recipient to discover it.
          </p>
          <p className="mt-3 text-sm text-ink-500">
            <Link href="/docs/api" className="underline underline-offset-2 hover:text-ink-900">API documentation</Link>
            {' · '}
            <Link href="/docs/mcp" className="underline underline-offset-2 hover:text-ink-900">MCP server</Link>
            {' · '}
            <a href="/pricing.json" className="underline underline-offset-2 hover:text-ink-900">pricing.json</a>
            {' · '}
            <a href="/api/openapi.json" className="underline underline-offset-2 hover:text-ink-900">OpenAPI</a>
          </p>
        </div>

        <p className="mt-8 text-sm leading-relaxed text-ink-500">
          Not sold at any price, on any tier: removal, reduction, paraphrase or rewriting to weaken a
          provenance mark.
        </p>
      </section>

      <Faq items={FAQ} title="Pricing questions" />
    </>
  )
}

function Tier({
  name,
  price,
  note,
  features,
  cta,
  highlight,
}: {
  name: string
  price: string
  note: string
  features: string[]
  cta: { label: string; href: string; disabled?: boolean }
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-lg border bg-white p-6 ${highlight ? 'border-ink-900 shadow-sm' : 'border-ink-200'}`}
    >
      <h2 className="font-serif text-lg text-ink-900">{name}</h2>
      <p className="mt-2">
        <span className="figure text-3xl text-ink-900">{price}</span>{' '}
        <span className="text-sm text-ink-400">{note}</span>
      </p>
      <ul className="mt-5 space-y-3 text-sm leading-relaxed text-ink-600">
        {features.map((f) => (
          <li key={f} className="flex gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-300" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      {cta.disabled ? (
        <span className="mt-6 block cursor-not-allowed rounded bg-ink-100 px-4 py-2 text-center text-sm text-ink-400">
          {cta.label}
        </span>
      ) : (
        <Link
          href={cta.href}
          className={`mt-6 block rounded px-4 py-2 text-center text-sm font-medium ${
            highlight ? 'bg-ink-900 text-ink-50' : 'border border-ink-300 text-ink-800'
          }`}
        >
          {cta.label}
        </Link>
      )}
    </div>
  )
}
