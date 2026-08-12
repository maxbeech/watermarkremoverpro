import { notFound } from 'next/navigation'
import { BlogPostView, blogPostMetadata } from '@/components/blog-post-view'
import { BLOG_POSTS, findPost } from '@/content/blog'

export const dynamicParams = false

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return blogPostMetadata(slug)
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = findPost(slug)
  if (!post) notFound()
  return <BlogPostView post={post} />
}
