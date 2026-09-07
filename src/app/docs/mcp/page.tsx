import type { Metadata } from 'next'
import Link from 'next/link'
import { API_PRICE_PENCE_PER_1K_WORDS, SITE } from '@/lib/site'
import { PageHeader } from '@/components/brand/ui'

export const metadata: Metadata = {
  title: 'MCP server',
  description:
    'Expose WatermarkRemoverPro to an agent as an MCP tool: check_document for the provenance-mark check (local or hosted), plus reduce_ai_evidence and calibrate_text for on-device rewriting, which has no hosted mode on any tier.',
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

      <Section title="Claude Code: one command">
        <p>
          Installs the MCP server, a skill telling the agent when to reach for it, and a hook
          that checks public-facing content the agent writes before it ships:
        </p>
        <Code>{`claude plugin marketplace add maxbeech/watermarkremoverpro
claude plugin install watermarkremoverpro@watermarkremoverpro`}</Code>
        <p>
          The server is a single committed file that runs under plain{' '}
          <code className="figure">node</code>. There is nothing to install, no build step and no
          checkout to keep current, which is the only version of this that survives contact with a
          real workflow.
        </p>
      </Section>

      <Section title="Any other MCP client">
        <p>
          Clone the repository (or copy{' '}
          <code className="figure">plugins/watermarkremoverpro/dist/mcp-server.mjs</code> out of it) and
          point your client at the bundled server over stdio:
        </p>
        <Code>{`{
  "mcpServers": {
    "watermarkremoverpro": {
      "command": "node",
      "args": ["/path/to/watermarkremoverpro/plugins/watermarkremoverpro/dist/mcp-server.mjs"],
      "env": { "MARKWITNESS_API_KEY": "mw_live_..." }
    }
  }
}`}</Code>
        <p>
          Or, for Claude Code without the plugin:{' '}
          <code className="figure">
            claude mcp add watermarkremoverpro -- node /path/to/plugins/watermarkremoverpro/dist/mcp-server.mjs
          </code>
        </p>
        <p className="text-sm">
          The <code className="figure">MARKWITNESS_API_KEY</code> line is optional and only affects{' '}
          <code className="figure">check_document</code>. Leave it out and everything runs locally.
        </p>
      </Section>

      <Section title="What the hook does">
        <p>
          After the agent writes or edits a file that looks like public web content (markdown,
          HTML, or anything under a <code className="figure">content/</code>,{' '}
          <code className="figure">posts/</code> or <code className="figure">blog/</code> path), the
          hook measures the prose and reports what it found: AI tells, three-item-list and
          &ldquo;not just X, but Y&rdquo; constructions, elevated AI-associated vocabulary, and any
          passage carrying watermark signal that survives correction.
        </p>
        <p>
          It never edits the file. A hook that silently rewrites what an agent just wrote is a hook
          that makes changes nobody reviewed. It also stays completely silent on clean prose, on
          source code, and on anything under 120 words, because a check that fires on every write
          gets muted within a day.
        </p>
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
          the current mode, which languages have baselines, the limits, and the rewrite
          capability&apos;s own stated limits, so an agent can decide whether a check will answer its
          question before sending anything.
        </p>
        <h3 className="mt-5 font-medium text-ink-800">reduce_ai_evidence</h3>
        <p>
          Takes <code className="figure">text</code>, and optionally{' '}
          <code className="figure">language</code>, <code className="figure">strength</code>{' '}
          (<code className="figure">preserve</code> / <code className="figure">balanced</code> /{' '}
          <code className="figure">aggressive</code> / <code className="figure">regenerate</code>),{' '}
          <code className="figure">tier</code> (<code className="figure">free</code> /{' '}
          <code className="figure">pro</code>), and <code className="figure">model</code>{' '}
          (<code className="figure">standard</code>, the default rule-based engine, or{' '}
          <code className="figure">advanced</code>, a real local LLM downloaded and cached on first
          use). Rewrites the passages a real per-passage check flags, on-device, and returns the
          revised text alongside the same stated limits every surface carries: it cannot guarantee
          defeating an undisclosed vendor watermark, on any tier.
        </p>
        <h3 className="mt-5 font-medium text-ink-800">calibrate_text</h3>
        <p>
          A lighter, fully deterministic synonym-substitution pass over a document&apos;s word
          frequencies, returning suggested substitutions with before/after metrics rather than a
          finished rewrite. For the fuller pass that also targets flagged passages and removes
          stylistic AI tells, use <code className="figure">reduce_ai_evidence</code> instead.
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

      <Section title="What has no hosted mode, on any tier">
        <p>
          <code className="figure">reduce_ai_evidence</code> and{' '}
          <code className="figure">calibrate_text</code>{' '}
          always run in this server&apos;s own process, unlike{' '}
          <code className="figure">check_document</code>. There is no{' '}
          <code className="figure">MARKWITNESS_API_KEY</code>{' '}
          branch for either, no REST endpoint, and no parameter that sends the document anywhere:
          rewriting is more sensitive than measuring, and gets no exception to the on-device
          guarantee. See <code className="figure">docs/REWRITE_PHILOSOPHY.md</code>{' '}
          in the repository for what the rewrite tools claim and do not claim.
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
