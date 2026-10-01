/**
 * The journey events this product sends to Google Analytics, named once.
 *
 * OpenHelm reads these names back when it measures user journeys, so a rename
 * here is a change to what it can see. GA4 recommended names are used where one
 * exists (sign_up, login, purchase). Every step that can fail has a `_failed`
 * sibling, so a step nobody completes is distinguishable from one that errors.
 */
export const EVENTS = {
  signUpStarted: 'sign_up_started',
  signUp: 'sign_up',
  signUpFailed: 'sign_up_failed',
  loginStarted: 'login_started',
  login: 'login',
  loginFailed: 'login_failed',
  checkStarted: 'check_started',
  checkCompleted: 'check_completed',
  checkFailed: 'check_failed',
  workspaceOpened: 'workspace_opened',
  rewriteStarted: 'rewrite_started',
  rewriteCompleted: 'rewrite_completed',
  rewriteFailed: 'rewrite_failed',
  upgradeClicked: 'upgrade_button_clicked',
  checkoutStarted: 'checkout_started',
  checkoutFailed: 'checkout_failed',
  purchase: 'purchase',
  purchaseUnconfirmed: 'purchase_unconfirmed',
} as const

export type AnalyticsEventName = (typeof EVENTS)[keyof typeof EVENTS]

/** GA4's `purchase` params. Value and currency come from the plan, never retyped. */
export function purchaseParams(plan: { id: string; name: string; price: number; currency: string }) {
  return {
    currency: plan.currency,
    value: plan.price,
    items: [{ item_id: plan.id, item_name: plan.name, price: plan.price, quantity: 1 }],
  }
}
