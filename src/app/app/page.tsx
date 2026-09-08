import type { Metadata } from 'next'
import { Suspense } from 'react'
import { WorkspaceApp } from '@/components/app/workspace-app'
import { SITE } from '@/lib/site'

/**
 * The workspace: the application half of this origin.
 *
 * Statically rendered and served from the CDN. There is nothing per-request to
 * compute, because everything on the screen (the draft, the rewrite, the
 * measurements, the history) comes out of the visitor's own browser. The run
 * id arrives as a query parameter, which is why this is one route rather than
 * a dynamic segment: a dynamic segment would turn every open document into a
 * function invocation that returns the same empty shell.
 *
 * Not indexed. There is no content here for a crawler; the pages that describe
 * this feature and rank for it are the homepage and /rewrite.
 */
export const metadata: Metadata = {
  title: 'Workspace',
  description: `Rewrite, compare and re-measure a draft in your browser. Nothing is uploaded, on any tier. ${SITE.name} keeps the history on your device.`,
  robots: { index: false, follow: false },
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={<Booting />}>
      <WorkspaceApp />
    </Suspense>
  )
}

/**
 * Shown for the moment between the static shell arriving and the client reading
 * the run id out of the URL. It carries no measurement and claims nothing.
 */
function Booting() {
  return (
    <div className="flex h-[100dvh] items-center justify-center bg-ink-50">
      <p className="text-sm text-ink-500">Opening your workspace…</p>
    </div>
  )
}
