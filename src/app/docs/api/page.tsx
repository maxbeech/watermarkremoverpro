import type { Metadata } from 'next'
import Link from 'next/link'
import { API_PRICE_PENCE_PER_1K_WORDS, SITE } from '@/lib/site'
import { SUPPORTED_LANGUAGES } from '@/lib/detector/languages'
import { PageHeader } from '@/components/brand/ui'

export const metadata: Metadata = {
  title: 'JSON API',
  description:
    'Check documents for a statistical AI provenance mark over HTTP. API-key authenticated, metered per 1,000 words, OpenAPI documented.',
  alternates: { canonical: '/docs/api' },
}

export default function ApiDocsPage() {
  return (
    <>
      <PageHeader
        eyebrow="For machines"
        title="JSON API"
        lead={
          <>
            The same engine the browser runs, plus any detection keys this deployment holds that
            cannot be shipped to a browser. Metered at{' '}
            <span className="figure">{API_PRICE_PENCE_PER_1K_WORDS}p</span> per 1,000 words, rounded
            up.
          </>
        }
      />
      <article className="mx-auto max-w-3xl px-5 pt-12 pb-16">
      <p className="mt-3 text-sm text-ink-500">
        <a href="/api/openapi.json" className="link-quiet">OpenAPI 3.1 document</a>
        {' · '}
        <a href="/pricing.json" className="link-quiet">pricing.json</a>
        {' · '}
        <Link href="/dashboard" className="link-quiet">Get a key</Link>
      </p>

      <Section title="Authentication">
        <p>
          Pass your key as a bearer token. Keys are created in the dashboard, stored only as a
          SHA-256 hash, and shown once.
        </p>
        <Code>{`Authorization: Bearer mw_live_...`}</Code>
      </Section>

      <Section title="POST /api/v1/check">
        <Code>{`curl -X POST ${SITE.url}/api/v1/check \\
  -H "Authorization: Bearer $MARKWITNESS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "The text you want to check...",
    "language": "en",
    "granularity": "sentence"
  }'`}</Code>
        <p className="mt-3">
          <code className="figure">language</code> is optional. Omit it and the engine identifies it,
          or returns <code className="figure">language_undetermined</code> rather than guessing.
          Supported: {SUPPORTED_LANGUAGES.join(', ')}.
        </p>
      </Section>

      <Section title="Reading the response">
        <p>
          <strong>Every statistic is either a number or null.</strong> Null means the value was not
          computed, and the sibling <code className="figure">status</code> and{' '}
          <code className="figure">detail</code> fields say why. Rendering null as zero would turn
          &ldquo;we could not measure this&rdquo; into &ldquo;we measured this and found nothing&rdquo;,
          which are very different claims to make about someone&rsquo;s document.
        </p>
        <Code>{`{
  "result": {
    "status": "ok",
    "documentHash": "9f2c...",           // SHA-256 of the exact text
    "watermark": {
      "keysTested": [ { "id": "openmark-ref-1", "vendorPublished": false } ],
      "results": [ {
        "status": "computed",
        "trials": 412,                   // distinct word pairs, repeats counted once
        "greenRate": 0.508,
        "greenRateInterval": { "low": 0.460, "high": 0.556 },
        "expectedGreenRate": 0.5,
        "z": 0.32,
        "pValue": 0.374
      } ],
      "anyDetected": false,
      "coverageNotice": "Tested against 1 key ... no vendor publishes one ..."
    },
    "distribution": { "status": "computed", "compositeDeviation": 1.42, ... },
    "passages": [ ... ],
    "passageCorrection": { "method": "benjamini-hochberg", "tested": 34, "survived": 0 },
    "limits": [ "A detected mark is not proof of authorship.", ... ]
  },
  "billing": { "words": 812, "billableUnits": 1, "pence": 2, "currency": "GBP" }
}`}</Code>
        <p className="mt-3">
          <code className="figure">coverageNotice</code> and <code className="figure">limits</code> are
          part of the result, not decoration. If you surface this data to a user, surface those too, because
          a null watermark result quoted without its coverage notice says something the measurement
          does not support.
        </p>
      </Section>

      <Section title="Status codes">
        <ul className="mt-2 space-y-2">
          <Status code="200">Analysis complete. Note that a successful call can still carry a result whose status is <code className="figure">language_undetermined</code> , because the request worked and the measurement declined.</Status>
          <Status code="400">Body was not valid JSON, or failed validation. <code className="figure">issues</code> names the fields.</Status>
          <Status code="401">Missing, unknown or revoked key.</Status>
          <Status code="402">Outside your plan allowance. The message names the exact limit reached and when it resets.</Status>
          <Status code="503">This deployment has no metering ledger, so metered access cannot be granted. It refuses rather than serving unmetered.</Status>
        </ul>
      </Section>

      <Section title="What this API does not offer">
        <p>
          There is no endpoint or parameter, on any plan, that rewrites a document to reduce
          detectable evidence. That is a deliberate omission, not a missing feature: rewriting is
          on-device only, on every tier, and a REST endpoint that accepted your document text would
          break that guarantee. Call the on-device rewrite engine instead via the MCP server&apos;s{' '}
          <Link href="/docs/mcp" className="link-quiet">reduce_ai_evidence tool</Link>, or the
          published local package/CLI, both of which run in your own process and never transmit the
          document.
        </p>
      </Section>
      </article>
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="t-heading text-ink-900">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-ink-600">{children}</div>
    </section>
  )
}

function Code({ children }: { children: string }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded border border-ink-200 bg-white p-4 text-xs leading-relaxed text-ink-800">
      <code className="figure">{children}</code>
    </pre>
  )
}

function Status({ code, children }: { code: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="figure shrink-0 text-ink-400">{code}</span>
      <span>{children}</span>
    </li>
  )
}
