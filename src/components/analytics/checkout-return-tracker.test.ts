import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The tracker is a React effect; the part worth pinning is what it sends when
 * the plan does or does not become Pro, so this drives the same calls it makes.
 */
const track = vi.fn()
const refreshIdentity = vi.fn()
vi.mock('@/lib/openhelm-analytics', () => ({ track: (...a: unknown[]) => track(...a) }))
vi.mock('@/lib/analytics-identity-client', () => ({ refreshIdentity: () => refreshIdentity() }))

let effect: (() => void | (() => void)) | undefined
vi.mock('react', () => ({ useEffect: (fn: () => void | (() => void)) => (effect = fn) }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))

const store = new Map<string, string>()

beforeEach(() => {
  vi.useFakeTimers()
  track.mockReset()
  refreshIdentity.mockReset()
  store.clear()
  vi.stubGlobal('window', {
    sessionStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    },
  })
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

async function mount() {
  const { CheckoutReturnTracker } = await import('./checkout-return-tracker')
  CheckoutReturnTracker()
  return effect!()
}

describe('CheckoutReturnTracker', () => {
  it('sends purchase once the plan is paid, with the plan price', async () => {
    refreshIdentity.mockResolvedValue({ userRef: '12b9377cbe7e5c94', plan: 'paid' })
    await mount()
    await vi.advanceTimersByTimeAsync(0)
    expect(track).toHaveBeenCalledTimes(1)
    expect(track).toHaveBeenCalledWith(
      'purchase',
      expect.objectContaining({ currency: 'GBP', value: 19 }),
    )
  })

  it('waits for a late webhook, then sends purchase', async () => {
    refreshIdentity
      .mockResolvedValueOnce({ userRef: '12b9377cbe7e5c94', plan: 'free' })
      .mockResolvedValue({ userRef: '12b9377cbe7e5c94', plan: 'paid' })
    await mount()
    await vi.advanceTimersByTimeAsync(0)
    expect(track).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(2000)
    expect(track).toHaveBeenCalledWith('purchase', expect.any(Object))
  })

  it('reports purchase_unconfirmed when the plan never becomes paid', async () => {
    refreshIdentity.mockResolvedValue({ userRef: '12b9377cbe7e5c94', plan: 'free' })
    await mount()
    await vi.advanceTimersByTimeAsync(30_000)
    expect(track).toHaveBeenCalledTimes(1)
    expect(track).toHaveBeenCalledWith('purchase_unconfirmed')
  })

  it('does not send a second purchase for the same browser session', async () => {
    store.set('wrp_purchase_sent', '1')
    refreshIdentity.mockResolvedValue({ userRef: '12b9377cbe7e5c94', plan: 'paid' })
    await mount()
    await vi.advanceTimersByTimeAsync(0)
    expect(track).not.toHaveBeenCalled()
  })
})
