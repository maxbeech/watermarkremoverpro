import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { BLOG_POSTS_A as WRP_POSTS_A } from '@/content/watermarkremoverpro/blog-posts-a'
import { BLOG_POSTS_B as WRP_POSTS_B } from '@/content/watermarkremoverpro/blog-posts-b'
import { BLOG_POSTS_C as WRP_POSTS_C } from '@/content/watermarkremoverpro/blog-posts-c'

/**
 * The content lifecycle pass (see CHANGELOG.md) merged two posts into the
 * GPTZero review, which is the surviving page for the AI-detector
 * false-positive cluster. These checks pin that outcome so a later edit cannot
 * quietly bring a merged post back, leave an internal link pointing at it, or
 * drop its 301.
 */

const WRP_POSTS = [...WRP_POSTS_A, ...WRP_POSTS_B, ...WRP_POSTS_C]
const SURVIVING_SLUG = 'gptzero-review-false-positives'
const MERGED_SLUGS = [
  'how-common-are-ai-detector-false-positives',
  'originality-ai-review-false-positives',
]

const NEXT_CONFIG_PATH = fileURLToPath(new URL('../next.config.ts', import.meta.url))

describe('blog consolidation: merged posts are gone and the survivor carries them', () => {
  it('keeps the surviving GPTZero review in the content source', () => {
    const slugs = WRP_POSTS.map((post) => post.slug)
    expect(slugs, `expected ${SURVIVING_SLUG} in the WatermarkRemoverPro posts`).toContain(SURVIVING_SLUG)
  })

  for (const slug of MERGED_SLUGS) {
    it(`no longer publishes ${slug} as a post`, () => {
      const slugs = WRP_POSTS.map((post) => post.slug)
      expect(slugs, `merged slug ${slug} must not be a live post`).not.toContain(slug)
    })
  }

  it('the surviving post absorbed the merged sections and FAQ questions', () => {
    const survivor = WRP_POSTS.find((post) => post.slug === SURVIVING_SLUG)
    expect(survivor, `missing ${SURVIVING_SLUG}`).toBeDefined()
    const sectionIds = survivor!.sections.map((section) => section.id)
    expect(sectionIds, 'expected the false-positive-figures section from the merged how-common post').toContain(
      'why-false-positive-figures-do-not-compare',
    )
    expect(sectionIds, 'expected the accuracy-vs-false-positive section from the merged Originality post').toContain(
      'accuracy-is-not-the-false-positive-rate',
    )
    const questions = survivor!.faq.map((item) => item.question)
    expect(questions, 'expected the accuracy-vs-FPR FAQ from the merged posts').toContain(
      "Is GPTZero's 99% accuracy the same as a 1% false positive rate?",
    )
  })

  it('no WatermarkRemoverPro post links internally to a merged slug', () => {
    const offenders: string[] = []
    for (const post of WRP_POSTS) {
      for (const link of post.internalLinks) {
        for (const slug of MERGED_SLUGS) {
          if (link.href === `/blog/${slug}`) offenders.push(`${post.slug} -> ${link.href}`)
        }
      }
    }
    expect(offenders, `internal links still point at merged posts: ${offenders.join(', ')}`).toEqual([])
  })

  it('every merged slug has a 301 redirect to the surviving post in next.config.ts', () => {
    const config = readFileSync(NEXT_CONFIG_PATH, 'utf8')
    for (const slug of MERGED_SLUGS) {
      const source = `source: '/blog/${slug}'`
      const destination = `destination: '/blog/${SURVIVING_SLUG}'`
      const index = config.indexOf(source)
      expect(index, `expected a redirect rule with ${source} in next.config.ts`).toBeGreaterThanOrEqual(0)
      const rule = config.slice(index, config.indexOf('},', index))
      expect(rule, `expected ${source} to redirect to the surviving post`).toContain(destination)
      expect(rule, `expected ${source} to answer 301, not Next's default 308`).toContain('statusCode: 301')
    }
  })
})
