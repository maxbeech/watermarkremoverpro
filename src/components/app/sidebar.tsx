'use client'

import Link from 'next/link'
import { LogoLink } from '@/components/brand/logo'
import { MIRROR_PRODUCT, SITE } from '@/lib/site'
import { identityLabel, type AnonIdentity } from '@/lib/workspace/identity'
import { summariseRun, type RunRecord } from '@/lib/workspace/runs'
import { workspaceUrl } from '@/lib/workspace/route'

/**
 * The workspace sidebar: who you are here, and everything you have run.
 *
 * "Who you are here" is deliberately modest. There is no account behind this
 * and there is not going to be one for drafts: the identity is minted in this
 * browser, the history is in this browser's own database, and the panel says
 * so rather than implying a sync that would contradict the one promise the
 * product makes. Signing in buys the Pro engine and the evidence report, not
 * a copy of your documents on someone else's disk.
 *
 * It also carries the mirror-product pointer, so the workspace is not the one
 * screen on this origin where somebody in the wrong place is never told.
 */
export function Sidebar({
  identity,
  runs,
  activeId,
  storageAvailable,
  onDelete,
  onClearAll,
  onNavigate,
}: {
  identity: AnonIdentity | null
  runs: RunRecord[]
  activeId: string | null
  /** Null while it is still being determined. */
  storageAvailable: boolean | null
  onDelete: (id: string) => void
  onClearAll: () => void
  /** Called after any navigation, so the mobile drawer can close itself. */
  onNavigate?: () => void
}) {
  return (
    <div className="flex h-full flex-col bg-ink-900 text-ink-200">
      <div className="border-b border-ink-800 px-4 py-4">
        <LogoLink variant="lockup" height={24} className="brightness-0 invert" />
      </div>

      <div className="border-b border-ink-800 px-4 py-4">
        <Link
          href={workspaceUrl()}
          onClick={onNavigate}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-ink-900 transition-colors hover:bg-ink-100"
        >
          <span aria-hidden="true" className="text-base leading-none">
            +
          </span>
          New rewrite
        </Link>
      </div>

      <nav aria-label="Your rewrites" className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
        <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-300">
          On this device
        </p>

        {storageAvailable === false && (
          <p className="mx-2 rounded-[var(--radius-control)] border border-ink-800 bg-ink-800/60 px-3 py-2.5 text-[12px] leading-relaxed text-ink-300">
            This browser will not let the page use its database, so nothing can be kept between
            reloads. The rewrite itself still works.
          </p>
        )}

        {storageAvailable !== false && runs.length === 0 && (
          <p className="px-2 text-[12px] leading-relaxed text-ink-300">
            Nothing yet. Anything you rewrite shows up here, on this device only.
          </p>
        )}

        <ul className="space-y-0.5">
          {runs.map((run) => {
            const active = run.id === activeId
            const summary = run.result ? summariseRun(run.result) : null
            return (
              <li key={run.id} className="group relative">
                <Link
                  href={workspaceUrl(run.id)}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={
                    'block rounded-[var(--radius-control)] px-3 py-2.5 pr-9 transition-colors ' +
                    (active ? 'bg-ink-800 text-white' : 'text-ink-200 hover:bg-ink-800/60')
                  }
                >
                  <span className="block truncate text-[13px] font-medium">{run.title}</span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-ink-300">
                    <time dateTime={run.createdAt}>{shortDate(run.createdAt)}</time>
                    {run.status === 'error' && <span className="text-signal-300">did not run</span>}
                    {run.status === 'pending' && <span>queued</span>}
                    {summary?.likelihoodAfter !== null && summary !== null && (
                      <span className="figure">AI {summary.likelihoodAfter}/100</span>
                    )}
                  </span>
                </Link>

                <button
                  type="button"
                  aria-label={`Delete ${run.title}`}
                  onClick={() => onDelete(run.id)}
                  className="absolute right-1.5 top-2.5 hidden h-7 w-7 items-center justify-center rounded-full text-ink-300 transition-colors hover:bg-ink-700 hover:text-white focus-visible:flex group-hover:flex"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                  </svg>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="space-y-3 border-t border-ink-800 px-4 py-4 text-[12px] leading-relaxed text-ink-300">
        <div>
          <p className="font-semibold text-white">{identityLabel(identity)}</p>
          <p className="mt-1">
            No account, and none needed. Your drafts and this history live in this browser only, and
            are never uploaded.{' '}
            <Link href="/privacy" className="underline decoration-ink-600 underline-offset-2 hover:decoration-white">
              Privacy
            </Link>
          </p>
        </div>

        {runs.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-[12px] font-medium text-ink-300 underline decoration-ink-600 underline-offset-2 transition-colors hover:text-white"
          >
            Delete everything on this device
          </button>
        )}

        <p className="rounded-[var(--radius-control)] border border-ink-800 bg-ink-800/60 px-3 py-2.5">
          Checking <strong className="font-semibold text-white">someone else&apos;s</strong> work for
          AI use is a different job.{' '}
          <a
            href={MIRROR_PRODUCT.url}
            className="font-semibold text-white underline decoration-ink-600 underline-offset-2 hover:decoration-white"
          >
            {MIRROR_PRODUCT.name}
          </a>{' '}
          does that. {SITE.name} is for writing{' '}
          <strong className="font-semibold text-white">you</strong> wrote yourself, not work someone
          else handed you to submit.
        </p>

        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <Link href="/" className="hover:text-white">
            Back to the site
          </Link>
          <Link href="/login" className="hover:text-white">
            Sign in
          </Link>
          <Link href="/pricing" className="hover:text-white">
            Pricing
          </Link>
        </div>
      </div>
    </div>
  )
}

function shortDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'unknown date'
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
