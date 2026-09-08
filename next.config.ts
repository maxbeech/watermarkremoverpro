import type { NextConfig } from 'next'

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
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'watermarkremoverpro.com' }],
        destination: 'https://www.watermarkremoverpro.com/:path*',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
