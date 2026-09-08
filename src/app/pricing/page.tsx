import type { Metadata } from 'next'
import Link from 'next/link'
import { API_PRICE_PENCE_PER_1K_WORDS, PLANS } from '@/lib/site'
import { PRO_TRIAL_RUNS_PER_WINDOW, PRO_TRIAL_WINDOW_DAYS } from '@/lib/entitlements/pro-trial'
import { JsonLd, faqPageLd, softwareApplicationLd } from '@/components/json-ld'
import { Faq } from '@/components/faq'
import { BandRule } from '@/components/brand/band'
import { ButtonLink, Eyebrow, PageHeader, Panel, Section, Wrap } from '@/components/brand/ui'
import { ExhibitFrame, ResultExhibit } from '@/components/marketing/exhibit'
import { Reveal } from '@/components/marketing/parallax'
import { markedSpecimenResult } from '@/components/marketing/specimen'
import { stripeConfigured } from '@/lib/billing'

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Unlimited on-device rewriting on the Standard engine, free or Pro, plus a free weekly run of the Pro rewrite engine for everyone. Free on-device checks with no signup, a free account tier, and Pro with the unlimited Pro engine, the dated PDF evidence report, and metered API/MCP access to checking.',
  alternates: { canonical: '/pricing' },
}

