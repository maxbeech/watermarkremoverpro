import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader, Section, Wrap, Panel } from '@/components/brand/ui'

export const metadata: Metadata = {
  title: 'Documentation',
  description:
    'WatermarkRemoverPro documentation for machines: the JSON API and the MCP server, both running the same detection engine the browser does.',
  alternates: { canonical: '/docs' },
}

const DOCS = [
  {
    href: '/docs/api',
    title: 'JSON API',
    description:
      'Check documents for a statistical AI provenance mark over HTTP. API-key authenticated, metered per 1,000 words, OpenAPI documented.',
  },
  {
    href: '/docs/mcp',
    title: 'MCP server',
    description:
      'Expose the same check to an agent as an MCP tool. Runs locally with no API key, or hosted with one.',
  },
]

export default function DocsIndexPage() {
  return (
    <>
      <PageHeader
        eyebrow="For machines"
        title="Documentation"
        lead="Two ways to call the same engine the browser runs: a metered JSON API and an MCP server for agents."
      />
      <Section tight>
        <Wrap>
          <div className="grid gap-6 sm:grid-cols-2">
            {DOCS.map((doc, i) => (
              <Link key={doc.href} href={doc.href} className="block">
                <Panel interactive className="h-full p-6">
                  <span className="figure text-xs text-ink-400">{String(i + 1).padStart(2, '0')}</span>
                  <h2 className="t-heading mt-2 text-ink-900">{doc.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-ink-500">{doc.description}</p>
                </Panel>
              </Link>
            ))}
          </div>
          <p className="mt-8 text-sm text-ink-500">
            <a href="/api/openapi.json" className="link-quiet">OpenAPI 3.1 document</a>
            {' · '}
            <a href="/pricing.json" className="link-quiet">pricing.json</a>
            {' · '}
            <a href="/llms.txt" className="link-quiet">llms.txt</a>
          </p>
        </Wrap>
      </Section>
    </>
  )
}
