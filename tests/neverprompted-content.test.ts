import { describe, expect, it } from 'vitest'
import { LONG_TAIL_PAGES } from '@/content/neverprompted/pages'

const words = (value: string) => value.trim().split(/\s+/).filter(Boolean).length

describe('NeverPrompted public content', () => {
  it('keeps every public long-tail page above the thin-content floor', () => {
    const shortPages = LONG_TAIL_PAGES.map((page) => ({
      path: `/${page.group}/${page.slug}`,
      count: words([
        page.title,
        page.intro,
        ...page.sections.flatMap((section) => [section.heading, ...section.body]),
        ...page.faq.flatMap((item) => [item.question, item.answer]),
      ].join(' ')),
    })).filter((page) => page.count < 500)

    expect(shortPages, JSON.stringify(shortPages, null, 2)).toEqual([])
  })

  it('keeps each page distinct in its title and canonical slug', () => {
    const slugs = LONG_TAIL_PAGES.map((page) => `${page.group}/${page.slug}`)
    const titles = LONG_TAIL_PAGES.map((page) => page.title)
    expect(new Set(slugs).size).toBe(slugs.length)
    expect(new Set(titles).size).toBe(titles.length)
  })
})
