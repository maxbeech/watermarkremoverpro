import type { Metadata } from 'next'
import { BlogIndex } from '@/components/blog-index'

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'News, guides and reviews on AI provenance marks, detector false positives, and what evidence actually holds up when you have been accused of using AI.',
  alternates: { canonical: '/blog' },
}

// One week. Source of truth: STATIC_REVALIDATE_SECONDS in src/lib/site.ts;
// Next requires this to be a statically analysable literal.
export const revalidate = 604800

/**
 * Deliberately reads no search params. Filtering used to be `?category=`,
 * which made this page dynamic: a function invocation on every visit, on a
 * page whose content only changes when the site is deployed. Each category
 * now has its own prerendered route under /blog/category/[category], which
 * is cheaper to serve and separately indexable.
 */
export default function Page() {
  return <BlogIndex />
}
