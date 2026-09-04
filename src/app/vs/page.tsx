import type { Metadata } from 'next'
import { GroupIndex } from '@/components/group-index'

export const metadata: Metadata = {
  title: 'MarkWitness compared to AI detectors and AI humanizers',
  description: 'MarkWitness gets compared to AI detectors and AI humanizer tools constantly, and none of them are substitutes. These pages are precise about what each tool measures or changes, and for whom.',
  alternates: { canonical: '/vs' },
}

export default function Page() {
  return <GroupIndex group="vs" title="How MarkWitness compares" intro="MarkWitness gets compared to AI detectors and AI humanizer tools constantly, and none of them are substitutes. These pages are precise about what each tool measures or changes, and for whom." />
}
