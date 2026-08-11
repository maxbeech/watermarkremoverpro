import { Section, SectionHead, Wrap } from '@/components/brand/ui'

export interface FaqItem {
  question: string
  answer: string
}

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
        <dl className="mt-10 divide-y divide-ink-200 border-t border-ink-300">
          {items.map((item, i) => (
            <div
              key={item.question}
              className="group grid gap-x-8 gap-y-2 py-6 transition-colors duration-150 sm:grid-cols-[2.5rem_minmax(0,1fr)]"
            >
              <span className="figure hidden pt-1 text-xs text-ink-300 transition-colors duration-150 group-hover:text-seal-500 sm:block">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <dt className="font-medium text-ink-900">{item.question}</dt>
                <dd className="mt-2.5 text-[15px] leading-relaxed text-ink-600">{item.answer}</dd>
              </div>
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
      'No. A detected mark is not proof of authorship. Marks can appear in text that was quoted, translated, edited, or written with assistance, and a statistical test reports a probability rather than a fact about a person. MarkWitness reports the strength of the signal and the passages carrying it, and states this limit on every result and every exported report.',
  },
  {
    question: 'Can this tool remove or reduce a mark?',
    answer:
      'No, and it never will. There is no removal, substitution, paraphrase, rewrite or "lower your score" capability on any tier, whether free, Pro, API or MCP, and none is planned. MarkWitness is a diagnostic. A tool that removed provenance marks would be an evasion service for the compliance mechanism the EU AI Act relies on, which is a different product and not one we will build.',
  },
  {
    question: 'Does my document ever leave my device?',
    answer:
      'Not on the free check. The analysis runs in your browser: the detection engine is downloaded to your device and the text is measured there. You can confirm it by opening your browser network tab and watching while the check runs. The API, the MCP server and the PDF evidence report necessarily run on our servers, because a programmatic caller has no browser, and those paths are documented separately and are opt-in.',
  },
  {
    question: 'Which languages are supported at launch?',
    answer:
      'English, Spanish, French, German and Portuguese. Each has its own reference baseline measured from real contemporary prose in that language; a language without a measured baseline is reported as unsupported rather than analysed against a substitute, because comparing Portuguese text to a Spanish reference produces deviations that look like findings and are artefacts.',
  },
  {
    question: 'An absent mark: does that prove I wrote it myself?',
    answer:
      'No, and this matters as much as the first answer. Marks survive editing poorly, are not applied by every system, and cannot be detected at all without the key used to apply them. No model vendor publishes its detection key. MarkWitness tests the keys it holds and names them, so "no mark detected" always means "under these keys" and never "this document is clean".',
  },
  {
    question: 'What can I actually hand to someone who has accused me?',
    answer:
      'The Pro evidence report: a dated PDF carrying the signal strength with its confidence band, the per-passage breakdown after false-discovery-rate correction, the full stated limits, the list of keys tested, and a SHA-256 hash of the exact document analysed. The hash is what ties the report to one specific file, so the report cannot be waved at a different draft.',
  },
]
