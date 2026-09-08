'use client'

import { useCallback, useState } from 'react'
import { reduceEvidence, rewriteDocument, type RewriteResult } from '@/lib/rewrite'
import {
  createTransformersBrowserBackend,
  type BrowserBackendProgress,
} from '@/lib/rewrite/backend/browser'
import { PUBLIC_DETECTION_KEYS } from '@/lib/detector/public-keys'
import type { WorkspaceSettings } from './advanced-settings'
import type { EngineId } from './settings'
import { useProTrial, type ProTrialHandle } from './use-pro-trial'

/**
 * Choosing an engine, spending the weekly allowance, and running a rewrite.
 *
 * This is the single implementation of that sequence. It used to live inside
 * the homepage component, which meant the workspace could not rerun a document
 * or a single paragraph without either importing a page component or copying
 * a hundred lines of engine selection and fallback handling. Both surfaces call
 * this instead, so "what happens when the Pro engine cannot start" has one
 * answer rather than two that drift.
 *
 * EVERYTHING HERE RUNS ON THE VISITOR'S DEVICE. The only network call reachable
 * from this file is the weekly-allowance count inside ./use-pro-trial, which
 * carries no document, no hash and no word count.
 */

export interface RunOutcome {
  result: RewriteResult
  /** Which engine actually did the work, in the words the result panel shows. */
  engineUsed: string
  /** Set when the requested engine could not be used, saying exactly why. */
  downgraded: string | null
}

export type RunAttempt = ({ ok: true } & RunOutcome) | { ok: false; message: string }

export interface RewriteRunner {
  progress: BrowserBackendProgress | null
  trial: ProTrialHandle
  /** True for a paying subscriber, or for a trial endpoint that answered "unlimited". */
  isSubscriber: boolean
  /** Run one rewrite. Never throws; a failure comes back as `{ ok: false }`. */
  execute: (text: string, settings: WorkspaceSettings) => Promise<RunAttempt>
}

export function useRewriteRunner({ subscriber = false }: { subscriber?: boolean } = {}): RewriteRunner {
  const [progress, setProgress] = useState<BrowserBackendProgress | null>(null)
  const trial = useProTrial({ subscriber })
  // The server does not have to tell the page who is looking at it: the
  // allowance endpoint answers `unlimited` for a paying subscriber, which keeps
  // the marketing pages statically rendered on the CDN instead of becoming a
  // per-request function invocation just to read a session cookie.
  const isSubscriber = subscriber || trial.unlimited
  /*
    Depend on the claim function rather than on the handle.

    `useProTrial` returns a fresh object every render, so a callback that
    depended on the handle would get a new identity every render, and an effect
    downstream that depended on THAT would re-run forever. `claim` is itself a
    stable `useCallback`, so this keeps `execute` stable between renders.
  */
  const claim = trial.claim

  const execute = useCallback(
    async (text: string, settings: WorkspaceSettings): Promise<RunAttempt> => {
      setProgress(null)

      let engineId: EngineId = settings.engineId
      let downgraded: string | null = null

      try {
        if (engineId === 'pro') {
          const granted = await claim()
          if (!granted) {
            engineId = 'standard'
            downgraded =
              'Your free Pro-engine run for this week is already used, so this rewrite ran on the Standard engine.'
          }
        }

        if (engineId === 'pro') {
          try {
            const { backend, model, device } = await createTransformersBrowserBackend({
              tier: 'pro',
              onProgress: setProgress,
            })
            const res = await rewriteDocument(
              {
                text,
                language: settings.language || undefined,
                strength: settings.strength,
                tier: 'pro',
              },
              backend,
              PUBLIC_DETECTION_KEYS,
            )
            if (res.status !== 'ok') {
              return { ok: false, message: res.error ?? 'The rewrite could not be completed.' }
            }
            return {
              ok: true,
              result: res,
              engineUsed: `Pro engine · ${model.repo} on ${device === 'webgpu' ? 'WebGPU' : 'WASM (this device has no WebGPU)'}`,
              downgraded,
            }
          } catch (advancedErr) {
            // A real failure state: the local model genuinely could not load (no
            // WebGPU or WASM support, a blocked download, out of memory). Fall
            // back to the always-available engine and say exactly why, rather
            // than swallowing it or blocking on it.
            downgraded = `The Pro engine could not start on this device (${(advancedErr as Error).message}), so the rewrite ran on Standard instead.`
          }
        }

        const res = await reduceEvidence(
          {
            text,
            language: settings.language || undefined,
            strength: settings.strength,
            // A subscriber gets the extended tell library on the Standard engine
            // too; that is part of what the subscription buys.
            tier: isSubscriber ? 'pro' : 'free',
          },
          PUBLIC_DETECTION_KEYS,
        )
        if (res.status !== 'ok') {
          return { ok: false, message: res.error ?? 'The rewrite could not be completed.' }
        }
        return {
          ok: true,
          result: res,
          engineUsed: 'Standard engine · rule-based, no download',
          downgraded,
        }
      } catch (err) {
        return { ok: false, message: (err as Error).message || 'An unexpected error occurred.' }
      } finally {
        setProgress(null)
      }
    },
    [claim, isSubscriber],
  )

  return { progress, trial, isSubscriber, execute }
}
