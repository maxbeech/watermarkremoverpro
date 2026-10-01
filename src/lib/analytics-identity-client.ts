'use client'

import { identify } from '@/lib/openhelm-analytics'
import type { AnalyticsIdentity } from '@/lib/analytics-identity'

/**
 * Pages here are static, so the browser asks who it is rather than the page
 * being rendered per visitor. A local flag, set at sign-in and cleared at
 * sign-out, means anonymous visitors never make the request.
 */
const FLAG = 'wrp_signed_in'

function store(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

export const markSignedIn = () => store()?.setItem(FLAG, '1')
export const markSignedOut = () => store()?.removeItem(FLAG)
export const looksSignedIn = () => store()?.getItem(FLAG) === '1'

/** Fetch the identity and attach it to later events. Null when signed out or unreachable. */
export async function refreshIdentity(): Promise<AnalyticsIdentity | null> {
  try {
    const res = await fetch('/api/analytics/identity', { cache: 'no-store' })
    if (res.status === 204) {
      markSignedOut()
      return null
    }
    if (!res.ok) return null
    const identity = (await res.json()) as AnalyticsIdentity
    identify(identity)
    return identity
  } catch {
    return null
  }
}
