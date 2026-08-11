import type { Metadata } from 'next'
import Link from 'next/link'
import { API_PRICE_PENCE_PER_1K_WORDS, SITE } from '@/lib/site'
import { PageHeader } from '@/components/brand/ui'

export const metadata: Metadata = {
  title: 'MCP server',
  description:
    'Expose the MarkWitness provenance-mark check to an agent as an MCP tool. Runs locally with no API key, or hosted with one.',
  alternates: { canonical: '/docs/mcp' },
}

export default function McpDocsPage() {
  return (
    <>
      <PageHeader
        eyebrow="For machines"
        title="MCP server"
        lead={
          <>
            So an agent assembling a deliverable can disclose the provenance of text <em>before</em>{' '}
            handing it over, rather than the recipient discovering it afterwards.
          </>
        }
      />
      <article className="mx-auto max-w-3xl px-5 pt-12 pb-16">

      <Section title="Configuration">
        <p>Point your client at the server over stdio:</p>
        <Code>{`{
  "mcpServers": {
    "markwitness": {
      "command": "npx",
      "args": ["-y", "tsx", "/path/to/markwitness/mcp/server.ts"],
      "env": { "MARKWITNESS_API_KEY": "mw_live_..." }
    }
  }
}`}</Code>
      </Section>

      <Section title="Two modes">
        <p>
          <strong>Local (no API key).</strong> The engine runs in the MCP server process against the
          published open reference key. Nothing leaves the machine, nothing is recorded, nothing is
          billed. This is the right mode for confidential drafts.
        </p>
        <p>
          <strong>Hosted (with an API key).</strong> Calls go to{' '}
          <code className="figure">{SITE.url}/api/v1/check</code>, which additionally applies any
          vendor or institution detection keys that deployment holds, which cannot be shipped to a
          local process without publishing them, saves the check to your history, and meters it at{' '}
          <span className="figure">{API_PRICE_PENCE_PER_1K_WORDS}p</span> per 1,000 words.
        </p>
      </Section>

      <Section title="Tools">
        <h3 className="font-medium text-ink-800">check_document</h3>
        <p>
          Takes <code className="figure">text</code>, and optionally{' '}
          <code className="figure">language</code> and <code className="figure">granularity</code>.
          Returns the full analysis: the keyed watermark statistic with its confidence band, the style
          measurement, the FDR-corrected per-passage breakdown, and the stated limits.
        </p>
        <h3 className="mt-5 font-medium text-ink-800">describe_method</h3>
        <p>
          Takes nothing and sends no document. Returns what is measured, which keys are available in
          the current mode, which languages have baselines, and the limits, so an agent can decide
          whether a check will answer its question before sending anything.
        </p>
      </Section>

      <Section title="Reading the result correctly">
        <p>
          The tool description says this and it is worth repeating: a detected mark is not proof of
          authorship, and an absent mark is not proof of human authorship. Because the construction is
          keyed and no vendor publishes a detection key, &ldquo;no mark detected&rdquo; always means
          &ldquo;under the keys listed in this response&rdquo;.
        </p>
        <p>
          An agent that reports this result as a verdict on who wrote something is misreporting it.
          Pass the <code className="figure">limits</code> array through to whatever consumes the
          answer.
        </p>
      </Section>

      <Section title="What is not exposed">
        <p>
          No tool that removes, weakens, paraphrases around or reduces a provenance mark, and no
          parameter that approximates one. An agent-callable mark remover is precisely the bulk
          laundering surface that would turn an individual diagnostic into an evasion service.
        </p>
        <p className="text-sm">
          <Link href="/limits" className="link-quiet">The full stated limits</Link>
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
