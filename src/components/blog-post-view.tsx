import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { Faq } from '@/components/faq'
import {
  JsonLd,
  blogPostingLd,
  breadcrumbLd,
  faqPageLd,
  howToLd,
  reviewLd,
} from '@/components/json-ld'
import { BandRule } from '@/components/brand/band'
import { ButtonLink, Eyebrow, LimitNote, Wrap } from '@/components/brand/ui'
import { CATEGORY_TONE, findPost, type BlogPost } from '@/content/blog'
import { SITE } from '@/lib/site'

/**
 * One renderer for every blog post, the same way `long-tail-page.tsx` is one
 * renderer for every pSEO page. A post is data; this is the only place that
 * decides how a hero image, a TOC, a stats table or a review rating actually
 * get drawn, so fifteen posts cannot each invent their own markup and drift.
 */

const FORMAT_LABEL: Record<BlogPost['format'], string> = {
  'how-to': 'How-to guide',
  'deep-dive': 'Deep dive',
  listicle: 'Listicle',
  review: 'Review',
  'data-study': 'Data study',
  'case-study': 'Case study',
  skyscraper: 'Complete guide',
}

function wordCount(post: BlogPost): number {
  const text = [
    ...post.intro,
    ...post.takeaways,
    ...post.sections.flatMap((s) => [s.heading, ...s.body]),
    ...post.pitfalls,
    ...post.faq.flatMap((f) => [f.question, f.answer]),
  ].join(' ')
  return text.split(/\s+/).filter(Boolean).length
}

export function readingMinutes(post: BlogPost): number {
  return Math.max(1, Math.round(wordCount(post) / 200))
}

