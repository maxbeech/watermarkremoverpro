import { BRAND_ID } from '@/lib/site'
import type { LongTailPage } from './pages-types'
import { LONG_TAIL_PAGES as WATERMARKREMOVERPRO_PAGES } from './watermarkremoverpro/pages'
import { LONG_TAIL_PAGES as NEVERPROMPTED_PAGES } from './neverprompted/pages'

export type { Section, LongTailPage } from './pages-types'

/**
 * One typed source per brand feeding /for/*, /vs/*, /guide/* and /in/*. Kept
 * as data rather than as a directory of near-identical page components so
 * that a change to the disclaimer wording, the CTA or the structured data
 * lands on every page at once. The usual failure of a programmatic SEO set is
 * twenty pages that disagree about what the product does.
 *
 * BRAND_ID is resolved once at build time (see src/lib/site.ts), so this
 * picks one brand's array and the route files below never need to know two
 * brands exist.
 */
const PAGES_BY_BRAND: Record<typeof BRAND_ID, LongTailPage[]> = {
  watermarkremoverpro: WATERMARKREMOVERPRO_PAGES,
  neverprompted: NEVERPROMPTED_PAGES,
}

export const LONG_TAIL_PAGES: LongTailPage[] = PAGES_BY_BRAND[BRAND_ID]

export const pagesInGroup = (group: LongTailPage['group']): LongTailPage[] =>
  LONG_TAIL_PAGES.filter((p) => p.group === group)

export const findPage = (group: LongTailPage['group'], slug: string): LongTailPage | undefined =>
  LONG_TAIL_PAGES.find((p) => p.group === group && p.slug === slug)
