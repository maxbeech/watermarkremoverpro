import Link from 'next/link'
import { Checker } from '@/components/checker/checker'
import { CORE_FAQ, Faq } from '@/components/faq'
import { JsonLd, faqPageLd, softwareApplicationLd } from '@/components/json-ld'
import { SITE, SUPPORTED_LANGUAGE_NAMES } from '@/lib/site'

export default function HomePage() {
  return (
    <>
      <JsonLd data={[softwareApplicationLd(), faqPageLd(CORE_FAQ)]} />

      <section className="mx-auto max-w-3xl px-5 pt-14 pb-8 text-center">
        <h1 className="font-serif text-4xl leading-tight text-ink-900 sm:text-5xl">
          Someone said your writing was AI. <br className="hidden sm:block" />
          Find out what the evidence actually says.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-ink-600">
          {SITE.name} checks your own writing for a statistical AI provenance mark, tells you how
          strong the signal is and which passages carry it — and is equally clear about what it
          cannot tell you. The free check runs in your browser. The document never leaves your device.
        </p>
        <p className="mt-4 text-sm text-ink-500">
          {SUPPORTED_LANGUAGE_NAMES.join(' · ')}
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-6">
        <Checker />
      </section>

      <section className="mx-auto max-w-3xl px-5 py-12">
        <div className="grid gap-6 sm:grid-cols-3">
          <Card title="It shows its working">
            Every figure is a computed statistic with the count it came from and a band around it.
            Where something could not be measured, it says so instead of printing a zero.
          </Card>
          <Card title="It refuses to overclaim">
            A green-list mark is keyed, and no vendor publishes its key. Results always name the keys
            that were tested, so “no mark found” never quietly becomes “you’re cleared”.
          </Card>
          <Card title="It will never remove a mark">
            No removal, no paraphrase, no “reduce your score” — on any tier, for any caller, ever.
            That is a permanent constraint, not a roadmap position.
          </Card>
        </div>
      </section>

      <section className="border-y border-ink-200 bg-white">
        <div className="mx-auto max-w-3xl px-5 py-12">
          <h2 className="font-serif text-2xl text-ink-900">Don’t take our word for it</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
            A detector you cannot test is a detector you have to trust. On the{' '}
            <Link href="/verify" className="underline underline-offset-2 hover:text-ink-900">
              verify page
            </Link>{' '}
            you can mark a passage under our published reference key in your own browser, run the
            check, and watch the statistic move — then run the same passage against a different key
            and watch it sit at chance. That is the difference between arithmetic and theatre, and
            you can see it for yourself in about fifteen seconds.
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-600">
            The{' '}
            <Link href="/method" className="underline underline-offset-2 hover:text-ink-900">
              method page
            </Link>{' '}
            sets out the test, the correction applied to per-passage findings, and where the
            reference baselines came from.
          </p>
        </div>
      </section>

      <Faq items={CORE_FAQ} />

      <section className="mx-auto max-w-3xl px-5 pb-16">
        <div className="rounded-lg border border-ink-200 bg-white p-6">
          <h2 className="font-serif text-xl text-ink-900">If you need something to hand over</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
            An on-screen result answers your own question. An appeal usually needs a document: the
            Pro evidence report is a dated PDF carrying the signal strength and its band, the
            corrected per-passage breakdown, the keys tested, the full stated limits, and a SHA-256
            hash tying it to the exact file you checked.
          </p>
          <Link
            href="/pricing"
            className="mt-5 inline-block rounded bg-ink-900 px-5 py-2 text-sm font-medium text-ink-50"
          >
            See what’s in the report
          </Link>
        </div>
      </section>
    </>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-ink-200 bg-white p-5">
      <h3 className="font-serif text-lg text-ink-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-600">{children}</p>
    </div>
  )
}
