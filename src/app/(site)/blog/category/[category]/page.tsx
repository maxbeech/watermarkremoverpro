import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BlogIndex } from '@/components/blog-index'
import { BLOG_CATEGORIES, categoryFromSlug, categorySlug, postsByCategory } from '@/content/blog'

export const dynamicParams = false
// One week. Source of truth: STATIC_REVALIDATE_SECONDS in src/lib/site.ts;
// Next requires this to be a statically analysable literal.
export const revalidate = 604800

export function generateStaticParams() {
  return BLOG_CATEGORIES.map((c) => ({ category: categorySlug(c) }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const { category: slug } = await params
  const category = categoryFromSlug(slug)
  if (!category) return {}

  const count = postsByCategory(category).length
  return {
    title: `${category} posts`,
    description: `${count} ${category} ${count === 1 ? 'post' : 'posts'} on AI provenance marks, detector false positives and what evidence actually holds up when you have been accused of using AI.`,
    alternates: { canonical: `/blog/category/${slug}` },
  }
}

export default async function Page({ params }: { params: Promise<{ category: string }> }) {
  const { category: slug } = await params
  const category = categoryFromSlug(slug)
  if (!category) notFound()

  return <BlogIndex category={category} />
}
