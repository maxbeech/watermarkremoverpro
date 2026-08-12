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
}

export default nextConfig
