import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd, faqPageLd } from '@/components/json-ld'
import { Faq } from '@/components/faq'
import { LANGUAGE_NAMES, SUPPORTED_LANGUAGES } from '@/lib/detector/languages'
import { MIN_TRIALS } from '@/lib/detector'
import { loadBaseline } from '@/lib/detector/baselines'
import { BandRule } from '@/components/brand/band'
import { PageHeader } from '@/components/brand/ui'

export const metadata: Metadata = {
  title: 'Method',
  description:
    'Exactly what MarkWitness measures: a keyed green-list watermark z test, a key-free register measurement against per-language corpus baselines, and a false-discovery-rate correction on per-passage findings.',
  alternates: { canonical: '/method' },
}

const FAQ = [
  {
    question: 'Why two channels instead of one score?',
    answer:
      'Because they answer different questions and blending them would destroy both. The watermark test has a real null hypothesis and a real p value. The style measurement does not detect AI at all. It measures register. Combining them into one number would produce something with no defined meaning that would nonetheless be quoted as if it had one.',
  },
  {
    question: 'Why is a repeated word pair only counted once?',
    answer:
      'The z test assumes independent trials. A document that repeats "of the" forty times supplies one bit of evidence about the key partition, not forty. Counting repeats would inflate the statistic on any repetitive document, manufacturing a signal out of a writing habit.',
  },
  {
    question: 'Why does the style measurement not use a significance test?',
    answer:
      'Because the obvious test divides by the standard error, so its value grows with document length. A perfectly ordinary 5,000-word essay would score far higher than an identical 500-word one, and the writer would be reading the length of their own document as evidence against them. Effect size is the honest quantity here.',
  },
]

