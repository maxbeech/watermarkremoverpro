'use client'

import { useCallback, useRef, useState } from 'react'
import { classifyDocument, warmClassifier, type MlClassifierResult } from '@/lib/detector/ml-classifier'
import type { LanguageCode } from '@/lib/detector/languages'
import { detectBrowserCapability } from '@/lib/rewrite/capabilities'

export interface MlClassifierProgress {
  status: string
  file?: string
  progress?: number
}

export interface MlClassifierHandle {
  result: MlClassifierResult | null
  loading: boolean
  progress: MlClassifierProgress | null
  /** True from the moment the model starts downloading until it is usable. */
  preparing: boolean
  /**
   * Start downloading the model now, before there is any text to classify.
   * Safe to call repeatedly: the pipeline is cached, so every call after the
   * first resolves immediately.
   */
  prewarm: () => void
  /** Run the model classifier on `text`, replacing whatever result is currently held. */
  run: (text: string, language: LanguageCode | null) => void
  reset: () => void
}

/**
 * The model-backed detection channel, and the wait for it.
 *
 * The heuristic channels in `checkDocument()` are instant, so every caller
 * shows those the moment they resolve. This hook runs the real classifier (see
 * `src/lib/detector/ml-classifier.ts`) separately, on the same device
 * (WebGPU when available, WASM otherwise) the Pro rewrite engine already picks
 * via `detectBrowserCapability()`. The document itself never leaves this
 * function: the model runs entirely in the tab, only its weights are fetched.
 *
 * `prewarm()` is why this hook reports `preparing` separately from `loading`.
 * The model's first load is tens of megabytes, and a caller that waits for the
 * rewritten text before starting it will always paint a complete-looking
 * analysis while the classifier that is meant to have produced it is still
 * downloading. Callers start the download when they know a classification is
 * coming, and hold the verdict behind `preparing` until it can actually be
 * answered.
 */
export function useMlClassifier(): MlClassifierHandle {
  const [result, setResult] = useState<MlClassifierResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const [progress, setProgress] = useState<MlClassifierProgress | null>(null)
  // Guards against a slower, stale run overwriting a faster, newer one.
  const requestId = useRef(0)
  // The model is ready once any load has completed in this tab. Kept in a ref
  // rather than state because it gates work, and re-rendering on it would be
  // one render for a fact nothing displays on its own.
  const warmed = useRef(false)

  const device = useCallback(async (): Promise<'webgpu' | 'wasm'> => {
    const capability = await detectBrowserCapability()
    return capability.hasWebGPU ? 'webgpu' : 'wasm'
  }, [])

  const prewarm = useCallback(() => {
    if (warmed.current) return
    setPreparing(true)
    void (async () => {
      await warmClassifier({
        device: await device(),
        onProgress: (info) => setProgress(info),
      })
      warmed.current = true
      setPreparing(false)
      setProgress(null)
    })()
  }, [device])

  const run = useCallback(
    (text: string, language: LanguageCode | null) => {
      const id = ++requestId.current
      setLoading(true)
      setProgress(null)
      setResult(null)
      if (!warmed.current) setPreparing(true)

      void (async () => {
        try {
          const classified = await classifyDocument(text, language, {
            device: await device(),
            onProgress: (info) => {
              if (id === requestId.current) setProgress(info)
            },
          })
          warmed.current = true
          if (id === requestId.current) setResult(classified)
        } catch (err) {
          if (id === requestId.current) {
            setResult({
              status: 'error',
              aiProbability: null,
              label: null,
              modelId: '',
              detail: (err as Error).message,
            })
          }
        } finally {
          if (id === requestId.current) {
            setLoading(false)
            setPreparing(false)
            setProgress(null)
          }
        }
      })()
    },
    [device],
  )

  const reset = useCallback(() => {
    requestId.current++
    setResult(null)
    setLoading(false)
    setProgress(null)
  }, [])

  return { result, loading, preparing, progress, prewarm, run, reset }
}
