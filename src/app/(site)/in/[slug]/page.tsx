import { notFound } from 'next/navigation'
import { LongTailPageView, longTailMetadata } from '@/components/long-tail-page'
import { findPage, pagesInGroup } from '@/content/pages'

export const dynamicParams = false
// One week. Source of truth: STATIC_REVALIDATE_SECONDS in src/lib/site.ts;
// Next requires this to be a statically analysable literal.
export const revalidate = 604800

export function generateStaticParams() {
  return pagesInGroup('in').map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return longTailMetadata('in', slug)
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = findPage('in', slug)
  if (!page) notFound()
  return <LongTailPageView page={page} />
}
