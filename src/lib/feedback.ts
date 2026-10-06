export interface FeedbackUser {
  email?: string | null
  name?: string | null
}

/**
 * Open Sentry's feedback form. Returns false when reporting is not configured
 * on this deployment (no DSN), so the caller can say so instead of showing a
 * control that does nothing.
 *
 * The SDK is imported lazily so a marketing page does not pull the browser SDK
 * into its first load just to render a footer link.
 */
export async function openFeedbackForm(user?: FeedbackUser): Promise<boolean> {
  const Sentry = await import('@sentry/nextjs')
  const feedback = Sentry.getFeedback()
  if (!feedback) return false
  // The form reads name and email from the Sentry user.
  if (user?.email) Sentry.setUser({ email: user.email, ...(user.name ? { username: user.name } : {}) })
  const form = await feedback.createForm()
  form.appendToDom()
  form.open()
  return true
}
