import { afterEach, describe, expect, it, vi } from 'vitest'
import { LONG_TAIL_PAGES as WRP_PAGES } from '@/content/watermarkremoverpro/pages'
import { LONG_TAIL_PAGES as NEVERPROMPTED_PAGES } from '@/content/neverprompted/pages'
import { BLOG_POSTS_A as WRP_POSTS_A } from '@/content/watermarkremoverpro/blog-posts-a'
import { BLOG_POSTS_B as WRP_POSTS_B } from '@/content/watermarkremoverpro/blog-posts-b'
import { BLOG_POSTS_C as WRP_POSTS_C } from '@/content/watermarkremoverpro/blog-posts-c'
import { BLOG_POSTS as NEVERPROMPTED_POSTS } from '@/content/neverprompted/blog-posts'

/**
 * Two brands, one product (see src/lib/site.ts). The risk this file guards
 * against isn't a typo, it's a copy-paste: a page or post written for one
 * brand, reused for the other without actually being rewritten, which is
 * exactly the thin/duplicate-content failure this whole split exists to
 * avoid. So this checks the rendered content itself, not source comments (a
 * comment cross-referencing the sibling brand to explain why its content
 * differs is fine; a page that talks about the wrong brand to its own reader
 * is not).
 */

const ORIGINAL_BRAND = process.env.NEXT_PUBLIC_BRAND

afterEach(() => {
  if (ORIGINAL_BRAND === undefined) delete process.env.NEXT_PUBLIC_BRAND
  else process.env.NEXT_PUBLIC_BRAND = ORIGINAL_BRAND
  vi.resetModules()
})

describe('brand resolution (src/lib/site.ts)', () => {
  it('throws on an unknown NEXT_PUBLIC_BRAND rather than falling back silently', async () => {
    vi.resetModules()
    process.env.NEXT_PUBLIC_BRAND = 'not-a-real-brand'
    await expect(import('@/lib/site')).rejects.toThrow(/not a known brand/)
  })

  it('defaults to watermarkremoverpro when unset, reproducing the original single-brand behaviour', async () => {
    vi.resetModules()
    delete process.env.NEXT_PUBLIC_BRAND
    const { SITE, BRAND_ID } = await import('@/lib/site')
    expect(BRAND_ID).toBe('watermarkremoverpro')
    expect(SITE.name).toBe('WatermarkRemoverPro')
    expect(SITE.url).toBe('https://www.watermarkremoverpro.com')
  })

  it('resolves neverprompted to its own name, url and contact address', async () => {
    vi.resetModules()
    process.env.NEXT_PUBLIC_BRAND = 'neverprompted'
    const { SITE, BRAND_ID } = await import('@/lib/site')
    expect(BRAND_ID).toBe('neverprompted')
    expect(SITE.name).toBe('NeverPrompted')
    expect(SITE.url).toBe('https://www.neverprompted.com')
    expect(SITE.contactEmail).toBe('hello@neverprompted.com')
  })
})

describe('brand content does not leak into the other brand', () => {
  const wrpContent = JSON.stringify([...WRP_PAGES, ...WRP_POSTS_A, ...WRP_POSTS_B, ...WRP_POSTS_C])
  const neverpromptedContent = JSON.stringify([...NEVERPROMPTED_PAGES, ...NEVERPROMPTED_POSTS])

  it("WatermarkRemoverPro's content never mentions NeverPrompted", () => {
    expect(/neverprompted/i.test(wrpContent)).toBe(false)
  })

  it("NeverPrompted's content never mentions WatermarkRemoverPro", () => {
    expect(/watermarkremoverpro/i.test(neverpromptedContent)).toBe(false)
  })
})
