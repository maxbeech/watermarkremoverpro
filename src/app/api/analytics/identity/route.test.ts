import { beforeEach, describe, expect, it, vi } from 'vitest'

const currentEntitlements = vi.fn()
vi.mock('@/lib/auth', () => ({ currentEntitlements: () => currentEntitlements() }))

const { GET } = await import('./route')

beforeEach(() => currentEntitlements.mockReset())

describe('GET /api/analytics/identity', () => {
  it('answers 204 when nobody is signed in', async () => {
    currentEntitlements.mockResolvedValue({ signedIn: false, userId: null, plan: 'free' })
    const res = await GET()
    expect(res.status).toBe(204)
  })

  it('returns a hashed ref and the plan, never the id or email', async () => {
    currentEntitlements.mockResolvedValue({
      signedIn: true,
      userId: '00000000-0000-0000-0000-000000000000',
      email: 'someone@example.com',
      plan: 'pro',
    })
    const res = await GET()
    const body = await res.json()
    expect(body).toEqual({ userRef: '12b9377cbe7e5c94', plan: 'paid' })
    expect(JSON.stringify(body)).not.toMatch(/@|0000-0000/)
    expect(res.headers.get('cache-control')).toBe('no-store')
  })
})
