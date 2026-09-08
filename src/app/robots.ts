import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // The dashboard is per-account and the auth endpoints are not content.
        //
        // /app is deliberately NOT listed. It is kept out of the index by the
        // `robots: { index: false }` on the route's own metadata, and a
        // Disallow here would be self-defeating twice over: a crawler told not
        // to fetch the page never reads the noindex tag on it, and a prefix
        // rule of `/app` also matches `/apple-icon.png`, which is a real asset
        // that should be fetchable.
        disallow: ['/dashboard', '/api/'],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  }
}