export default async function MethodPage() {
  // Read the real corpus provenance out of the shipped baselines rather than
  // restating it in prose, so this page cannot drift from the data it describes.
  const baselines = await Promise.all(
    SUPPORTED_LANGUAGES.map(async (code) => {
      try {
        const b = await loadBaseline(code)
        return { code, ...b.corpus, chunks: b.measurement.chunks }
      } catch {
        return null
      }
    }),
  )

  return (
    <>
      <JsonLd data={faqPageLd(FAQ)} />
      <PageHeader
        eyebrow="Method"
        title="Two measurements, kept separate on purpose."
        lead="Everything MarkWitness reports is one of two measurements. This page is the whole method, including the parts that limit what it can tell you."
      />

      <article className="mx-auto max-w-3xl px-5 pt-14">

        <section className="mt-10">
          <h2 className="t-title text-ink-900">1. The provenance-mark test (keyed)</h2>
          <BandRule at={18} className="mt-4 max-w-[6rem]" />
          <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
            A green-list watermark test, after Kirchenbauer, Geiping, Wen, Katz, Miers and Goldstein,{' '}
            <em>A Watermark for Large Language Models</em> (ICML 2023, arXiv:2301.10226). A keyed
            pseudorandom function seeded by the preceding token splits the vocabulary into a green
            list of size γ and a red list; a marked generator is nudged toward green. Detection is
            the one-proportion z test that falls out of that:
          </p>
          <p className="figure mt-4 rounded border border-ink-200 bg-white px-4 py-3 text-center text-sm">
            z = (|s|<sub>G</sub> − γT) / √(T · γ · (1 − γ))
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
            T is the number of scored word pairs and |s|<sub>G</sub> how many are green. We report the
            green rate with a Wilson interval, the z, and the one-sided p. Below {MIN_TRIALS} distinct
            pairs no z is reported at all, because the normal approximation is not trustworthy there and a
            number we do not trust is worse than no number.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
            Two honest caveats. Repeated word pairs are scored once, because the test assumes
            independent trials. And we partition on word bigrams rather than a model’s own subword
            vocabulary, which we do not have, so a vendor’s own detector can reach a different
            conclusion on the same document.
          </p>
        </section>

        <section className="mt-10 rounded-lg border border-seal-300 bg-seal-50 p-5">
          <h2 className="font-serif text-xl text-seal-700">The limitation that matters most</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-seal-700">
            A green-list mark is <strong>keyed</strong>. Without the secret used to apply it, the
            partition is unknowable and there is no test to run. No model vendor publishes a
            detection key, and a publicly checkable mark would be a publicly removable one, so this
            is unlikely to change.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-seal-700">
            MarkWitness therefore tests the keys it holds and names them on every result. It ships a
            published open reference key so the machinery is auditable:{' '}
            <Link href="/verify" className="underline underline-offset-2">
              mark a passage under it yourself
            </Link>{' '}
            and watch the statistic move. It also accepts vendor or institution keys through
            configuration. Any tool claiming to detect a named vendor’s mark without a key from that
            vendor is not doing what it says.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="t-title text-ink-900">2. The style measurement (key-free)</h2>
          <BandRule at={46} className="mt-4 max-w-[6rem]" />
          <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
            Fourteen subject-independent register features, among them mean word length, moving-average
            type-token ratio, hapax ratio, mean sentence length, sentence-length variability,
            function-word rate and six punctuation rates, measured on your document in 400-word
            chunks and expressed as a signed distance in standard deviations from a reference corpus
            in the same language. The composite is the root-mean-square of those distances, with a
            seeded percentile bootstrap over your own sentences giving the band.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
            <strong>This channel does not detect AI.</strong> It measures how far writing sits from
            contemporary reference prose. Technical writing, fiction, poetry, translated text and
            non-native prose all sit far from that reference for entirely ordinary reasons, and the
            result says so wherever the number appears.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="t-title text-ink-900">The reference corpora</h2>
          <BandRule at={70} className="mt-4 max-w-[6rem]" />
          <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
            Measured, not estimated. Every document was language-verified by the engine’s own
            identifier before being included, because the API was asked for Spanish and is generally telling
            the truth, but a baseline is what every user’s number is compared against, and “the source
            said so” is not verification.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-400">
                  <th className="py-2 pr-4 font-medium">Language</th>
                  <th className="py-2 pr-4 font-medium">Documents</th>
                  <th className="py-2 pr-4 font-medium">Words</th>
                  <th className="py-2 pr-4 font-medium">Chunks</th>
                  <th className="py-2 font-medium">Retrieved</th>
                </tr>
              </thead>
              <tbody>
                {baselines.map((b, i) =>
                  b ? (
                    <tr key={b.code} className="border-b border-ink-100">
                      <td className="py-2 pr-4">{LANGUAGE_NAMES[SUPPORTED_LANGUAGES[i]]}</td>
                      <td className="figure py-2 pr-4">{b.documents.toLocaleString()}</td>
                      <td className="figure py-2 pr-4">{b.tokens.toLocaleString()}</td>
                      <td className="figure py-2 pr-4">{b.chunks.toLocaleString()}</td>
                      <td className="figure py-2">{b.retrievedAt.slice(0, 10)}</td>
                    </tr>
                  ) : (
                    <tr key={SUPPORTED_LANGUAGES[i]} className="border-b border-ink-100">
                      <td className="py-2 pr-4">{LANGUAGE_NAMES[SUPPORTED_LANGUAGES[i]]}</td>
                      <td className="py-2 text-ink-500" colSpan={4}>
                        baseline not available in this build, reported as unsupported
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-ink-400">
            Source: Wikipedia article prose via the MediaWiki API, CC BY-SA 4.0.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="t-title text-ink-900">3. Per-passage findings are corrected</h2>
          <BandRule at={30} className="mt-4 max-w-[6rem]" />
          <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
            Each passage carries its own test, so a long document runs dozens simultaneously and some
            will look significant by chance. A Benjamini-Hochberg false-discovery-rate correction is
            applied across all passages before any is presented as a finding, and the result reports
            how many were tested and how many survived.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
            Without that correction a per-passage highlighter will confidently colour in sentences of
            any document you give it, which is the false accusation this product exists to help
            people answer, generated by the product itself.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="t-title text-ink-900">Where the analysis runs</h2>
          <BandRule at={58} className="mt-4 max-w-[6rem]" />
          <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
            The free check runs entirely in your browser. The engine is a single module with no
            network calls; open the network tab and watch. The API, the hosted MCP mode and the PDF
            report necessarily run on our servers, because a programmatic caller has no browser, and
            those are opt-in and documented rather than quietly the same path.
          </p>
        </section>
      </article>

      <Faq items={FAQ} title="Method questions" />
    </>
  )
}
