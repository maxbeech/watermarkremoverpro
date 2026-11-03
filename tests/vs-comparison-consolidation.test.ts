import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { pagesInGroup } from '@/content/pages'
import { BLOG_POSTS_B as WRP_POSTS_B } from '@/content/watermarkremoverpro/blog-posts-b'
import { BLOG_POSTS_C as WRP_POSTS_C } from '@/content/watermarkremoverpro/blog-posts-c'

/**
 * The 2026-11-03 lifecycle pass folded the template comparison page
 * `/vs/gptzero` into the GPTZero review (`/blog/gptzero-review-false-positives`),
 * which already carries its keyed-test material. These checks pin that outcome:
 * the comparison page is no longer generated, no internal link points at it,
 * and its URL answers a 301 to the review. See CHANGELOG.md.
 */

const MERGED_VS_SLUG = 'gptzero'
const SURVIVING_PATH = '/blog/gptzero-review-false-positives'
const NEXT_CONFIG_PATH = fileURLToPath(new URL('../next.config.ts', import.meta.url))

describe('vs/gptzero: the comparison page is merged into the GPTZero review', () => {
  it('no longer generates a /vs/gptzero comparison page', () => {
    const slugs = pagesInGroup('vs').map((page) => page.slug)
    expect(slugs, `merged vs slug "${MERGED_VS_SLUG}" must not be a live comparison page`).not.toContain(MERGED_VS_SLUG)
  })

  it('keeps the other comparison pages', () => {
    const slugs = pagesInGroup('vs').map((page) => page.slug)
    expect(slugs).toEqual(expect.arrayContaining(['turnitin-ai-detector', 'originality-ai', 'ai-humanizer-tools']))
  })

  it('no blog post links internally to /vs/gptzero', () => {
    const posts = [...WRP_POSTS_B, ...WRP_POSTS_C]
    const offenders = posts
      .flatMap((post) => post.internalLinks.filter((link) => link.href === `/vs/${MERGED_VS_SLUG}`).map(() => post.slug))
    expect(offenders, `internal links still point at /vs/${MERGED_VS_SLUG} from: ${offenders.join(', ')}`).toEqual([])
  })

  it('the GPTZero review does not link to itself', () => {
    const review = WRP_POSTS_B.find((post) => post.slug === 'gptzero-review-false-positives')
    expect(review, 'missing gptzero-review-false-positives').toBeDefined()
    const selfLinks = review!.internalLinks.filter((link) => link.href === SURVIVING_PATH)
    expect(selfLinks, 'the survivor should not link to its own URL').toEqual([])
  })

  it('/vs/gptzero has a 301 redirect to the GPTZero review in next.config.ts', () => {
    const config = readFileSync(NEXT_CONFIG_PATH, 'utf8')
    const source = `source: '/vs/${MERGED_VS_SLUG}'`
    const index = config.indexOf(source)
    expect(index, `expected a redirect rule with ${source} in next.config.ts`).toBeGreaterThanOrEqual(0)
    const rule = config.slice(index, config.indexOf('},', index))
    expect(rule, `expected ${source} to redirect to ${SURVIVING_PATH}`).toContain(`destination: '${SURVIVING_PATH}'`)
    expect(rule, `expected ${source} to answer 301, not Next's default 308`).toContain('statusCode: 301')
  })
})
