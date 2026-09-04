import type { Metadata } from 'next'
import Link from 'next/link'
import { Analytics } from '@vercel/analytics/next'
import { MirrorBanner } from '@/components/mirror-banner'
import { BandRule } from '@/components/brand/band'
import { SITE } from '@/lib/site'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} · ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: {
    title: `${SITE.name} · ${SITE.tagline}`,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    type: 'website',
  },
  robots: { index: true, follow: true },
}

const NAV = [
  { href: '/rewrite', label: 'Rewrite', always: true },
  { href: '/check', label: 'Check', always: true },
  { href: '/method', label: 'Method', always: false },
  { href: '/verify', label: 'Verify', always: false },
  { href: '/blog', label: 'Blog', always: false },
  { href: '/docs/api', label: 'API', always: false },
  { href: '/pricing', label: 'Pricing', always: true },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <MirrorBanner />

        <header className="sticky top-0 z-40 border-b border-ink-200 bg-white/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-3.5">
            <Link href="/" className="group flex items-center gap-3">
              {/* The logo lockup is the signature band, at type size. */}
              <span className="hidden w-8 shrink-0 sm:block">
                <BandRule at={70} />
              </span>
              <span className="flex items-baseline gap-2">
                <span className="font-serif text-lg font-semibold tracking-tight text-ink-900 transition-colors group-hover:text-seal-700">
                  {SITE.name}
                </span>
                <span className="t-eyebrow hidden text-ink-400 md:inline">
                  on-device rewrite &amp; provenance diagnostic
                </span>
              </span>
            </Link>

            <nav className="flex items-center gap-1 text-sm">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    'rounded-[3px] px-2.5 py-1.5 text-ink-600 transition-colors duration-150 ' +
                    'hover:bg-seal-50 hover:text-seal-700 ' +
                    (item.always ? '' : 'hidden sm:inline-block')
                  }
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className="border-t border-ink-200 bg-ink-900 text-ink-300">
          <div className="mx-auto max-w-6xl px-5 py-14 text-sm">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              <div className="lg:col-span-2">
                <p className="font-serif text-lg text-white">{SITE.name}</p>
                <BandRule at={70} tone="signal" className="mt-4 max-w-[6rem]" />
                <p className="mt-5 max-w-sm leading-relaxed text-ink-400">
                  Checks your own writing for a provenance mark, then rewrites it on your device to
                  reduce detectable AI-style evidence. It cannot guarantee defeating a model
                  vendor&apos;s undisclosed watermark; nothing here is sent to a server, on any tier.
                </p>
              </div>
              <div className="space-y-2.5">
                <p className="t-eyebrow text-ink-500">Product</p>
                <FooterLink href="/rewrite">Reduce evidence</FooterLink>
                <FooterLink href="/check">Run a check</FooterLink>
                <FooterLink href="/method">How it works</FooterLink>
                <FooterLink href="/verify">Verify the detector</FooterLink>
                <FooterLink href="/limits">Stated limits</FooterLink>
                <FooterLink href="/pricing">Pricing</FooterLink>
                <FooterLink href="/blog">Blog</FooterLink>
              </div>
              <div className="space-y-2.5">
                <p className="t-eyebrow text-ink-500">For machines</p>
                <FooterLink href="/docs/api">JSON API</FooterLink>
                <FooterLink href="/docs/mcp">MCP server</FooterLink>
                <FooterLink href="/llms.txt" external>
                  llms.txt
                </FooterLink>
                <FooterLink href="/pricing.json" external>
                  pricing.json
                </FooterLink>
              </div>
            </div>

            <p className="mt-12 border-t border-ink-800 pt-6 text-xs leading-relaxed text-ink-500">
              A detected mark is not proof of authorship. An absent mark is not proof of human
              authorship. {SITE.name} reports what it measured and names what it could not measure.
            </p>
          </div>
        </footer>

        <Analytics />
      </body>
    </html>
  )
}

function FooterLink({
  href,
  children,
  external = false,
}: {
  href: string
  children: React.ReactNode
  external?: boolean
}) {
  const className =
    'block text-ink-400 transition-colors duration-150 hover:text-white focus-visible:text-white'
  return external ? (
    <a href={href} className={className}>
      {children}
    </a>
  ) : (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}
