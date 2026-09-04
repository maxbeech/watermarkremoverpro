/**
 * Device capability detection for the advanced (model-backed) backend.
 *
 * Only ever chooses between "which local model/precision" and "WebGPU vs
 * WASM"; it never has a network branch, because there is no server backend
 * to fall back to for this feature. See docs/REWRITE_PHILOSOPHY.md.
 */

export interface DeviceCapability {
  hasWebGPU: boolean
  /** True when navigator.deviceMemory (if reported) suggests attempting a >1B-parameter model on CPU is unwise. Undetermined defaults to false (assume capable) rather than penalizing browsers that don't report it. */
  lowMemory: boolean
}

export async function detectBrowserCapability(): Promise<DeviceCapability> {
  if (typeof navigator === 'undefined') return { hasWebGPU: false, lowMemory: true }

  let hasWebGPU = false
  const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }).gpu
  if (gpu) {
    try {
      const adapter = await gpu.requestAdapter()
      hasWebGPU = adapter !== null && adapter !== undefined
    } catch {
      hasWebGPU = false
    }
  }

  const reportedMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  const lowMemory = typeof reportedMemory === 'number' && reportedMemory < 4

  return { hasWebGPU, lowMemory }
}
