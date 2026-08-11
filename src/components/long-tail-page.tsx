import Link from 'next/link'
import type { Metadata } from 'next'
import { Faq } from '@/components/faq'
import { JsonLd, breadcrumbLd, faqPageLd, softwareApplicationLd } from '@/components/json-ld'
import { findPage, type LongTailPage } from '@/content/pages'
import { SITE } from '@/lib/site'

/**
 * One renderer for every long-tail page.
 *
 * The disclaimer block, the structured data and the call to action live here
 * rather than in twenty page files, so they cannot drift apart. A programmatic
 * SEO set whose pages disagree about what the product does is worse than no set
 * at all.
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

export function LongTailPageView({ page }: { page: LongTailPage }) {
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

      <article className="mx-auto max-w-3xl px-5 pt-12">
        <nav className="text-xs text-ink-400">
          <Link href="/" className="hover:text-ink-700">Home</Link>
          <span className="mx-2">/</span>
          <Link href={`/${page.group}`} className="hover:text-ink-700">{GROUP_LABELS[page.group]}</Link>
        </nav>

        <h1 className="mt-4 font-serif text-3xl leading-snug text-ink-900 sm:text-4xl">{page.title}</h1>
        <p className="mt-5 text-lg leading-relaxed text-ink-600">{page.intro}</p>

        <div className="prose-body mt-10 space-y-10">
          {page.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-serif text-2xl text-ink-900">{section.heading}</h2>
              {section.body.map((paragraph, i) => (
                <p key={i} className="mt-3 text-[15px] leading-relaxed text-ink-600">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>

        <aside className="mt-12 rounded-lg border border-ink-200 bg-white p-6">
          <h2 className="font-serif text-xl text-ink-900">Check a document now</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-600">
            Up to 1,500 words without an account, analysed in your browser. The document is not
            uploaded — you can watch the network tab while it runs.
          </p>
          <Link
            href="/check"
            className="mt-4 inline-block rounded bg-ink-900 px-5 py-2 text-sm font-medium text-ink-50"
          >
            Run a check
          </Link>
        </aside>

        <p className="mt-8 rounded border-l-2 border-ink-300 bg-ink-100/60 px-4 py-3 text-sm leading-relaxed text-ink-600">
          Wherever this page describes a result: a detected mark is not proof of authorship, and an
          absent mark is not proof of human authorship. MarkWitness has no feature that removes,
          weakens or rewrites around a provenance mark, on any tier.
        </p>
      </article>

      <Faq items={page.faq} />
    </>
  )
}
