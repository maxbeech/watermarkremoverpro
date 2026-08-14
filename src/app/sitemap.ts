import type { MetadataRoute } from 'next'
import { LONG_TAIL_PAGES } from '@/content/pages'
import { BLOG_POSTS } from '@/content/blog'
import { SITE } from '@/lib/site'

/** Built from the same content source the pages render from, so a new long-tail
 *  page cannot ship unlisted. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const fixed = [
    { path: '', priority: 1 },
    { path: '/check', priority: 0.9 },
    { path: '/calibrator', priority: 0.85 },
    { path: '/method', priority: 0.8 },
    { path: '/verify', priority: 0.7 },
    { path: '/limits', priority: 0.7 },
    { path: '/pricing', priority: 0.7 },
    { path: '/docs', priority: 0.6 },
    { path: '/docs/api', priority: 0.6 },
    { path: '/docs/mcp', priority: 0.6 },
    { path: '/for', priority: 0.5 },
    { path: '/vs', priority: 0.5 },
    { path: '/guide', priority: 0.5 },
    { path: '/in', priority: 0.5 },
    { path: '/blog', priority: 0.6 },
  ]

  return [
    ...fixed.map((f) => ({
      url: `${SITE.url}${f.path}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: f.priority,
    })),
    ...LONG_TAIL_PAGES.map((p) => ({
      url: `${SITE.url}/${p.group}/${p.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    ...BLOG_POSTS.map((p) => ({
      url: `${SITE.url}/blog/${p.slug}`,
      lastModified: new Date(`${p.publishedAt}T09:00:00Z`),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ]
}
