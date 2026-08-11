import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { SignOutButton } from '@/components/auth-form'
import { ApiKeyManager } from './api-key-manager'
import { UpgradeButton } from './upgrade-button'
import { currentEntitlements } from '@/lib/auth'
import { listApiKeys } from '@/lib/api-keys'
import { databaseConfigured, sql } from '@/lib/db'
import { monthToDateUsage } from '@/lib/metering'
import { stripeConfigured } from '@/lib/billing'
import { PLANS } from '@/lib/site'

export const metadata: Metadata = { title: 'Your account', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

interface CheckRow {
  id: string
  document_hash: string
  language: string | null
  words: number
  created_at: string
}

export default async function DashboardPage() {
  if (!databaseConfigured()) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-14">
        <h1 className="font-serif text-2xl text-ink-900">Accounts are unavailable here</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
          This deployment has no database configured, so sign-in, saved history and API keys are not
          available. This is a deployment configuration state, not an error you caused.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
          The <Link href="/check" className="underline underline-offset-2">on-device check</Link> works
          without an account and is unaffected.
        </p>
      </section>
    )
  }

  const entitlements = await currentEntitlements()
  if (!entitlements.signedIn || !entitlements.userId) redirect('/login')

  const [keys, usage, recentRows] = await Promise.all([
    listApiKeys(entitlements.userId),
    monthToDateUsage(entitlements.userId),
    sql()`
      select id, document_hash, language, words, created_at
      from checks where account_id = ${entitlements.userId}
      order by created_at desc limit 20
    `,
  ])
  // The Neon driver's return type is a union covering array and full-result
  // modes; this query runs in array mode, so narrow it once here rather than
  // casting at each use.
  const recent = recentRows as unknown as CheckRow[]

  const plan = entitlements.pro ? PLANS.pro : PLANS.free

  return (
    <section className="mx-auto max-w-3xl px-5 py-12">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-serif text-3xl text-ink-900">Your account</h1>
        <SignOutButton />
      </div>
      <p className="mt-2 text-sm text-ink-500">{entitlements.email}</p>

      {/* -------------------------------------------------------------- */}
      <div className="mt-8 rounded-lg border border-ink-200 bg-white p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-serif text-lg text-ink-900">{plan.name} plan</h2>
          {!entitlements.pro && <UpgradeButton billingLive={stripeConfigured()} />}
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <Stat label="Words per document" value={plan.wordCap.toLocaleString()} />
          <Stat
            label="Checks this month"
            value={
              plan.checksPerMonth === null
                ? `${usage.checks} (unlimited)`
                : `${usage.checks} of ${plan.checksPerMonth}`
            }
          />
          <Stat label="Words measured" value={usage.words.toLocaleString()} />
          <Stat label="Billable units" value={usage.units.toLocaleString()} />
        </dl>
        <p className="mt-3 text-xs text-ink-400">
          Usage counted since {usage.since.slice(0, 10)}. Allowances reset at the start of each month.
        </p>
      </div>

      {/* -------------------------------------------------------------- */}
      <div className="mt-6">
        <ApiKeyManager initialKeys={keys} pro={entitlements.pro} />
      </div>

      {/* -------------------------------------------------------------- */}
      <div className="mt-6 rounded-lg border border-ink-200 bg-white">
        <header className="border-b border-ink-100 px-5 py-4">
          <h2 className="font-serif text-lg text-ink-900">Saved checks</h2>
          <p className="mt-1 text-sm text-ink-500">
            Checks run on the server — through the API, or when generating an evidence report. The
            no-signup browser check deliberately saves nothing, so it does not appear here.
          </p>
        </header>

        {recent.length === 0 ? (
          <p className="px-5 py-6 text-sm text-ink-500">
            No saved checks yet. Run one through the API, or generate an evidence report.
          </p>
        ) : (
          <ul className="divide-y divide-ink-100">
            {recent.map((row) => (
              <li key={row.id} className="flex flex-wrap items-baseline justify-between gap-3 px-5 py-3 text-sm">
                <span className="figure text-ink-700">{row.document_hash.slice(0, 24)}…</span>
                <span className="text-ink-500">
                  <span className="figure">{row.words.toLocaleString()}</span> words
                  {row.language ? ` · ${row.language}` : ''} ·{' '}
                  {new Date(row.created_at).toISOString().slice(0, 16).replace('T', ' ')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-ink-400">{label}</dt>
      <dd className="figure mt-0.5 text-ink-900">{value}</dd>
    </div>
  )
}
