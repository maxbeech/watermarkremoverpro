'use client'

import Link from 'next/link'
import { LogoLink } from '@/components/brand/logo'
import { MIRROR_PRODUCT } from '@/lib/site'
import { describeReset, type RewriteBudgetStatus } from '@/lib/entitlements/rewrite-budget'
import { summariseRun, type RunRecord } from '@/lib/workspace/runs'
import { workspaceUrl } from '@/lib/workspace/route'

/**
 * The workspace sidebar: start something, or go back to something.
 *
 * That is the whole job, and everything that was not one of those two things
 * has been taken out of it. It previously carried an anonymous identity label,
 * a paragraph about where drafts are stored, a full plan panel, a delete-all
 * link, a three-sentence panel about the sibling product and a row of site
 * links, all stacked under the history in a 288px column: six things competing
 * for the corner of the screen a person looks at when they want the seventh.
 *
 * What is left is the list, one line of plan status, and a compact footer. The
 * storage promise is not dropped, it is moved to where it is actually load
 * bearing (the "On this device" heading over the list it describes, and the
 * privacy page it links to). The pointer to the sibling product stays, because
 * someone who came here to screen work that is not theirs needs to be told, but
 * it is one quiet line rather than a panel.
 */
export function Sidebar({
  runs,
  activeId,
  storageAvailable,
  onDelete,
  onClearAll,
  onNavigate,
  budget,
  subscriber,
  budgetLoading,
}: {
  runs: RunRecord[]
  activeId: string | null
  /** Null while it is still being determined. */
  storageAvailable: boolean | null
  onDelete: (id: string) => void
  onClearAll: () => void
  /** Called after any navigation, so the mobile drawer can close itself. */
  onNavigate?: () => void
  /** The weekly correction budget, shared with the runner so the two never disagree. Null until the first read resolves, or for a subscriber who has none. */
  budget: RewriteBudgetStatus | null
  /** True for a paying subscriber: unlimited correction. */
  subscriber: boolean
  budgetLoading: boolean
}) {
  return (
    <div className="flex h-full flex-col bg-ink-900 text-ink-200">
      <div className="px-4 py-4">
        <LogoLink variant="lockup" height={24} className="brightness-0 invert" />
      </div>

      <div className="px-3 pb-3">
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

      <nav aria-label="Your rewrites" className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        <div className="flex items-baseline justify-between gap-2 px-2 pb-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-400">
            On this device
          </p>
          {runs.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-[11px] text-ink-400 transition-colors hover:text-white"
            >
              Clear all
            </button>
          )}
        </div>

        {storageAvailable === false && (
          <p className="mx-2 rounded-[var(--radius-control)] bg-ink-800 px-3 py-2.5 text-[12px] leading-relaxed text-ink-300">
            This browser will not let the page use its database, so nothing can be kept between
            reloads. The rewrite itself still works.
          </p>
        )}

        {storageAvailable !== false && runs.length === 0 && (
          <p className="px-2 text-[12px] leading-relaxed text-ink-400">
            Nothing yet. Anything you rewrite shows up here.
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
                    'block rounded-[var(--radius-control)] px-3 py-2 pr-9 transition-colors ' +
                    (active ? 'bg-ink-800 text-white' : 'text-ink-200 hover:bg-ink-800/60')
                  }
                >
                  <span className="block truncate text-[13px] font-medium">{run.title}</span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-ink-400">
                    <time dateTime={run.createdAt}>{shortDate(run.createdAt)}</time>
                    {run.status === 'error' && <span className="text-signal-300">did not run</span>}
                    {run.status === 'pending' && <span>queued</span>}
                    {summary?.likelihoodAfter !== null && summary !== null && (
                      <span className="figure">AI {summary.likelihoodAfter}</span>
                    )}
                  </span>
                </Link>

                <button
                  type="button"
                  aria-label={`Delete ${run.title}`}
                  onClick={() => onDelete(run.id)}
                  className="absolute right-1.5 top-2 hidden h-7 w-7 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-ink-700 hover:text-white focus-visible:flex group-hover:flex"
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

      <div className="border-t border-ink-800 px-4 py-3">
        <BudgetMeter budget={budget} subscriber={subscriber} loading={budgetLoading} />

        {/* One row, not a stack. Every link that used to have its own line is
            here, including the pointer to the sibling product: someone in the
            wrong place still has to be told, but a three-sentence panel saying
            so was the largest single thing in this column. */}
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-400">
          {!subscriber && (
            <Link href="/pricing" className="font-semibold text-white transition-colors hover:text-ink-200">
              Go unlimited
            </Link>
          )}
          <Link href="/privacy" className="transition-colors hover:text-white">
            Privacy
          </Link>
          <Link href="/login" className="transition-colors hover:text-white">
            Sign in
          </Link>
          <a
            href={MIRROR_PRODUCT.url}
            title={`Checking work someone else wrote is a different job: ${MIRROR_PRODUCT.name}`}
            className="transition-colors hover:text-white"
          >
            Checking someone else&apos;s work?
          </a>
        </div>
      </div>
    </div>
  )
}

/**
 * One line of plan status, with a bar.
 *
 * Reads from the same `RewriteBudgetStatus` the runner spends against, so the
 * number here and the number that refuses a rewrite are the same number. A
 * budget that has not been read yet says so rather than showing a full bar it
 * has not earned the right to show.
 */
function BudgetMeter({
  budget,
  subscriber,
  loading,
}: {
  budget: RewriteBudgetStatus | null
  subscriber: boolean
  loading: boolean
}) {
  if (subscriber) {
    return (
      <p className="flex items-center justify-between gap-2 text-[12px]">
        <span className="font-semibold text-white">Pro</span>
        <span className="text-ink-400">Unlimited rewriting</span>
      </p>
    )
  }

  if (loading || !budget) {
    return (
      <p className="flex items-center justify-between gap-2 text-[12px]">
        <span className="font-semibold text-white">Free</span>
        <span className="text-ink-400">Checking your allowance…</span>
      </p>
    )
  }

  const usedPct = Math.min(100, Math.round((budget.used / budget.limit) * 100))
  const reset = describeReset(budget.resetsAt)

  return (
    <div title={`Rewriting only. Checking is unlimited on every plan.${reset ? ` Refills ${reset}.` : ''}`}>
      <p className="flex items-baseline justify-between gap-2 text-[12px]">
        <span className="font-semibold text-white">Free</span>
        <span className="figure text-ink-400">
          {budget.remaining.toLocaleString()} rewrite tokens
        </span>
      </p>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-800">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${budget.entitled ? 'bg-mint-500' : 'bg-signal-500'}`}
          style={{ width: `${usedPct}%` }}
        />
      </div>
      {!budget.entitled && (
        <p className="mt-1.5 text-[11px] leading-relaxed text-signal-300">
          Rewriting is paused{reset ? `, back ${reset}` : ''}. Checking still works.
        </p>
      )}
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
