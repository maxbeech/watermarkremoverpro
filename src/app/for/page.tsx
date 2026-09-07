import type { Metadata } from 'next'
import { GroupIndex } from '@/components/group-index'

export const metadata: Metadata = {
  title: 'Who WatermarkRemoverPro is for',
  description: 'WatermarkRemoverPro is built for the person on the receiving end of an accusation. These pages cover the situations it comes up in most, and what evidence actually helps in each.',
  alternates: { canonical: '/for' },
}

export default function Page() {
  return <GroupIndex group="for" title="Who WatermarkRemoverPro is for" intro="WatermarkRemoverPro is built for the person on the receiving end of an accusation. These pages cover the situations it comes up in most, and what evidence actually helps in each." />
}
