import type { Metadata } from 'next'
import { GroupIndex } from '@/components/group-index'

export const metadata: Metadata = {
  title: 'Languages WatermarkRemoverPro supports',
  description: 'Each supported language has its own reference baseline, measured from real prose in that language. A language without a measured baseline is reported as unsupported rather than analysed against a substitute.',
  alternates: { canonical: '/in' },
}

export default function Page() {
  return <GroupIndex group="in" title="Supported languages" intro="Each supported language has its own reference baseline, measured from real prose in that language. A language without a measured baseline is reported as unsupported rather than analysed against a substitute." />
}
