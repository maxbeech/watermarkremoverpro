import type { Metadata } from 'next'
import { GroupIndex } from '@/components/group-index'
import { SITE, BRAND_ID } from '@/lib/site'

/**
 * This page's copy is genuinely brand-specific, not a name swap: WatermarkRemoverPro
 * leads with defending against an accusation, NeverPrompted leads with sounding
 * like yourself. See docs/neverprompted_launch_strategy.md, Part B1.
 */
const INTRO =
  BRAND_ID === 'neverprompted'
    ? `${SITE.name} is built for people who want their own writing to sound like them, not like a prompt output. These pages cover the situations that comes up in most, and what actually helps in each.`
    : `${SITE.name} is built for the person on the receiving end of an accusation. These pages cover the situations it comes up in most, and what evidence actually helps in each.`

export const metadata: Metadata = {
  title: `Who ${SITE.name} is for`,
  description: INTRO,
  alternates: { canonical: '/for' },
}

export default function Page() {
  return <GroupIndex group="for" title={`Who ${SITE.name} is for`} intro={INTRO} />
}
