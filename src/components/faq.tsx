import { Section, SectionHead, Wrap } from '@/components/brand/ui'
import { PRO_TRIAL_RUNS_PER_WINDOW, PRO_TRIAL_WINDOW_DAYS } from '@/lib/entitlements/pro-trial'

export interface FaqItem {
  question: string
  answer: string
}

/**
 * The FAQ, as a list of disclosures.
 *
 * It used to render every answer expanded with a numbered gutter, which put
 * eighteen hundred words of prose between the homepage's last section and its
 * closing call to action. The answers are still in the DOM (so they are still
 * indexed, and the FAQPage structured data still describes them); they are
 * just not all shouted at once.
 */
export function Faq({
  items,
  title = 'Questions people actually ask',
}: {
  items: FaqItem[]
  title?: string
}) {
  return (
    <Section surface="panel" tight>
      <Wrap>
        <SectionHead eyebrow="Answers, in full" title={title} />
        <dl className="mt-8 space-y-2.5">
          {items.map((item) => (
            <div
              key={item.question}
              className="rounded-[var(--radius-panel)] border border-ink-200 transition-colors duration-150 hover:border-ink-300"
            >
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4">
                  <dt className="font-semibold text-ink-900">{item.question}</dt>
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-ink-400 transition-transform duration-200 group-open:rotate-180"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </span>
                </summary>
                <dd className="px-5 pb-5 text-[15px] leading-relaxed text-ink-600">{item.answer}</dd>
              </details>
            </div>
          ))}
        </dl>
      </Wrap>
    </Section>
  )
}

/**
 * The load-bearing questions, kept in one place because they appear on the home
 * page, in the FAQPage structured data, and in llms.txt. Answering them
 * differently in different places is how a product ends up with a policy it
 * only half means.
 */
export const CORE_FAQ: FaqItem[] = [
  {
    question: 'Is a detected mark proof I used AI?',
    answer:
      'No. A detected mark is not proof of authorship. Marks can appear in text that was quoted, translated, edited, or written with assistance, and a statistical test reports a probability rather than a fact about a person. WatermarkRemoverPro reports the strength of the signal and the passages carrying it, and states this limit on every result and every exported report.',
  },
  {
    question: 'Can this tool guarantee my writing won\'t be flagged?',
    answer:
      'No, and any tool that claims a 100% or guaranteed result is overselling a probabilistic process. WatermarkRemoverPro can reduce detectable AI-style evidence: both statistical watermark signal, where structurally possible, and human-perceptible AI tells like em dashes and stock phrasing. It cannot guarantee defeating a model vendor\'s undisclosed watermark, because nobody outside that vendor holds the key it was applied with, and no honest tool can promise otherwise. The rewrite runs entirely on your device, on every tier, and shows you the before/after evidence so you can judge the result yourself rather than take a guarantee on faith.',
  },
  {
    question: 'What\'s the difference between the Standard and Pro rewrite engines?',
    answer:
      `Standard is deterministic substitution against the core AI-tell library: instant, no download, and unlimited on every plan with no word cap or monthly limit, because the computation happens on your device rather than on our servers. Pro is a real small language model that downloads once and runs in your browser, generating more candidate rewrites per passage and using the extended AI-tell library. Everyone gets ${PRO_TRIAL_RUNS_PER_WINDOW === 1 ? 'one free Pro-engine run' : `${PRO_TRIAL_RUNS_PER_WINDOW} free Pro-engine runs`} every ${PRO_TRIAL_WINDOW_DAYS} days so you can compare them on your own text, and a Pro subscription removes that limit. Neither engine ever sends your text anywhere.`,
  },
  {
    question: 'Does my document ever leave my device?',
    answer:
      'Not on the free check, and never on the rewrite feature, on any tier or surface. Checking runs in your browser: the detection engine is downloaded to your device and the text is measured there; you can confirm it by opening your browser network tab and watching while the check runs. The API, the MCP server and the PDF evidence report necessarily run on our servers for CHECKING, because a programmatic caller has no browser, and those paths are documented separately and are opt-in. Rewriting is different and stricter: it runs entirely on-device or in-process everywhere, in the browser, the API package, and the MCP server alike, with no hosted mode at all, on any tier.',
  },
  {
    question: 'Which languages are supported at launch?',
    answer:
      'English, Spanish, French, German and Portuguese. Each has its own reference baseline measured from real contemporary prose in that language; a language without a measured baseline is reported as unsupported rather than analysed against a substitute, because comparing Portuguese text to a Spanish reference produces deviations that look like findings and are artefacts.',
  },
  {
    question: 'An absent mark: does that prove I wrote it myself?',
    answer:
      'No, and this matters as much as the first answer. Marks survive editing poorly, are not applied by every system, and cannot be detected at all without the key used to apply them. No model vendor publishes its detection key. WatermarkRemoverPro tests the keys it holds and names them, so "no mark detected" always means "under these keys" and never "this document is clean".',
  },
  {
    question: 'What can I actually hand to someone who has accused me?',
    answer:
      'The Pro evidence report: a dated PDF carrying the signal strength with its confidence band, the per-passage breakdown after false-discovery-rate correction, the full stated limits, the list of keys tested, and a SHA-256 hash of the exact document analysed. The hash is what ties the report to one specific file, so the report cannot be waved at a different draft.',
  },
]
