import type { Metadata } from 'next'
import Link from 'next/link'
import { MirrorBanner } from '@/components/mirror-banner'
import { SITE } from '@/lib/site'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: {
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    type: 'website',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <MirrorBanner />
        <header className="border-b border-ink-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
            <Link href="/" className="group flex items-baseline gap-2">
              <span className="font-serif text-xl font-semibold tracking-tight text-ink-900">
                {SITE.name}
              </span>
              <span className="hidden text-xs text-ink-400 sm:inline">provenance-mark diagnostic</span>
            </Link>
            <nav className="flex items-center gap-5 text-sm text-ink-600">
              <Link href="/check" className="hover:text-ink-900">Check</Link>
              <Link href="/method" className="hidden hover:text-ink-900 sm:inline">Method</Link>
              <Link href="/verify" className="hidden hover:text-ink-900 sm:inline">Verify</Link>
              <Link href="/docs/api" className="hidden hover:text-ink-900 sm:inline">API</Link>
              <Link href="/pricing" className="hover:text-ink-900">Pricing</Link>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className="mt-20 border-t border-ink-200 bg-white">
          <div className="mx-auto max-w-5xl px-5 py-10 text-sm text-ink-500">
            <div className="grid gap-8 sm:grid-cols-3">
              <div>
                <p className="font-serif text-base text-ink-800">{SITE.name}</p>
                <p className="mt-2 max-w-xs leading-relaxed">
                  A diagnostic for your own writing. It never removes, weakens or rewrites around a
                  provenance mark — on any tier, for any caller.
                </p>
              </div>
              <div className="space-y-2">
                <p className="font-medium text-ink-700">Product</p>
                <p><Link href="/check" className="hover:text-ink-900">Run a check</Link></p>
                <p><Link href="/method" className="hover:text-ink-900">How it works</Link></p>
                <p><Link href="/verify" className="hover:text-ink-900">Verify the detector</Link></p>
                <p><Link href="/limits" className="hover:text-ink-900">Stated limits</Link></p>
              </div>
              <div className="space-y-2">
                <p className="font-medium text-ink-700">For machines</p>
                <p><Link href="/docs/api" className="hover:text-ink-900">JSON API</Link></p>
                <p><Link href="/docs/mcp" className="hover:text-ink-900">MCP server</Link></p>
                <p><a href="/llms.txt" className="hover:text-ink-900">llms.txt</a></p>
                <p><a href="/pricing.json" className="hover:text-ink-900">pricing.json</a></p>
              </div>
            </div>
            <p className="mt-10 border-t border-ink-100 pt-6 text-xs text-ink-400">
              A detected mark is not proof of authorship. An absent mark is not proof of human
              authorship. {SITE.name} reports what it measured and names what it could not measure.
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
