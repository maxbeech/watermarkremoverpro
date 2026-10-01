'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { track } from '@/lib/openhelm-analytics'
import { EVENTS, purchaseParams } from '@/lib/analytics-events'
import { refreshIdentity } from '@/lib/analytics-identity-client'
import { PLANS } from '@/lib/site'

const POLL_MS = 2000
const MAX_POLLS = 10
const SENT_KEY = 'wrp_purchase_sent'

/**
 * Fires `purchase` when a customer comes back from Stripe and the plan really
 * is Pro. The redirect alone is not proof: the webhook sets the plan, and it can
 * land after the customer does. So this asks the server, a few times, and says
 * `purchase_unconfirmed` if the plan never changes rather than guessing.
 */
export function CheckoutReturnTracker() {
  const router = useRouter()

  useEffect(() => {
    let cancelled = false
    let polls = 0
    let timer: ReturnType<typeof setTimeout> | undefined

    const alreadySent = () => {
      try {
        return window.sessionStorage.getItem(SENT_KEY) === '1'
      } catch {
        return false
      }
    }
    const markSent = () => {
      try {
        window.sessionStorage.setItem(SENT_KEY, '1')
      } catch {
        /* a repeat purchase event on reload is better than none */
      }
    }

    const check = async () => {
      if (cancelled || alreadySent()) return
      const identity = await refreshIdentity()
      if (cancelled) return
      if (identity?.plan === 'paid') {
        markSent()
        track(EVENTS.purchase, purchaseParams(PLANS.pro))
        router.refresh()
        return
      }
      polls += 1
      if (polls >= MAX_POLLS) {
        track(EVENTS.purchaseUnconfirmed)
        return
      }
      timer = setTimeout(check, POLL_MS)
    }

    void check()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [router])

  return null
}
