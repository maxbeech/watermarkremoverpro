import { describe, it, expect } from 'vitest'
import { effectiveRewriteModel, MODEL_TIERS, EMBEDDING_MODEL } from './models'

describe('models registry', () => {
  it('pins every model to an explicit repo and a full 40-character commit revision', () => {
    const pinned = [MODEL_TIERS.free.rewriteModel, MODEL_TIERS.pro.rewriteModel, EMBEDDING_MODEL]
    for (const model of pinned) {
      expect(model).not.toBeNull()
      expect(model!.repo).toMatch(/^[\w-]+\/[\w.-]+$/)
      expect(model!.revision).toMatch(/^[0-9a-f]{40}$/)
    }
  })

  it('free and pro pin to distinct rewrite models', () => {
    expect(MODEL_TIERS.free.rewriteModel!.repo).not.toBe(MODEL_TIERS.pro.rewriteModel!.repo)
  })

  describe('effectiveRewriteModel', () => {
    it('always uses the free model for the free tier, regardless of environment', () => {
      const capable = effectiveRewriteModel('free', { device: 'webgpu', lowMemory: false })
      const incapable = effectiveRewriteModel('free', { device: 'wasm', lowMemory: true })
      expect(capable.model.repo).toBe(MODEL_TIERS.free.rewriteModel!.repo)
      expect(incapable.model.repo).toBe(MODEL_TIERS.free.rewriteModel!.repo)
    })

    it('uses the pro model for pro tier on capable browser hardware (WebGPU, adequate memory)', () => {
      const result = effectiveRewriteModel('pro', { device: 'webgpu', lowMemory: false })
      expect(result.model.repo).toBe(MODEL_TIERS.pro.rewriteModel!.repo)
      expect(result.dtype).toBe(MODEL_TIERS.pro.dtype)
    })

    it('downgrades pro to the free model in a browser without WebGPU, rather than risking a larger model on WASM/CPU-in-tab', () => {
      const result = effectiveRewriteModel('pro', { device: 'wasm', lowMemory: false })
      expect(result.model.repo).toBe(MODEL_TIERS.free.rewriteModel!.repo)
    })

    it('downgrades pro to the free model on a low-memory browser even with WebGPU', () => {
      const result = effectiveRewriteModel('pro', { device: 'webgpu', lowMemory: true })
      expect(result.model.repo).toBe(MODEL_TIERS.free.rewriteModel!.repo)
    })

    it('never downgrades pro on device: "cpu" (Node/MCP/CLI): a dev machine or server is not the weak-hardware case the rule protects against', () => {
      const result = effectiveRewriteModel('pro', { device: 'cpu', lowMemory: false })
      expect(result.model.repo).toBe(MODEL_TIERS.pro.rewriteModel!.repo)
    })

    it('always resolves to the q4 dtype off WebGPU (WASM or Node/CPU), since q4f16 is a WebGPU-only precision', () => {
      expect(effectiveRewriteModel('pro', { device: 'wasm', lowMemory: false }).dtype).toBe('q4')
      expect(effectiveRewriteModel('pro', { device: 'cpu', lowMemory: false }).dtype).toBe('q4')
    })
  })
})
