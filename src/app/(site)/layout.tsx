import Link from 'next/link'
import { SiteHeader } from '@/components/chrome/site-header'
import { Logo } from '@/components/brand/logo'
import { MIRROR_PRODUCT, SITE } from '@/lib/site'

/**
 * The marketing chrome: the header every content page opens with and the
 * footer every content page closes with.
 *
 * It lives in a route group rather than in the root layout because the
 * workspace at /app is an application, not a page on this site, and giving it
 * a marketing header, a seven-column footer and a page-length scroll under its
 * own sidebar was the single thing that made it read as a website with a tool
 * bolted on. Route groups do not appear in the URL, so nothing here changed
 * address.
 */

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />

      <main>{children}</main>

      <footer className="border-t border-ink-200 bg-ink-900 text-ink-200">
        <div className="mx-auto max-w-6xl px-5 py-16 text-sm sm:px-6">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3">
                <Logo variant="mark" height={28} />
                <span className="text-lg font-bold tracking-tight text-white">{SITE.name}</span>
              </div>
              <p className="mt-5 max-w-sm leading-relaxed text-ink-300">
                Cleans up your own writing on your device and shows you what a detector would
                measure in it. It cannot guarantee defeating a model vendor&apos;s undisclosed
                watermark; nothing here is sent to a server, on any tier.
              </p>

              {/*
                The mirror-product pointer.

                It lives here, in the root layout, so no page can ship
                without it, but in the footer rather than as a banner above
                the fold, because the overwhelming majority of visitors are
                in the right place and a full-width interruption telling them
                otherwise was the loudest thing on every page. The homepage
                additionally carries a proper section explaining the split.
              */}
              <p className="mt-6 max-w-sm rounded-[var(--radius-control)] border border-ink-800 bg-ink-800/60 px-4 py-3 text-[13px] leading-relaxed text-ink-300">
                Checking <strong className="font-semibold text-white">someone else&apos;s</strong>{' '}
                work for AI use is a different job.{' '}
                <a
                  href={MIRROR_PRODUCT.url}
                  className="font-semibold text-white underline decoration-ink-600 underline-offset-[3px] transition-colors hover:decoration-white"
                >
                  {MIRROR_PRODUCT.name}
                </a>{' '}
                does that. {SITE.name} is for writing{' '}
                <strong className="font-semibold text-white">you</strong> wrote yourself, not work
                someone else handed you to submit.
              </p>
            </div>

            <div className="space-y-2.5">
              <p className="font-semibold text-white">Product</p>
              <FooterLink href="/">Clean up your writing</FooterLink>
              <FooterLink href="/app">Your workspace</FooterLink>
              <FooterLink href="/check">Check for AI evidence</FooterLink>
              <FooterLink href="/method">How it works</FooterLink>
              <FooterLink href="/verify">Verify the detector</FooterLink>
              <FooterLink href="/limits">Stated limits</FooterLink>
              <FooterLink href="/pricing">Pricing</FooterLink>
              <FooterLink href="/blog">Blog</FooterLink>
            </div>

            <div className="space-y-2.5">
              <p className="font-semibold text-white">For machines</p>
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

          <p className="mt-12 border-t border-ink-800 pt-6 text-xs leading-relaxed text-ink-300">
            A detected mark is not proof of authorship. An absent mark is not proof of human
            authorship. {SITE.name} reports what it measured and names what it could not measure.
          </p>

          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink-300">
            <FooterLink href="/privacy">Privacy policy</FooterLink>
            <FooterLink href="/terms">Terms of service</FooterLink>
            <span>
              &copy; {new Date().getFullYear()} {SITE.name}
            </span>
          </div>
        </div>
      </footer>

    </>
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
    'block text-ink-300 transition-colors duration-150 hover:text-white focus-visible:text-white'
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
