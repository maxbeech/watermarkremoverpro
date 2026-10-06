'use client'

import { useState } from 'react'
import { buttonClass } from '@/components/brand/ui'
import { openFeedbackForm, type FeedbackUser } from '@/lib/feedback'
import { SITE } from '@/lib/site'

/**
 * The one user-facing feedback control. It opens Sentry's feedback form, so a
 * report from a person lands in the same Sentry project as the errors from the
 * code, in one place rather than a support inbox that drifts out of sync.
 *
 * Variants share this component so the behaviour (and the "not configured"
 * fallback) cannot differ between the workspace sidebar, the site footer and
 * the account page.
 */
export function FeedbackButton({
  variant = 'link',
  user,
  className = '',
}: {
  variant?: 'link' | 'sidebar' | 'button'
  /** Signed-in user, used to pre-fill the form so nobody retypes their email. */
  user?: FeedbackUser
  className?: string
}) {
  const [unavailable, setUnavailable] = useState(false)

  const open = async () => {
    try {
      if (!(await openFeedbackForm(user))) setUnavailable(true)
    } catch (err) {
      console.error('[feedback] could not open the form', err instanceof Error ? err.name : typeof err)
      setUnavailable(true)
    }
  }

  if (unavailable) {
    return (
      <span className={className}>
        Feedback is not switched on here. Email{' '}
        <a className="underline underline-offset-2" href={`mailto:${SITE.contactEmail}`}>
          {SITE.contactEmail}
        </a>
        .
      </span>
    )
  }

  if (variant === 'sidebar') {
    return (
      <button
        type="button"
        onClick={open}
        className={
          'mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-ink-700 px-3 py-2 ' +
          `text-[12px] font-semibold text-ink-200 transition-colors hover:border-ink-500 hover:text-white ${className}`
        }
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
        </svg>
        Send feedback
      </button>
    )
  }

  if (variant === 'button') {
    return (
      <button type="button" onClick={open} className={buttonClass('quiet', className)}>
        Send feedback
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={open}
      className={`text-ink-300 transition-colors duration-150 hover:text-white focus-visible:text-white ${className}`}
    >
      Send feedback
    </button>
  )
}
