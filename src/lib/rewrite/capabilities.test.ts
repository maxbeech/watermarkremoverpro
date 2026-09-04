import { describe, it, expect, afterEach, vi } from 'vitest'
import { detectBrowserCapability } from './capabilities'

describe('capabilities', () => {
  const originalNavigator = globalThis.navigator

  afterEach(() => {
    vi.unstubAllGlobals()
    Object.defineProperty(globalThis, 'navigator', { value: originalNavigator, configurable: true })
  })

  it('reports no WebGPU and low memory when navigator is unavailable (SSR/Node)', async () => {
    // @ts-expect-error deliberately simulating an environment with no navigator
    delete globalThis.navigator
    const result = await detectBrowserCapability()
    expect(result).toEqual({ hasWebGPU: false, lowMemory: true })
  })

  it('reports WebGPU available when requestAdapter resolves to an adapter', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { gpu: { requestAdapter: async () => ({ id: 'fake-adapter' }) } },
      configurable: true,
    })
    const result = await detectBrowserCapability()
    expect(result.hasWebGPU).toBe(true)
  })

  it('reports no WebGPU when requestAdapter resolves to null', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { gpu: { requestAdapter: async () => null } },
      configurable: true,
    })
    const result = await detectBrowserCapability()
    expect(result.hasWebGPU).toBe(false)
  })

  it('reports no WebGPU when requestAdapter throws', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        gpu: {
          requestAdapter: async () => {
            throw new Error('GPU process crashed')
          },
        },
      },
      configurable: true,
    })
    const result = await detectBrowserCapability()
    expect(result.hasWebGPU).toBe(false)
  })

  it('reports no WebGPU when navigator.gpu is absent (Safari/Firefox today)', async () => {
    Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true })
    const result = await detectBrowserCapability()
    expect(result.hasWebGPU).toBe(false)
  })

  it('flags low memory when deviceMemory is reported under 4GB', async () => {
    Object.defineProperty(globalThis, 'navigator', { value: { deviceMemory: 2 }, configurable: true })
    const result = await detectBrowserCapability()
    expect(result.lowMemory).toBe(true)
  })

  it('does not flag low memory when deviceMemory is unreported', async () => {
    Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true })
    const result = await detectBrowserCapability()
    expect(result.lowMemory).toBe(false)
  })
})
