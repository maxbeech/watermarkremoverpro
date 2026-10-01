import { userRefFor, type AnalyticsPlan } from '@/lib/openhelm-analytics-mp'
import type { Plan } from '@/lib/auth'

/**
 * Who a signed-in visitor is to analytics, without telling it.
 *
 * The ref is a hash of the account id (first 16 hex of SHA-256), computed on
 * the server so the raw id never reaches the browser or Google. Never the email.
 */
export interface AnalyticsIdentity {
  userRef: string
  plan: AnalyticsPlan
}

/**
 * `paid` means the account holds an active Pro subscription right now. The
 * webhook sets the plan to pro on a completed checkout and back to free when the
 * subscription lapses, so a cancelled customer reads as `free` again.
 */
export function analyticsPlanFor(plan: Plan): AnalyticsPlan {
  return plan === 'pro' ? 'paid' : 'free'
}

export async function analyticsIdentityFor(accountId: string, plan: Plan): Promise<AnalyticsIdentity> {
  return { userRef: await userRefFor(accountId), plan: analyticsPlanFor(plan) }
}
