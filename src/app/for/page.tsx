import type { Metadata } from 'next'
import { GroupIndex } from '@/components/group-index'

export const metadata: Metadata = {
  title: 'Who MarkWitness is for',
  description: 'MarkWitness is built for the person on the receiving end of an accusation. These pages cover the situations it comes up in most, and what evidence actually helps in each.',
  alternates: { canonical: '/for' },
}

export default function Page() {
  return <GroupIndex group="for" title="Who MarkWitness is for" intro="MarkWitness is built for the person on the receiving end of an accusation. These pages cover the situations it comes up in most, and what evidence actually helps in each." />
}
