import { withSentryConfig } from '@sentry/nextjs'
import type { NextConfig } from 'next'

/**
 * Deliberately not imported from src/lib/site.ts: this file is loaded outside
 * the app's normal module resolution, before the bundler is up, so it keeps
 * its own tiny brand->domain map rather than pulling in that module's chain.
 * Brand ids and their domains must still match src/lib/site.ts's BRAND_DOMAINS.
 */
const BRAND_DOMAINS: Record<string, string> = {
  watermarkremoverpro: 'watermarkremoverpro.com',
  neverprompted: 'neverprompted.com',
}
const activeDomain = BRAND_DOMAINS[process.env.NEXT_PUBLIC_BRAND?.trim() || 'watermarkremoverpro']

/**
 * Each brand reports to its own Sentry project (it is a separate deployment with
 * its own DSN). The brand is a build-time choice, so the project is too;
 * SENTRY_PROJECT overrides it. Kept here for the same reason as the map above.
 */
const BRAND_SENTRY_PROJECTS: Record<string, string> = {
  watermarkremoverpro: 'watermarkremoverpro_web',
  neverprompted: 'neverprompted_web',
}
const sentryProject =
  process.env.SENTRY_PROJECT || BRAND_SENTRY_PROJECTS[process.env.NEXT_PUBLIC_BRAND?.trim() || 'watermarkremoverpro']

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Blog post hero images only. The free check's privacy contract is
    // unaffected: this is a marketing asset host, not a document upload path.
    remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }],
  },
  // The free check runs entirely in the browser. Nothing here may introduce a
  // rewrite or proxy that would send document text to the origin, and that would
  // break the product's core promise, which is tested in
  // src/lib/detector/__tests__/privacy-contract.test.ts.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ]
  },
  // The apex domain is attached alongside www so it still resolves,
  // but www is canonical (matches SITE.url, which Better Auth, Stripe checkout
  // and every page's metadata read from). 308 preserves the request method, so
  // this also covers the Stripe webhook POST if it's ever hit on the apex.
  //
  // Each brand is built and deployed as its own Helm7 product, so this file
  // only ever sees one brand's domain per build (NEXT_PUBLIC_BRAND): it does
  // not need to redirect both brands' apex domains in one deployment.
  async redirects() {
    if (!activeDomain) return []
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: activeDomain }],
        destination: `https://www.${activeDomain}/:path*`,
        permanent: true,
      },
    ]
  },
}

/**
 * Sentry wraps the build to upload source maps, so a production stack trace
 * points at real lines. The upload is skipped without SENTRY_AUTH_TOKEN, which
 * keeps `npm run build` working for anyone building without Sentry configured.
 *
 * `tunnelRoute: true` routes the browser SDK through our own domain on a path
 * picked at random per build, so an ad blocker does not silently drop reports
 * (a fixed "/monitoring" is on blocklists).
 */
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || 'maxed-labs',
  project: sentryProject,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: true,
  sourcemaps: { deleteSourcemapsAfterUpload: true },
})