const FAQ = [
  {
    question: 'What does Pro give me that free does not?',
    answer:
      `For rewriting: the Pro engine, a real local language model, with no weekly limit, plus more candidates generated per passage and the extended AI-tell library. Everyone gets ${PRO_TRIAL_RUNS_PER_WINDOW === 1 ? 'one free Pro-engine run' : `${PRO_TRIAL_RUNS_PER_WINDOW} free Pro-engine runs`} every ${PRO_TRIAL_WINDOW_DAYS} days and unlimited use of the Standard engine, so you can see exactly what the upgrade buys on your own text before paying for it. For checking: the dated evidence report, which the free tier structurally cannot produce, since the free check runs in your browser and deliberately leaves nothing behind. Pro also runs checks server-side against every detection key the deployment holds, plus batch upload and metered API/MCP access to checking.`,
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

export default async function PricingPage() {
  const billingLive = stripeConfigured()
  const specimen = await markedSpecimenResult()

  return (
    <>
      <JsonLd data={[softwareApplicationLd(), faqPageLd(FAQ)]} />
      <PageHeader
        eyebrow="Pricing"
        title="Rewriting is free and unlimited. Pay for the bigger engine."
        wide
        lead={`On-device rewriting has no server cost, so the Standard engine is unlimited whether you pay or not, forever. Everyone also gets ${PRO_TRIAL_RUNS_PER_WINDOW === 1 ? 'one free run' : `${PRO_TRIAL_RUNS_PER_WINDOW} free runs`} of the Pro engine every ${PRO_TRIAL_WINDOW_DAYS} days. What you pay for is the Pro engine without that limit, and, for checking, the server-side path: keys a browser cannot hold, a stored record, and a document you can hand to someone else.`}
      />

      <Section tight>
        <Wrap wide>
        {!billingLive && (
          <div className="mb-10 rounded-[var(--radius-panel)] border border-signal-400 bg-signal-100 px-5 py-4 text-sm text-signal-700">
            <p className="font-medium">Paid plans are not yet purchasable on this deployment.</p>
            <p className="mt-1.5 leading-relaxed">
              No payment processor is configured here, so the Pro checkout is switched off rather than
              shown as a button that fails. Free and account-tier checks work normally. This notice
              disappears when billing credentials are configured.
            </p>
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-3">
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

        {/* What the paid tier actually produces, shown rather than described. */}
        <div className="mt-14 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Eyebrow>What Pro adds</Eyebrow>
            <h2 className="t-title mt-4 text-ink-900">A document, not a screen.</h2>
            <BandRule at={40} className="mt-5 max-w-[7rem]" />
            <p className="t-lead mt-5 text-ink-600">
              The free check gives you this result and deliberately leaves nothing behind. Pro turns
              the same measurement into a dated PDF carrying the signal strength and its band, the
              per-passage breakdown after correction, the keys tested, the full stated limits and a
              SHA-256 hash tying it to the exact file you checked.
            </p>
            <p className="mt-5 text-sm leading-relaxed text-ink-500">
              Rewriting itself is <Link href="/rewrite" className="link-quiet">a separate feature</Link>,
              always on-device and unlimited on the Standard engine. It cannot guarantee defeating a
              model vendor&apos;s undisclosed watermark, on any tier, at any price.
            </p>
          </div>

          <Reveal>
            <ExhibitFrame
              url="watermarkremoverpro.com/check"
              tilt
              caption="A real analysis of a specimen paragraph carrying a mark under the open reference key this product publishes."
            >
              <ResultExhibit result={specimen} passages={1} />
            </ExhibitFrame>
          </Reveal>
        </div>

        <Panel className="mt-14 p-7" interactive>
          <Eyebrow tone="ink">For programmatic callers</Eyebrow>
          <h2 className="t-heading mt-4 text-ink-900">The same engine, metered</h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-600">
            The JSON API and the MCP server expose the same checking engine, metered at{' '}
            <span className="figure">{API_PRICE_PENCE_PER_1K_WORDS}p</span> per 1,000 words. An agent
            assembling a deliverable can disclose provenance before handoff rather than leaving the
            recipient to discover it. Rewriting has no REST endpoint by design (it is strictly
            on-device on every tier); call it via the MCP server or the local package/CLI, both
            unmetered.
          </p>
          <p className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-ink-500">
            <Link href="/docs/api" className="link-quiet">API documentation</Link>
            <Link href="/docs/mcp" className="link-quiet">MCP server</Link>
            <a href="/pricing.json" className="link-quiet">pricing.json</a>
            <a href="/api/openapi.json" className="link-quiet">OpenAPI</a>
          </p>
        </Panel>
        </Wrap>
      </Section>

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
      className={
        'flex flex-col rounded-[var(--radius-panel)] border bg-white p-7 transition-[box-shadow,transform,border-color] duration-200 hover:-translate-y-[2px] ' +
        (highlight
          ? 'border-seal-300 shadow-[var(--shadow-raised)] hover:shadow-[var(--shadow-exhibit)]'
          : 'border-ink-200 shadow-[var(--shadow-panel)] hover:border-seal-200 hover:shadow-[var(--shadow-raised)]')
      }
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-ink-600">{name}</h2>
        {highlight && (
          <span className="rounded-full bg-seal-100 px-2.5 py-0.5 text-[11px] font-semibold text-seal-700">
            Most complete
          </span>
        )}
      </div>
      <p className="mt-4 flex items-baseline gap-2">
        <span className="figure text-4xl leading-none text-ink-900">{price}</span>
        <span className="text-sm text-ink-500">{note}</span>
      </p>
      <ul className="mt-6 flex-1 space-y-3.5 border-t border-ink-100 pt-6 text-sm leading-relaxed text-ink-600">
        {features.map((f) => (
          <li key={f} className="flex gap-2.5">
            {/* A tick, not a 3px square: a checklist of what you get should
                look like one, and the square read as a stray bullet glyph. */}
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
              className={'mt-0.5 shrink-0 ' + (highlight ? 'text-seal-600' : 'text-mint-500')}
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      {cta.disabled ? (
        <span className="mt-7 block cursor-not-allowed rounded-full bg-ink-100 px-4 py-2.5 text-center text-sm font-semibold text-ink-500">
          {cta.label}
        </span>
      ) : (
        <ButtonLink
          href={cta.href}
          tone={highlight ? 'primary' : 'quiet'}
          className="mt-7 w-full"
        >
          {cta.label}
        </ButtonLink>
      )}
    </div>
  )
}
