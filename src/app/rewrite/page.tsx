import type { Metadata } from 'next'
import { RewriteTool } from '@/components/rewrite/rewrite-tool'
import { PageHeader, Wrap } from '@/components/brand/ui'

export const metadata: Metadata = {
  title: 'Free On-Device AI Text Rewriter',
  description:
    'Free, unlimited, on-device rewrite: reduce detectable AI-style evidence in your own writing, both statistical watermark signal where structurally possible and AI tells like em dashes and stock phrasing. No signup, no upload, no "undetectable" claim; see what it does and does not promise below.',
  alternates: { canonical: '/rewrite' },
}

export default function RewritePage() {
  return (
    <>
      <PageHeader
        eyebrow="Rewrite"
        title="Reduce detectable AI-style evidence"
        lead="Targets the passages that actually carry evidence, on your device, with no server involved. It cannot guarantee defeating a model vendor's undisclosed watermark; see what it does and doesn't claim below."
      />

      <Wrap className="py-12">
        <RewriteTool />
      </Wrap>

      <div className="border-t border-ink-200 bg-ink-100/70 py-12">
        <Wrap>
          <div className="max-w-2xl space-y-4">
            <h2 className="t-title text-ink-900">How it works, and its limits</h2>

            <details className="cursor-pointer rounded-lg border border-ink-200 bg-white p-4">
              <summary className="font-medium text-ink-900">
                Can this guarantee my writing won&apos;t be flagged?
              </summary>
              <p className="mt-3 text-sm text-ink-700">
                No. It reduces detectable evidence, both statistical watermark signal where
                structurally possible and human-perceptible AI tells like em dashes and stock
                phrasing. It cannot guarantee defeating a model vendor&apos;s undisclosed watermark,
                because nobody outside that vendor holds the key it was applied with.
              </p>
            </details>

            <details className="cursor-pointer rounded-lg border border-ink-200 bg-white p-4">
              <summary className="font-medium text-ink-900">Where does my text go?</summary>
              <p className="mt-3 text-sm text-ink-700">
                Nowhere. Rewriting runs entirely on your device, on every tier, on every surface
                (browser, MCP, local package/CLI). There is no hosted mode for this feature,
                unlike checking.
              </p>
            </details>

            <details className="cursor-pointer rounded-lg border border-ink-200 bg-white p-4">
              <summary className="font-medium text-ink-900">
                Why does it sometimes leave a passage unchanged?
              </summary>
              <p className="mt-3 text-sm text-ink-700">
                Every candidate rewrite has to preserve the numbers, negations and named entities
                in the original, and stay above a similarity floor for the strength you chose. A
                passage with no candidate that clears both is left completely unchanged rather
                than replaced with something unsafe.
              </p>
            </details>

            <details className="cursor-pointer rounded-lg border border-ink-200 bg-white p-4">
              <summary className="font-medium text-ink-900">
                What&apos;s the difference between Standard and Advanced?
              </summary>
              <p className="mt-3 text-sm text-ink-700">
                Both run the same on-device engine with unlimited use. Advanced (Pro) generates
                more candidate rewrites per passage and uses the extended AI-tell library.
              </p>
            </details>
          </div>
        </Wrap>
      </div>
    </>
  )
}
