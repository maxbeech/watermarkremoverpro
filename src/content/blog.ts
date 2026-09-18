import { BRAND_ID } from '@/lib/site'
import type { BlogPost } from './blog-types'
import { BLOG_POSTS_A as WRP_POSTS_A } from './watermarkremoverpro/blog-posts-a'
import { BLOG_POSTS_B as WRP_POSTS_B } from './watermarkremoverpro/blog-posts-b'
import { BLOG_POSTS_C as WRP_POSTS_C } from './watermarkremoverpro/blog-posts-c'
import { BLOG_POSTS as NEVERPROMPTED_POSTS } from './neverprompted/blog-posts'

export type {
  BlogCategory,
  BlogFaqItem,
  BlogFormat,
  BlogImage,
  BlogIntent,
  BlogLink,
  BlogPost,
  BlogQuote,
  BlogReviewRating,
  BlogSection,
  BlogTable,
} from './blog-types'

/**
 * The blog's content source, assembled per brand the same way `pages.ts` is
 * the single source for the pSEO pages. One post is one object; the renderer
 * in `blog-post-view.tsx` is the only thing that decides how it gets drawn.
 *
 * BRAND_ID is resolved once at build time (see src/lib/site.ts), so this
 * picks one brand's posts and everything below never needs to know two
 * brands exist.
 */
const POSTS_BY_BRAND: Record<typeof BRAND_ID, BlogPost[]> = {
  watermarkremoverpro: [...WRP_POSTS_A, ...WRP_POSTS_B, ...WRP_POSTS_C],
  neverprompted: NEVERPROMPTED_POSTS,
}

export const BLOG_POSTS = POSTS_BY_BRAND[BRAND_ID]

export const findPost = (slug: string) => BLOG_POSTS.find((p) => p.slug === slug)

export const postsByCategory = (category: (typeof BLOG_POSTS)[number]['category']) =>
  BLOG_POSTS.filter((p) => p.category === category)

/**
 * The categories, and the URL slug each one is served at.
 *
 * One mapping, used by the category route's generateStaticParams, by the
 * index's filter links and by the sitemap, so a category cannot end up
 * linked at a URL that doesn't render or prerendered at a URL nothing links
 * to.
 */
export const BLOG_CATEGORIES = ['Academy', 'News', 'Reviews'] as const

/**
 * How a category badge is coloured, in one place.
 *
 * The index and the post renderer both draw this badge, and before this
 * constant existed they each held their own copy in a different shape.
 */
export const CATEGORY_TONE: Record<BlogCategoryName, string> = {
  Academy: 'border-seal-200 bg-seal-50 text-seal-700',
  News: 'border-signal-200 bg-signal-100 text-signal-700',
  Reviews: 'border-ink-200 bg-ink-100 text-ink-700',
}

export const categorySlug = (category: BlogCategoryName): string => category.toLowerCase()

export const categoryFromSlug = (slug: string): BlogCategoryName | undefined =>
  BLOG_CATEGORIES.find((c) => categorySlug(c) === slug)

type BlogCategoryName = (typeof BLOG_CATEGORIES)[number]
