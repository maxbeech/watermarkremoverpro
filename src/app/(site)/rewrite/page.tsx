import type { Metadata } from 'next'
import { Workspace } from '@/components/workspace/workspace'
import { PageHeader, Section, Wrap } from '@/components/brand/ui'
import { PRO_TRIAL_RUNS_PER_WINDOW, PRO_TRIAL_WINDOW_DAYS } from '@/lib/entitlements/pro-trial'

export const metadata: Metadata = {
  title: 'Free On-Device AI Text Rewriter',
  description:
    'Free, unlimited, on-device rewrite: reduce detectable AI-style evidence in your own writing, both statistical watermark signal where structurally possible and AI tells like em dashes and stock phrasing. No signup, no upload, no "undetectable" claim.',
  alternates: { canonical: '/rewrite' },
}

/**
 * The rewrite flow, addressed to the "AI text rewriter" search intent.
 *
 * It renders the SAME `Workspace` component the homepage does. This is a
 * different door into one product, not a second implementation of it. The
 * page's own job is the copy above and below the tool.
 */
export default function RewritePage() {
  return (
    <>
      <PageHeader
        eyebrow="Free · no account · nothing uploaded"
        title="Reduce detectable AI-style evidence in your writing"
        lead="Targets the passages that actually carry evidence, on your device, with no server involved, then shows you what a detector still measures in the result. It cannot guarantee defeating a model vendor's undisclosed watermark; see what it does and doesn't claim below."
      />

      <Section tight>
        <Wrap>
          <Workspace />
        </Wrap>
      </Section>

      <Section surface="deep" tight>
        <Wrap>
          <h2 className="t-title text-ink-900">How it works, and its limits</h2>

          <div className="mt-6 space-y-3">
            <Question q="Can this guarantee my writing won't be flagged?">
              No. It reduces detectable evidence, both statistical watermark signal where
              structurally possible and human-perceptible AI tells like em dashes and stock
              phrasing. It cannot guarantee defeating a model vendor&apos;s undisclosed watermark,
              because nobody outside that vendor holds the key it was applied with.
            </Question>

            <Question q="Where does my text go?">
              Nowhere. Rewriting runs entirely on your device, on every tier, on every surface
              (browser, MCP, local package/CLI). There is no hosted mode for this feature, unlike
              checking.
            </Question>

            <Question q="Why does it sometimes leave a passage unchanged?">
              Every candidate rewrite has to preserve the numbers, negations and named entities in
              the original, and stay above a similarity floor for the strength you chose. A passage
              with no candidate that clears both is left completely unchanged rather than replaced
              with something unsafe.
            </Question>

            <Question q="What is the difference between the Standard and Pro engines?">
              Standard is deterministic substitution against the core AI-tell library: instant, no
              download, unlimited on every plan, forever. Pro is a small language model that
              downloads once and runs in your browser, with the extended AI-tell library and more
              candidate rewrites per passage. Everyone gets{' '}
              {PRO_TRIAL_RUNS_PER_WINDOW === 1 ? 'one free Pro run' : `${PRO_TRIAL_RUNS_PER_WINDOW} free Pro runs`}{' '}
              every {PRO_TRIAL_WINDOW_DAYS} days; a Pro subscription removes the limit.
            </Question>
          </div>
        </Wrap>
      </Section>
    </>
  )
}

function Question({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-[var(--radius-panel)] border border-ink-200 bg-white px-5 py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink-900">
        {q}
        <span className="text-ink-400 transition-transform duration-200 group-open:rotate-180" aria-hidden="true">
          ⌄
        </span>
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-ink-600">{children}</p>
    </details>
  )
}
