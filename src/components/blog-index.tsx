import Link from 'next/link'
import Image from 'next/image'
import { PageHeader, Section, Wrap } from '@/components/brand/ui'
import { BLOG_CATEGORIES, BLOG_POSTS, CATEGORY_TONE, categorySlug, type BlogPost } from '@/content/blog'
import { readingMinutes } from '@/components/blog-post-view'

const CATEGORIES: (BlogPost['category'] | 'All')[] = ['All', ...BLOG_CATEGORIES]

function formatDate(iso: string): string {
  return new Date(`${iso}T09:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function BlogIndex({ category }: { category?: BlogPost['category'] }) {
  const posts = [...BLOG_POSTS]
    .filter((p) => !category || p.category === category)
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))

  return (
    <>
      <PageHeader
        eyebrow="WatermarkRemoverPro Blog"
        title="Provenance marks, false positives, and what actually holds up as evidence"
        lead="News, guides and reviews for anyone who has been accused of using AI, or who has to decide whether an accusation is fair. Written by the team building the tool, and checked against what a detector can actually prove."
      />

      <div className="border-b border-ink-200 bg-white py-5">
        <Wrap wide>
          <nav aria-label="Filter by category" className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const active = c === 'All' ? !category : category === c
              // Real routes, not a ?category= query string: a search param
              // makes this page dynamic (a function invocation on every
              // visit, on a page that only changes at deploy time), and a
              // query-string filter is not separately indexable. Both are
              // fixed by giving each category its own prerendered URL.
              const href = c === 'All' ? '/blog' : `/blog/category/${categorySlug(c)}`
              return (
                <Link
                  key={c}
                  href={href}
                  className={
                    't-eyebrow rounded-full border px-3.5 py-1.5 transition-colors duration-150 ' +
                    (active
                      ? 'border-ink-900 bg-ink-900 text-white'
                      : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300 hover:bg-ink-50')
                  }
                >
                  {c}
                </Link>
              )
            })}
          </nav>
        </Wrap>
      </div>

      <Section tight>
        <Wrap wide>
          {posts.length === 0 ? (
            <p className="text-ink-500">No posts in this category yet.</p>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col overflow-hidden rounded-[var(--radius-panel)] border border-ink-200 bg-white shadow-[var(--shadow-panel)] transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-[2px] hover:border-seal-200 hover:shadow-[var(--shadow-raised)]"
                >
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-ink-100">
                    <Image
                      src={post.heroImage.src}
                      alt={post.heroImage.alt}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                    <span
                      className={`t-eyebrow absolute left-3 top-3 rounded-full border px-2.5 py-1 ${CATEGORY_TONE[post.category]}`}
                    >
                      {post.category}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h2 className="t-heading text-ink-900 transition-colors duration-150 group-hover:text-seal-700">
                      {post.title}
                    </h2>
                    <p className="mt-2.5 flex-1 text-sm leading-relaxed text-ink-500">
                      {post.metaDescription}
                    </p>
                    <p className="figure mt-4 text-xs text-ink-400">
                      {formatDate(post.publishedAt)} · {readingMinutes(post)} min read
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Wrap>
      </Section>
    </>
  )
}
