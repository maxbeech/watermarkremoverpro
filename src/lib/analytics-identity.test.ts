import { describe, expect, it } from 'vitest'
import { analyticsIdentityFor, analyticsPlanFor } from './analytics-identity'
import { EVENTS, purchaseParams } from './analytics-events'
import { PLANS } from './site'

// OpenHelm's contract: lowercase, snake_case, at most 40 characters.
const ANALYTICS_EVENT_NAME = /^[a-z][a-z0-9_]{0,39}$/

describe('analytics identity', () => {
  it('hashes the account id to the contract test vector', async () => {
    const identity = await analyticsIdentityFor('00000000-0000-0000-0000-000000000000', 'free')
    expect(identity).toEqual({ userRef: '12b9377cbe7e5c94', plan: 'free' })
  })

  it('never carries the id or an email', async () => {
    const identity = await analyticsIdentityFor('acct-123', 'pro')
    expect(JSON.stringify(identity)).not.toMatch(/acct-123|@/)
    expect(identity.userRef).toMatch(/^[0-9a-f]{16}$/)
  })

  it('reads an active Pro subscription as paid and everything else as free', () => {
    expect(analyticsPlanFor('pro')).toBe('paid')
    expect(analyticsPlanFor('free')).toBe('free')
  })
})

describe('journey events', () => {
  it('uses names GA4 and OpenHelm accept', () => {
    for (const name of Object.values(EVENTS)) expect(name).toMatch(ANALYTICS_EVENT_NAME)
    expect(new Set(Object.values(EVENTS)).size).toBe(Object.values(EVENTS).length)
  })

  it('builds the purchase payload from the plan, with no personal data', () => {
    const params = purchaseParams(PLANS.pro)
    expect(params).toEqual({
      currency: 'GBP',
      value: 19,
      items: [{ item_id: 'pro', item_name: 'Pro', price: 19, quantity: 1 }],
    })
  })
})
