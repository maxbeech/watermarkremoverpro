import { BLOG_POSTS_A } from './blog-posts-a'
import { BLOG_POSTS_B } from './blog-posts-b'
import { BLOG_POSTS_C } from './blog-posts-c'

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
 * The blog's content source, assembled from three data files the same way
 * `pages.ts` is the single source for the pSEO pages. One post is one object;
 * the renderer in `blog-post-view.tsx` is the only thing that decides how it
 * gets drawn.
 */
export const BLOG_POSTS = [...BLOG_POSTS_A, ...BLOG_POSTS_B, ...BLOG_POSTS_C]

export const findPost = (slug: string) => BLOG_POSTS.find((p) => p.slug === slug)

export const postsByCategory = (category: (typeof BLOG_POSTS)[number]['category']) =>
  BLOG_POSTS.filter((p) => p.category === category)
