import { notFound } from 'next/navigation'
import { LongTailPageView, longTailMetadata } from '@/components/long-tail-page'
import { findPage, pagesInGroup } from '@/content/pages'

export const dynamicParams = false

export function generateStaticParams() {
  return pagesInGroup('for').map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return longTailMetadata('for', slug)
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = findPage('for', slug)
  if (!page) notFound()
  return <LongTailPageView page={page} />
}
