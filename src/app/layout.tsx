import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SITE } from '@/lib/site'
import './globals.css'
import { OpenHelmAnalytics } from '../lib/openhelm-analytics'

/**
 * The document shell, and nothing else.
 *
 * There are two chromes on this origin now: the marketing site, whose header
 * and footer live in `(site)/layout.tsx`, and the workspace at /app, which is
 * a full-height application shell with its own sidebar. Both need the same
 * html element, the same fonts and the same analytics, and neither should
 * inherit the other's furniture, so everything shared lives here and
 * everything else lives one level down.
 *
 * The route group means no URL changed: `(site)` is a folder for grouping, not
 * a path segment.
 */

/**
 * One sans for the whole product and one monospace for anything measured.
 * Loaded through next/font so the files are self-hosted from this origin with
 * `font-display: swap` and a generated fallback metric, which keeps the
 * privacy claim intact (no request to a font CDN when someone opens a page)
 * and keeps the layout from shifting when the face arrives.
 */
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jakarta',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono-jetbrains',
})

/*
  No `icons` block. The tab icon, the Android icon and the Apple touch icon are
  favicon.ico, icon.png and apple-icon.png in this directory, generated from the
  same brand mark the header and footer render by `npm run logos`, and picked up
  by Next.js through its file conventions. Naming them here as well would be a
  second place for the icon to be declared, and the one that quietly wins.
*/
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen antialiased">
        {children}
        <Analytics />
        <OpenHelmAnalytics />
      </body>
    </html>
  )
}
