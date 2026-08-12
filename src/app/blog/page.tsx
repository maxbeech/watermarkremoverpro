import type { Metadata } from 'next'
import { BlogIndex } from '@/components/blog-index'
import type { BlogCategory } from '@/content/blog-types'

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'News, guides and reviews on AI provenance marks, detector false positives, and what evidence actually holds up when you have been accused of using AI.',
  alternates: { canonical: '/blog' },
}

const VALID_CATEGORIES: BlogCategory[] = ['Academy', 'News', 'Reviews']

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const selected = VALID_CATEGORIES.find((c) => c === category)
  return <BlogIndex category={selected} />
}
