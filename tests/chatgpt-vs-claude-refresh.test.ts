import { describe, expect, it } from 'vitest'
import { LONG_TAIL_PAGES } from '@/content/pages'

/**
 * The 2026-11-10 lifecycle pass refreshed `/guide/chatgpt-vs-claude-watermark`.
 * The earlier copy said Anthropic "applies its Claude watermark worldwide". The
 * TechCrunch report of Anthropic's 11 August 2026 support-page update does not
 * say that: it says models released after 2 August 2026 carry the mark, older
 * models are being extended, and the mark applies at model level across Claude
 * products. These checks pin the corrected wording and the sources section.
 * See CHANGELOG.md.
 */

const SLUG = 'chatgpt-vs-claude-watermark'

function getPage() {
  const page = LONG_TAIL_PAGES.find((p) => p.group === 'guide' && p.slug === SLUG)
  if (!page) throw new Error(`guide page "${SLUG}" is missing from LONG_TAIL_PAGES`)
  return page
}

/** Every string a visitor or a search snippet can read from this page. */
function allText(page: ReturnType<typeof getPage>): string {
  return [
    page.metaTitle,
    page.metaDescription,
    page.intro,
    ...page.sections.flatMap((s) => [s.heading, ...s.body]),
    ...page.faq.flatMap((f) => [f.question, f.answer]),
  ].join('\n')
}

describe('guide/chatgpt-vs-claude-watermark: refreshed scope and sources', () => {
  it('does not claim Anthropic says its mark applies worldwide', () => {
    const text = allText(getPage())
    expect(text, 'the unsupported affirmative "worldwide" claim must be gone').not.toContain('said it applies worldwide.')
    expect(text).not.toContain('applies its Claude watermark worldwide')
  })

  it('states the model-release scope that TechCrunch reports', () => {
    const page = getPage()
    const scope = page.sections.find((s) => s.heading.startsWith('Scope'))
    expect(scope, 'scope section must exist').toBeDefined()
    expect(scope!.body.join(' ')).toContain('models released after 2 August 2026')
  })

  it('carries a sources section that cites the primary coverage it relies on', () => {
    const page = getPage()
    const sources = page.sections.find((s) => s.heading === 'Sources, and what is not yet confirmed')
    expect(sources, 'sources section must exist').toBeDefined()
    const body = sources!.body.join(' ')
    expect(body).toContain('https://techcrunch.com/2026/08/11/anthropic-says-it-will-watermark-text-generated-by-its-ai-models/')
    expect(body).toContain('https://forklog.com/en/openai-to-introduce-text-watermarking-in-the-eu/')
  })

  it('records the dated detector status and the open editing question', () => {
    const text = allText(getPage())
    expect(text).toContain('Status as of 10 November 2026')
    expect(text).toContain('how much editing removes the Claude mark')
  })

  it('links to the internal guides it now points at', () => {
    const text = allText(getPage())
    expect(text).toContain('/guide/textgrain')
    expect(text).toContain('/guide/does-editing-remove-a-watermark')
  })
})
