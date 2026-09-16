'use client'

import { useCallback, useState } from 'react'
import * as Sentry from '@sentry/nextjs'
import { reduceEvidence, rewriteDocument, type RewriteResult } from '@/lib/rewrite'
import {
  createTransformersBrowserBackend,
  type BrowserBackendProgress,
} from '@/lib/rewrite/backend/browser'
import { PUBLIC_DETECTION_KEYS } from '@/lib/detector/public-keys'
import { describeReset, tokensIn } from '@/lib/entitlements/rewrite-budget'
import { track } from '@/lib/openhelm-analytics'
import type { WorkspaceSettings } from './advanced-settings'
import type { EngineId } from './settings'
import { useRewriteBudget, type RewriteBudgetHandle } from './use-rewrite-budget'

/**
 * Choosing an engine, spending the weekly correction budget, and running a
 * rewrite.
 *
 * This is the single implementation of that sequence. It used to live inside
 * the homepage component, which meant the workspace could not rerun a document
 * or a single paragraph without either importing a page component or copying
 * a hundred lines of engine selection and fallback handling. Both surfaces call
 * this instead, so "what happens when the Pro engine cannot start" has one
 * answer rather than two that drift.
 *
 * TWO BOUNDARIES, and they are different in kind:
 *
 *   the Pro engine   A paid feature. A free visitor does not get it at all,
 *                    not a taste of it: a rewrite that asks for it without a
 *                    subscription runs on Standard and says so.
 *
 *   the budget       How much CORRECTION a free visitor gets per week, counted
 *                    in tokens against the text actually submitted. CHECKING IS
 *                    NEVER METERED, here or anywhere: nothing in this file
 *                    charges for a measurement.
 *
 * EVERYTHING HERE RUNS ON THE VISITOR'S DEVICE, including the budget, which is
 * counted in this browser's own storage (see ./use-rewrite-budget). There is no
 * network call reachable from this file except the analytics events below, and
 * none of those carries a document, a hash or a token count.
 */

export interface RunOutcome {
  result: RewriteResult
  /** Which engine actually did the work, in the words the result panel shows. */
  engineUsed: string
  /** Set when the requested engine could not be used, saying exactly why. */
  downgraded: string | null
  /** Tokens charged for this run. Zero for a subscriber, who has no budget. */
  tokensCharged: number
}

export type RunAttempt = ({ ok: true } & RunOutcome) | { ok: false; message: string }

export interface RewriteRunner {
  progress: BrowserBackendProgress | null
  budget: RewriteBudgetHandle
  /** True for a paying subscriber: unlimited correction, and the Pro engine. */
  isSubscriber: boolean
  /** Run one rewrite. Never throws; a failure comes back as `{ ok: false }`. */
  execute: (text: string, settings: WorkspaceSettings) => Promise<RunAttempt>
}

export function useRewriteRunner({ subscriber = false }: { subscriber?: boolean } = {}): RewriteRunner {
  const [progress, setProgress] = useState<BrowserBackendProgress | null>(null)
  const budget = useRewriteBudget({ subscriber })
  const spend = budget.spend

  const execute = useCallback(
    async (text: string, settings: WorkspaceSettings): Promise<RunAttempt> => {
      setProgress(null)
      track('rewrite_started', { engine_id: settings.engineId })

      let engineId: EngineId = settings.engineId
      let downgraded: string | null = null

      // Charged before any work starts, so a rewrite that runs is always a
      // rewrite that was paid for. A refusal is a hard stop with the reason,
      // never a quietly smaller rewrite.
      const cost = tokensIn(text)
      if (!subscriber) {
        if (!spend(cost)) {
          const back = describeReset(budget.status?.resetsAt ?? null)
          return {
            ok: false,
            message: `Your free rewriting allowance for this week is used up${
              back ? `; it starts refilling ${back}` : ''
            }. Checking your text stays free and unlimited in the meantime, and Pro removes the limit entirely.`,
          }
        }
        if (engineId === 'pro') {
          engineId = 'standard'
          downgraded =
            'The Pro engine is part of the Pro plan, so this rewrite ran on the Standard engine.'
        }
      }

      try {
        if (engineId === 'pro') {
          try {
            // Awaited in full: the model is loaded and ready before a single
            // passage is rewritten, so a result can never be presented as
            // though it came from an engine that had not finished downloading.
            const { backend, device } = await createTransformersBrowserBackend({
              tier: 'pro',
              onProgress: setProgress,
            })
            const res = await rewriteDocument(
              {
                text,
                language: settings.language || undefined,
                strength: settings.strength,
                tier: 'pro',
                excludedWords: settings.excludedWords,
              },
              backend,
              PUBLIC_DETECTION_KEYS,
            )
            if (res.status !== 'ok') {
              track('rewrite_failed', { engine_id: 'pro' })
              return { ok: false, message: res.error ?? 'The rewrite could not be completed.' }
            }
            track('rewrite_completed', { engine_id: 'pro', device, downgraded: Boolean(downgraded) })
            return {
              ok: true,
              result: res,
              engineUsed: 'Pro engine',
              downgraded,
              tokensCharged: subscriber ? 0 : cost,
            }
          } catch (advancedErr) {
            // A real failure state: the local model genuinely could not load (no
            // WebGPU or WASM support, a blocked download, out of memory). Fall
            // back to the always-available engine and say exactly why, rather
            // than swallowing it or blocking on it. Reported to Sentry because
            // it would otherwise leave no trace beyond the silent downgrade the
            // visitor sees, and the only sign anything went wrong is a message
            // they may not read.
            Sentry.captureException(advancedErr, { tags: { feature: 'rewrite_pro_engine' } })
            track('pro_engine_load_failed')
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
            tier: subscriber ? 'pro' : 'free',
            excludedWords: settings.excludedWords,
          },
          PUBLIC_DETECTION_KEYS,
        )
        if (res.status !== 'ok') {
          track('rewrite_failed', { engine_id: 'standard' })
          return { ok: false, message: res.error ?? 'The rewrite could not be completed.' }
        }
        track('rewrite_completed', { engine_id: 'standard', downgraded: Boolean(downgraded) })
        return {
          ok: true,
          result: res,
          engineUsed: 'Standard engine',
          downgraded,
          tokensCharged: subscriber ? 0 : cost,
        }
      } catch (err) {
        Sentry.captureException(err, { tags: { feature: 'rewrite' } })
        track('rewrite_failed', { engine_id: engineId, reason: 'exception' })
        return { ok: false, message: (err as Error).message || 'An unexpected error occurred.' }
      } finally {
        setProgress(null)
      }
    },
    [budget.status?.resetsAt, spend, subscriber],
  )

  return { progress, budget, isSubscriber: subscriber, execute }
}