function formatDate(iso: string): string {
  return new Date(`${iso}T09:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function blogPostMetadata(slug: string): Metadata {
  const post = findPost(slug)
  if (!post) return {}
  const url = `${SITE.url}/blog/${post.slug}`
  return {
    title: post.title,
    description: post.metaDescription,
    alternates: { canonical: `/blog/${post.slug}` },
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.metaDescription,
      url,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author],
      images: [{ url: post.heroImage.src, alt: post.heroImage.alt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.metaDescription,
      images: [post.heroImage.src],
    },
  }
}

export function BlogPostView({ post }: { post: BlogPost }) {
  const toneClass = CATEGORY_TONE[post.category]
  const minutes = readingMinutes(post)

  const structuredData: Record<string, unknown>[] = [
    blogPostingLd({
      slug: post.slug,
      title: post.title,
      metaDescription: post.metaDescription,
      publishedAt: post.publishedAt,
      author: post.author,
      heroImageSrc: post.heroImage.src,
    }),
    faqPageLd(post.faq),
    breadcrumbLd([
      { name: 'Home', url: '/' },
      { name: 'Blog', url: '/blog' },
      { name: post.title, url: `/blog/${post.slug}` },
    ]),
  ]

  if (post.schemaType === 'HowTo') {
    structuredData.push(
      howToLd({
        title: post.title,
        metaDescription: post.metaDescription,
        steps: post.sections.map((s) => ({ heading: s.heading, body: s.body.join(' ') })),
      })
    )
  }

  if (post.schemaType === 'Review' && post.reviewRating) {
    structuredData.push(reviewLd({ ...post.reviewRating, author: post.author }))
  }

  return (
    <>
      <JsonLd data={structuredData} />

      <div className="paper border-b border-ink-200">
        <Wrap wide className="pt-10 pb-10">
          <nav className="t-eyebrow text-ink-400">
            <Link href="/" className="transition-colors hover:text-seal-600">
              Home
            </Link>
            <span className="mx-2 text-ink-400">/</span>
            <Link href="/blog" className="transition-colors hover:text-seal-600">
              Blog
            </Link>
            <span className="mx-2 text-ink-400">/</span>
            <span className={`t-eyebrow rounded-full border px-2.5 py-1 ${toneClass}`}>
              {post.category}
            </span>
          </nav>

          <h1 className="t-title mt-6 max-w-3xl text-ink-900">{post.h1}</h1>
          <BandRule at={58} className="mt-6 max-w-[9rem]" />

          <div className="figure mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
            <span>{post.author}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
            <span aria-hidden="true">·</span>
            <span>{minutes} min read</span>
            <span aria-hidden="true">·</span>
            <span>{FORMAT_LABEL[post.format]}</span>
          </div>
        </Wrap>
      </div>

      <div className="relative aspect-[21/9] w-full overflow-hidden bg-ink-100">
        <Image
          src={post.heroImage.src}
          alt={post.heroImage.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <p className="mx-auto max-w-6xl px-5 pt-2 text-right text-xs text-ink-400">
        Photo via{' '}
        <a
          href={`https://unsplash.com/photos/${post.heroImage.unsplashId}`}
          className="underline decoration-ink-300 underline-offset-2 hover:text-seal-600"
        >
          Unsplash
        </a>
      </p>

      <article className="mx-auto w-full max-w-6xl px-5 py-12">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,17rem)] lg:gap-14">
          <div className="prose-body min-w-0 max-w-2xl">
            {post.intro.map((paragraph, i) => (
              <p key={i} className="t-lead mt-4 text-ink-700 first:mt-0">
                {paragraph}
              </p>
            ))}

            <div className="mt-8 rounded-[var(--radius-panel)] border border-seal-200 bg-seal-50 p-6">
              <Eyebrow className="mb-3">TL;DR</Eyebrow>
              <ul className="space-y-2 text-[15px] leading-relaxed text-ink-700">
                {post.takeaways.map((t, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="figure mt-[2px] shrink-0 text-xs text-seal-600">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-10 space-y-10">
              {post.sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-24">
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

            {post.table && (
              <figure className="mt-10 overflow-x-auto rounded-[var(--radius-panel)] border border-ink-200 shadow-[var(--shadow-panel)]">
                <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-ink-300 bg-ink-100/70">
                      {post.table.headers.map((h) => (
                        <th key={h} className="px-4 py-3 font-medium text-ink-700">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {post.table.rows.map((row, i) => (
                      <tr key={i} className="border-b border-ink-200 last:border-0">
                        {row.map((cell, j) => (
                          <td key={j} className="figure px-4 py-3 text-ink-600">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <figcaption className="border-t border-ink-200 bg-white px-4 py-2.5 text-xs text-ink-500">
                  {post.table.caption}
                </figcaption>
              </figure>
            )}

            <blockquote className="mt-10 border-l-2 border-seal-400 bg-white py-1 pl-6">
              <p className="t-lead text-ink-700">“{post.quote.quote}”</p>
              <footer className="figure mt-3 text-xs text-ink-500">
                {post.quote.attribution}, {post.quote.role}
              </footer>
            </blockquote>

            <section className="mt-10">
              <h2 className="t-heading text-ink-900">Common pitfalls</h2>
              <BandRule at={28} className="mt-4 max-w-[5rem]" tone="muted" />
              <ul className="mt-4 space-y-2.5">
                {post.pitfalls.map((p, i) => (
                  <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-ink-600">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-signal-500" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </section>

            <div className="mt-10 max-w-2xl">
              <LimitNote>
                A detected mark is not proof of authorship, and an absent mark is not proof of
                human authorship. {SITE.name}&apos;s on-device rewrite can reduce detectable
                evidence but cannot guarantee defeating a vendor&apos;s undisclosed watermark, on
                any tier.
              </LimitNote>
            </div>

            {(post.internalLinks.length > 0 || post.externalLinks.length > 0) && (
              <section className="mt-10 border-t border-ink-200 pt-8">
                <Eyebrow className="mb-4">Further reading</Eyebrow>
                <div className="grid gap-8 sm:grid-cols-2">
                  {post.internalLinks.length > 0 && (
                    <div>
                      <p className="t-eyebrow text-ink-400">On WatermarkRemoverPro</p>
                      <ul className="mt-3 space-y-2">
                        {post.internalLinks.map((l) => (
                          <li key={l.href}>
                            <Link
                              href={l.href}
                              className="text-sm text-seal-700 underline decoration-seal-200 underline-offset-2 hover:decoration-seal-500"
                            >
                              {l.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {post.externalLinks.length > 0 && (
                    <div>
                      <p className="t-eyebrow text-ink-400">Sources</p>
                      <ul className="mt-3 space-y-2">
                        {post.externalLinks.map((l) => (
                          <li key={l.href}>
                            <a
                              href={l.href}
                              rel="nofollow noopener noreferrer"
                              target="_blank"
                              className="text-sm text-ink-600 underline decoration-ink-300 underline-offset-2 hover:text-seal-700 hover:decoration-seal-500"
                            >
                              {l.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <nav aria-label="Table of contents" className="rounded-[var(--radius-panel)] border border-ink-200 bg-white p-5 shadow-[var(--shadow-panel)]">
              <Eyebrow className="mb-3">On this page</Eyebrow>
              <ul className="space-y-2 text-sm">
                {post.sections.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="text-ink-600 transition-colors hover:text-seal-700"
                    >
                      {s.heading}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-6 rounded-[var(--radius-panel)] border border-ink-200 bg-white p-6 shadow-[var(--shadow-panel)]">
              <h2 className="t-heading text-ink-900">Check a document now</h2>
              <p className="mt-2.5 text-sm leading-relaxed text-ink-600">
                Free, no signup, up to 1,500 words. The document is analysed in your browser and
                never uploaded.
              </p>
              <ButtonLink href="/check" className="mt-5 w-full">
                Run a check
              </ButtonLink>
            </div>
          </aside>
        </div>
      </article>

      <Faq items={post.faq} title="Questions this post answers" />
    </>
  )
}
