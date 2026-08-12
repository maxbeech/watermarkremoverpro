/**
 * The blog's content schema. Posts are data, the same way the long-tail pages
 * in `pages.ts` are data: one typed shape, one renderer, so that fifteen posts
 * cannot quietly disagree about which fields are required or how a stated
 * limit gets phrased. See `blog.ts` for the posts themselves and
 * `blog-post-view.tsx` for the renderer.
 */

export type BlogCategory = 'Academy' | 'News' | 'Reviews'

export type BlogFormat =
  | 'how-to'
  | 'deep-dive'
  | 'listicle'
  | 'review'
  | 'data-study'
  | 'case-study'
  | 'skyscraper'

export type BlogIntent = 'informational' | 'navigational' | 'transactional' | 'commercial'

export interface BlogSection {
  id: string
  heading: string
  body: string[]
}

export interface BlogTable {
  caption: string
  headers: string[]
  rows: string[][]
}

export interface BlogQuote {
  quote: string
  attribution: string
  role: string
}

export interface BlogFaqItem {
  question: string
  answer: string
}

export interface BlogLink {
  href: string
  label: string
}

export interface BlogImage {
  /** Unsplash `regular` delivery URL. */
  src: string
  /** Descriptive alt text. Must contain the post's primary keyword. */
  alt: string
  /** Unsplash photo id, used to build the credit link (unsplash.com/photos/<id>). */
  unsplashId: string
}

export interface BlogReviewRating {
  itemName: string
  ratingValue: number
  bestRating: number
  summary: string
}

export interface BlogPost {
  slug: string
  title: string
  h1: string
  metaDescription: string
  category: BlogCategory
  format: BlogFormat
  intent: BlogIntent
  /** ISO date, e.g. '2026-08-07'. */
  publishedAt: string
  author: string
  primaryKeyword: string
  supportingKeywords: string[]
  longTailKeywords: string[]
  heroImage: BlogImage
  /** Problem -> Promise -> Proof, <=120 words total. */
  intro: string[]
  takeaways: string[]
  sections: BlogSection[]
  table?: BlogTable
  quote: BlogQuote
  pitfalls: string[]
  faq: BlogFaqItem[]
  internalLinks: BlogLink[]
  externalLinks: BlogLink[]
  /** Extra structured-data type layered on top of the always-present BlogPosting + FAQPage. */
  schemaType: 'HowTo' | 'Review' | 'none'
  reviewRating?: BlogReviewRating
}
