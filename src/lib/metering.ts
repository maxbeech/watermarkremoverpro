import { sql } from '@/lib/db'
import { API_PRICE_PENCE_PER_1K_WORDS, PLANS } from '@/lib/site'

/**
 * Usage metering for programmatic callers.
 *
 * The billable unit is 1,000 words, rounded up, which is the unit the pricing
 * page and pricing.json both quote. One constant, three surfaces — a metered
 * product whose code and price list disagree is one that overcharges or
 * undercharges silently.
 */

export const WORDS_PER_UNIT = 1000

export const billableUnits = (words: number): number => Math.max(1, Math.ceil(words / WORDS_PER_UNIT))

export interface UsageWindow {
  words: number
  units: number
  checks: number
  since: string
}

/** Usage in the current calendar month, which is the window allowances reset on. */
export async function monthToDateUsage(accountId: string): Promise<UsageWindow> {
  const rows = (await sql()`
    select
      coalesce(sum(words), 0)::int          as words,
      coalesce(sum(billable_units), 0)::int as units,
      count(*)::int                          as checks
    from usage_events
    where account_id = ${accountId}
      and created_at >= date_trunc('month', now())
  `) as Array<{ words: number; units: number; checks: number }>

  const row = rows[0] ?? { words: 0, units: 0, checks: 0 }
  const since = new Date()
  since.setUTCDate(1)
  since.setUTCHours(0, 0, 0, 0)

  return { words: row.words, units: row.units, checks: row.checks, since: since.toISOString() }
}

export async function recordUsage(params: {
  accountId: string
  apiKeyId: string | null
  surface: 'api' | 'mcp' | 'web'
  words: number
  documentHash: string
}): Promise<number> {
  const units = billableUnits(params.words)
  await sql()`
    insert into usage_events (account_id, api_key_id, surface, words, billable_units, document_hash)
    values (${params.accountId}, ${params.apiKeyId}, ${params.surface}, ${params.words}, ${units}, ${params.documentHash})
  `
  return units
}

export interface AllowanceDecision {
  allowed: boolean
  reason?: string
  plan: string
  wordCap: number
  checksThisMonth: number
  checksPerMonth: number | null
}

/**
 * Decide whether a request is within the caller's plan.
 *
 * A refusal names the number it hit. "Quota exceeded" tells the caller nothing
 * they can act on; "20 checks used of 20 this month, resets 1 September" does.
 */
export async function checkAllowance(
  accountId: string,
  plan: string,
  words: number,
): Promise<AllowanceDecision> {
  const spec = plan === 'pro' ? PLANS.pro : PLANS.free
  const usage = await monthToDateUsage(accountId)

  const decision: AllowanceDecision = {
    allowed: true,
    plan: spec.id,
    wordCap: spec.wordCap,
    checksThisMonth: usage.checks,
    checksPerMonth: spec.checksPerMonth,
  }

  if (words > spec.wordCap) {
    return {
      ...decision,
      allowed: false,
      reason: `This document is ${words.toLocaleString()} words; the ${spec.name} plan allows ${spec.wordCap.toLocaleString()} per document. The document was not analysed — a result measured on part of a document would not describe the document.`,
    }
  }

  if (spec.checksPerMonth !== null && usage.checks >= spec.checksPerMonth) {
    return {
      ...decision,
      allowed: false,
      reason: `${usage.checks} of ${spec.checksPerMonth} checks used this month on the ${spec.name} plan. The allowance resets at the start of next month.`,
    }
  }

  return decision
}

/** What a metered call costs, in pence. Quoted back on every API response. */
export const unitsToPence = (units: number): number => units * API_PRICE_PENCE_PER_1K_WORDS
