import type { LongTailPage } from '../pages-types'
import { AUDIENCES } from './audiences'
import { COMPARISONS } from './comparisons'
import { GUIDES } from './guides'
import { LANGUAGES } from './languages'

/**
 * NeverPrompted's long-tail content: /for/*, /vs/*, /guide/* and /in/*.
 *
 * Written fresh in NeverPrompted's own register (plain-English, proactive,
 * "sound like yourself"), not a reskin of watermarkremoverpro/pages.ts. See
 * docs/neverprompted_launch_strategy.md, Part B, for why.
 */
export const LONG_TAIL_PAGES: LongTailPage[] = [...AUDIENCES, ...COMPARISONS, ...GUIDES, ...LANGUAGES]
