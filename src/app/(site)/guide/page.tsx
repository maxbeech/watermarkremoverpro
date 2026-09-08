import type { Metadata } from 'next'
import { GroupIndex } from '@/components/group-index'

export const metadata: Metadata = {
  title: 'Guides to AI provenance marks and detection',
  description: 'How provenance marks work, why detectors produce false positives, and what evidence establishes authorship. Written to be read by someone who has just been accused of something.',
  alternates: { canonical: '/guide' },
}

export default function Page() {
  return <GroupIndex group="guide" title="Guides" intro="How provenance marks work, why detectors produce false positives, and what evidence establishes authorship. Written to be read by someone who has just been accused of something." />
}
