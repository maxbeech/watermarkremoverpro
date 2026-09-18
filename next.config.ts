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
  // The apex domain is registered alongside www on Vercel so it still resolves,
  // but www is canonical (matches SITE.url, which Better Auth, Stripe checkout
  // and every page's metadata read from). 308 preserves the request method, so
  // this also covers the Stripe webhook POST if it's ever hit on the apex.
  //
  // Each brand is built and deployed as its own Vercel project, so this file
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

export default nextConfig
