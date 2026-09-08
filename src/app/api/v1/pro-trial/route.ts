import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { currentEntitlements } from '@/lib/auth'
import { databaseConfigured, sql } from '@/lib/db'
import {
  PRO_TRIAL_RUNS_PER_WINDOW,
  PRO_TRIAL_WINDOW_DAYS,
  proTrialStatus,
  type ProTrialStatus,
} from '@/lib/entitlements/pro-trial'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * The account-scoped weekly Pro-engine allowance.
 *
 * GET  reports it. POST spends one run and reports what is left.
 *
 * WHAT THIS ENDPOINT NEVER RECEIVES: the document. There is no request body on
 * either verb, and there is no parameter that could carry text, a hash or a
 * word count. The rewrite itself happens entirely in the caller's browser; all
 * this route does is count how many times an account has reached for the Pro
 * engine, so the allowance follows a person across their devices instead of
 * living in one browser's localStorage.
 *
 * A visitor who is not signed in, or a deployment with no database, gets
 * `scope: 'device'` and no status, an explicit "not my job", so the client
 * falls back to its own local count rather than being handed a fabricated
 * allowance by a server that cannot actually track one.
 */

const deviceScoped = () =>
  NextResponse.json(
    {
      scope: 'device' as const,
      reason:
        'Not signed in, or this deployment has no account database. The weekly Pro-engine allowance is counted on this device instead.',
    },
    { status: 200 },
  )

async function statusFor(accountId: string): Promise<ProTrialStatus> {
  const rows = (await sql()`
    select created_at
    from pro_trial_runs
    where account_id = ${accountId}
      and created_at > now() - make_interval(days => ${PRO_TRIAL_WINDOW_DAYS})
    order by created_at asc
  `) as Array<{ created_at: string | Date }>

  return proTrialStatus(rows.map((r) => new Date(r.created_at).toISOString()))
}

/**
 * A paying subscriber has unlimited access to the Pro engine and must never
 * have a trial run recorded against them. `unlimited` rather than an infinite
 * `remaining`: JSON has no Infinity, and a silently-null count would read to
 * the client as "none left".
 */
const unlimitedForSubscriber = () =>
  NextResponse.json({
    scope: 'account' as const,
    unlimited: true,
    granted: true,
    status: {
      entitled: true,
      remaining: PRO_TRIAL_RUNS_PER_WINDOW,
      used: 0,
      limit: PRO_TRIAL_RUNS_PER_WINDOW,
      windowDays: PRO_TRIAL_WINDOW_DAYS,
      resetsAt: null,
    } satisfies ProTrialStatus,
  })

export async function GET() {
  if (!databaseConfigured()) return deviceScoped()

  const entitlements = await currentEntitlements()
  if (!entitlements.signedIn || !entitlements.userId) return deviceScoped()

  if (entitlements.pro) return unlimitedForSubscriber()

  try {
    return NextResponse.json({ scope: 'account' as const, status: await statusFor(entitlements.userId) })
  } catch (err) {
    // A database that is configured but unreachable must not silently become
    // "no allowance left" or "unlimited". Say so, and let the client fall back.
    Sentry.captureException(err, { tags: { feature: 'pro_trial' } })
    return NextResponse.json(
      { error: 'trial_unavailable', message: (err as Error).message },
      { status: 503 },
    )
  }
}

export async function POST() {
  if (!databaseConfigured()) return deviceScoped()

  const entitlements = await currentEntitlements()
  if (!entitlements.signedIn || !entitlements.userId) return deviceScoped()

  if (entitlements.pro) return unlimitedForSubscriber()

  try {
    const before = await statusFor(entitlements.userId)
    if (!before.entitled) {
      // `granted` is stated rather than inferred: after a successful claim and
      // after a refusal the REMAINING allowance looks identical, so a client
      // reading only the counts could not tell the two apart.
      return NextResponse.json(
        { scope: 'account' as const, granted: false, status: before },
        { status: 429 },
      )
    }

    await sql()`insert into pro_trial_runs (account_id) values (${entitlements.userId})`
    return NextResponse.json({
      scope: 'account' as const,
      granted: true,
      status: await statusFor(entitlements.userId),
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'trial_unavailable', message: (err as Error).message },
      { status: 503 },
    )
  }
}
