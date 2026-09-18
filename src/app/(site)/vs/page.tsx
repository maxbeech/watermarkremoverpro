import type { Metadata } from 'next'
import { GroupIndex } from '@/components/group-index'
import { SITE } from '@/lib/site'

export const metadata: Metadata = {
  title: `${SITE.name} compared to AI detectors and AI humanizers`,
  description: `${SITE.name} gets compared to AI detectors and AI humanizer tools constantly, and none of them are substitutes. These pages are precise about what each tool measures or changes, and for whom.`,
  alternates: { canonical: '/vs' },
}

export default function Page() {
  return (
    <GroupIndex
      group="vs"
      title={`How ${SITE.name} compares`}
      intro={`${SITE.name} gets compared to AI detectors and AI humanizer tools constantly, and none of them are substitutes. These pages are precise about what each tool measures or changes, and for whom.`}
    />
  )
}
