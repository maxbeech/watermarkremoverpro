import type { Metadata } from 'next'
import { statedLimits } from '@/lib/detector'
import { PUBLIC_DETECTION_KEYS } from '@/lib/detector/public-keys'
import { JsonLd, faqPageLd } from '@/components/json-ld'
import { Faq } from '@/components/faq'

export const metadata: Metadata = {
  title: 'Stated limits',
  description:
    'What a MarkWitness result cannot tell you: why a detected mark is not proof of authorship, why an absent mark is not proof of human authorship, and what the keyed construction means for any null result.',
  alternates: { canonical: '/limits' },
}

const FAQ = [
  {
    question: 'Why publish the limits so prominently?',
    answer:
      'Because this product exists because a number was over-read about somebody. A tool that helps with that and then invites the same mistake in the other direction has not improved anything. The limits are part of every result and every exported report, not a page people are trusted to find.',
  },
  {
    question: 'Doesn’t this make the product sound weak?',
    answer:
      'It makes it sound accurate. A report that admits what it cannot establish survives contact with a sceptical reader; one that claims to prove innocence collapses the first time someone knowledgeable reads it, and takes the writer’s credibility with it.',
  },
]

export default function LimitsPage() {
  // Read from the engine, so this page cannot say something different from what
  // a result says.
  const limits = statedLimits(PUBLIC_DETECTION_KEYS)

  return (
    <>
      <JsonLd data={faqPageLd(FAQ)} />
      <article className="mx-auto max-w-3xl px-5 pt-12">
        <h1 className="font-serif text-3xl text-ink-900">Stated limits</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-600">
          These are attached to every result MarkWitness produces, in every channel, and printed in
          full on every exported report. They are the output, not commentary on it.
        </p>

        <ol className="mt-8 space-y-6">
          {limits.map((limit, i) => (
            <li key={i} className="flex gap-4">
              <span className="figure mt-0.5 text-sm text-ink-300">{String(i + 1).padStart(2, '0')}</span>
              <p className="text-[15px] leading-relaxed text-ink-700">{limit}</p>
            </li>
          ))}
        </ol>

        <section className="mt-12">
          <h2 className="font-serif text-2xl text-ink-900">The asymmetry worth understanding</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
            A detected mark is meaningful evidence that text carrying that key’s signature is present.
            An absent mark is much weaker evidence of anything, because so many ordinary histories
            produce it: the generator applied no mark, the mark was applied with a key nobody outside
            the vendor holds, the text was edited or translated enough to degrade the signal, or a
            person simply wrote it.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
            That asymmetry is unavoidable and it is why MarkWitness never says “cleared”. What it can
            give you is a documented, dated, hash-anchored record of a specific test on a specific
            file, with the method named, which is a great deal more than an unexplained percentage,
            and considerably more durable than a claim that overstates itself.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-2xl text-ink-900">One thing this product will never do</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
            Remove, weaken, paraphrase around or reduce a provenance mark. Not on the free tier, not
            on Pro, not through the API, not through the MCP server, not as a parameter, and not
            later. Provenance marking is a transparency mechanism, and a tool built to defeat it is
            an evasion service whatever it calls itself.
          </p>
        </section>
      </article>

      <Faq items={FAQ} title="About these limits" />
    </>
  )
}
