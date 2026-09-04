import Link from 'next/link'
import type { Metadata } from 'next'
import { Faq } from '@/components/faq'
import { JsonLd, breadcrumbLd, faqPageLd, softwareApplicationLd } from '@/components/json-ld'
import { BandRule } from '@/components/brand/band'
import { ButtonLink, Eyebrow, LimitNote, Wrap } from '@/components/brand/ui'
import { ExhibitFrame, ResultExhibit } from '@/components/marketing/exhibit'
import { Reveal } from '@/components/marketing/parallax'
import { markedSpecimenResult } from '@/components/marketing/specimen'
import { findPage, type LongTailPage } from '@/content/pages'
import { PLANS, SITE } from '@/lib/site'

/**
 * One renderer for every long-tail page.
 *
 * The disclaimer block, the structured data, the exhibit and the call to action
 * live here rather than in twenty page files, so they cannot drift apart. A
 * programmatic SEO set whose pages disagree about what the product does is worse
 * than no set at all.
 *
 * Every one of these pages carries a real result screen. Someone arriving from
 * search on the worst day of their term should be able to see what the tool
 * actually produces without first having to trust it enough to paste in an essay.
 */

const GROUP_LABELS: Record<LongTailPage['group'], string> = {
  for: 'Who it is for',
  vs: 'Comparisons',
  guide: 'Guides',
  in: 'Languages',
}

export function longTailMetadata(group: LongTailPage['group'], slug: string): Metadata {
  const page = findPage(group, slug)
  if (!page) return {}
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: { canonical: `/${group}/${slug}` },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url: `${SITE.url}/${group}/${slug}`,
      type: 'article',
    },
  }
}

export async function LongTailPageView({ page }: { page: LongTailPage }) {
  const specimen = await markedSpecimenResult()

  return (
    <>
      <JsonLd
        data={[
          softwareApplicationLd(),
          faqPageLd(page.faq),
          breadcrumbLd([
            { name: 'Home', url: '/' },
            { name: GROUP_LABELS[page.group], url: `/${page.group}` },
            { name: page.title, url: `/${page.group}/${page.slug}` },
          ]),
        ]}
      />

      <div className="paper border-b border-ink-200">
        <Wrap className="pt-10 pb-12">
          <nav className="t-eyebrow text-ink-400">
            <Link href="/" className="transition-colors hover:text-seal-600">
              Home
            </Link>
            <span className="mx-2 text-ink-300">/</span>
            <Link href={`/${page.group}`} className="transition-colors hover:text-seal-600">
              {GROUP_LABELS[page.group]}
            </Link>
          </nav>

          <h1 className="t-title mt-6 text-ink-900">{page.title}</h1>
          <BandRule at={58} className="mt-6 max-w-[9rem]" />
          <p className="t-lead mt-6 text-ink-600">{page.intro}</p>
        </Wrap>
      </div>

      <article className="mx-auto w-full max-w-6xl px-5 py-14">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,23rem)] lg:gap-14">
          <div className="prose-body max-w-2xl space-y-10">
            {page.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="t-heading text-ink-900">{section.heading}</h2>
                <BandRule at={28} className="mt-4 max-w-[5rem]" tone="muted" />
                {section.body.map((paragraph, i) => (
                  <p key={i} className="mt-4 text-[15px] leading-relaxed text-ink-600">
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}
          </div>

          {/* The product, on the page, at real size. */}
          <aside className="lg:sticky lg:top-8 lg:self-start">
            <Eyebrow className="mb-4">What a result looks like</Eyebrow>
            <Reveal>
              <ExhibitFrame
                url="markwitness.helm7.com/check"
                tilt
                caption="A real analysis of a specimen paragraph carrying a mark under the open reference key this product publishes. The figures were computed by the engine, not written here."
              >
                <ResultExhibit result={specimen} passages={1} />
              </ExhibitFrame>
            </Reveal>

            <div className="mt-8 rounded-[4px] border border-ink-200 bg-white p-6 shadow-[var(--shadow-panel)]">
              <h2 className="t-heading text-ink-900">Check a document now</h2>
              <p className="mt-2.5 text-sm leading-relaxed text-ink-600">
                Up to {PLANS.anonymous.wordCap.toLocaleString()} words without an account, analysed
                in your browser. The document is not uploaded, and you can watch the network tab
                while it runs.
              </p>
              <ButtonLink href="/check" className="mt-5">
                Run a check
              </ButtonLink>
            </div>
          </aside>
        </div>

        <div className="mt-14 max-w-2xl">
          <LimitNote>
            Wherever this page describes a result: a detected mark is not proof of authorship, and
            an absent mark is not proof of human authorship. {SITE.name}&apos;s on-device rewrite
            can reduce detectable evidence but cannot guarantee defeating a vendor&apos;s undisclosed
            watermark, on any tier.
          </LimitNote>
        </div>
      </article>

      <Faq items={page.faq} />
    </>
  )
}
