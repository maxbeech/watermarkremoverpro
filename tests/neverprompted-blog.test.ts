import { describe, expect, it } from 'vitest'
import { BLOG_POSTS } from '@/content/neverprompted/blog-posts'

describe('NeverPrompted launch blog calendar', () => {
  it('ships fifteen distinct, indexable posts across the three editorial categories', () => {
    expect(BLOG_POSTS).toHaveLength(15)
    expect(new Set(BLOG_POSTS.map((post) => post.slug)).size).toBe(15)
    expect(new Set(BLOG_POSTS.map((post) => post.primaryKeyword)).size).toBe(15)
    expect(new Set(BLOG_POSTS.map((post) => post.category))).toEqual(
      new Set(['Academy', 'News', 'Reviews'])
    )
  })

  it('keeps launch dates within the requested publication week and retains SEO essentials', () => {
    for (const post of BLOG_POSTS) {
      expect(post.publishedAt >= '2026-10-01' && post.publishedAt <= '2026-10-07').toBe(true)
      expect(post.metaDescription.length).toBeLessThan(155)
      expect(post.heroImage.alt.toLowerCase()).toContain(post.primaryKeyword)
      expect(post.faq.length).toBeGreaterThanOrEqual(3)
      expect(post.internalLinks.length).toBeGreaterThanOrEqual(3)
      expect(post.externalLinks.length).toBeGreaterThanOrEqual(1)
    }
  })
})
