'use client'

import { useEffect } from 'react'
import { looksSignedIn, markSignedIn, refreshIdentity } from '@/lib/analytics-identity-client'

/**
 * Renders nothing. Sets the user properties once per page load for a signed-in
 * visitor. A page that has already verified the session passes `assumeSignedIn`,
 * which also covers people who signed in before the local flag existed.
 */
export function AnalyticsIdentity({ assumeSignedIn = false }: { assumeSignedIn?: boolean }) {
  useEffect(() => {
    if (assumeSignedIn) markSignedIn()
    if (assumeSignedIn || looksSignedIn()) void refreshIdentity()
  }, [assumeSignedIn])
  return null
}
