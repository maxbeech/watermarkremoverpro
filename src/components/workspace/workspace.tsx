'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import * as Sentry from '@sentry/nextjs'
import {
  reduceEvidence,
  rewriteDocument,
  type RewriteResult,
} from '@/lib/rewrite'
import { createTransformersBrowserBackend, type BrowserBackendProgress } from '@/lib/rewrite/backend/browser'
import { PUBLIC_DETECTION_KEYS } from '@/lib/detector/public-keys'
import { countWords } from '@/lib/detector/tokenize'
import { buttonClass } from '@/components/brand/ui'
import { track } from '@/lib/openhelm-analytics'
import { DocumentInput } from './document-input'
import { AdvancedSettings, type WorkspaceSettings } from './advanced-settings'
import { DEFAULT_STRENGTH, type EngineId } from './settings'
import { useProTrial } from './use-pro-trial'
import { WorkspaceResult } from './workspace-result'

/**
 * The product's primary journey, start to finish, in one component.
 *
 * Paste (or drop, or upload) → one button → the cleaned-up text with the
 * detector's reading of it attached. That last part is the change worth
 * naming: checking used to be a separate feature on a separate page reached
 * by a separate nav item, and a visitor had to work out for themselves that
 * they probably wanted to do both. The rewrite already computes an analysis of
 * the document before and after in order to decide what to target, so showing
 * it costs nothing and answers the question the visitor actually came with.
 *
 * EVERYTHING BELOW RUNS ON THE VISITOR'S DEVICE. The only network call this
 * component's tree can make is the weekly-allowance count in ./use-pro-trial,
 * which carries no document, no hash and no word count.
 */

type Phase =
  | { kind: 'input' }
  | { kind: 'working' }
  | { kind: 'result'; result: RewriteResult; engineUsed: string; downgraded: string | null }
  | { kind: 'error'; message: string }

export function Workspace({
  subscriber = false,
  autoFocusHeading,
}: {
  /** Whether the visitor holds a paid Pro plan. Resolved on the server. */
  subscriber?: boolean
  autoFocusHeading?: string
}) {
  const [text, setText] = useState('')
  const [phase, setPhase] = useState<Phase>({ kind: 'input' })
  const [fileError, setFileError] = useState<string | null>(null)
  const [progress, setProgress] = useState<BrowserBackendProgress | null>(null)
  const [settings, setSettings] = useState<WorkspaceSettings>({
    language: '',
    strength: DEFAULT_STRENGTH,
    engineId: 'standard',
  })

  const surfaceRef = useRef<HTMLDivElement>(null)
  const trial = useProTrial({ subscriber })
  // The server does not have to tell this page who is looking at it: the
  // allowance endpoint answers `unlimited` for a paying subscriber, which
  // keeps the homepage statically rendered on the CDN instead of becoming a
  // per-request function invocation just to read a session cookie.
  const isSubscriber = subscriber || trial.unlimited
  const words = useMemo(() => countWords(text), [text])
  const busy = phase.kind === 'working'

  /**
   * Bring the result into view when it arrives.
   *
   * The tool sits under the hero copy, so on a laptop the top of a fresh
   * result lands just below the fold and the page looks unchanged to someone
   * who has just pressed a button and is waiting for something to happen.
   * Honours reduced-motion by jumping rather than gliding.
   */
  useEffect(() => {
    if (phase.kind !== 'result') return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    surfaceRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
  }, [phase.kind])

  const run = useCallback(async () => {
    setPhase({ kind: 'working' })
    setProgress(null)
    setFileError(null)
    track('rewrite_started', { engine_id: settings.engineId })

    // Yield a frame so the working state paints before the main thread is
    // taken by work that genuinely happens right here.
    await new Promise((r) => setTimeout(r, 16))

    let engineId: EngineId = settings.engineId
    let downgraded: string | null = null

    try {
      if (engineId === 'pro') {
        const granted = await trial.claim()
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
            { text, language: settings.language || undefined, strength: settings.strength, tier: 'pro' },
            backend,
            PUBLIC_DETECTION_KEYS,
          )
          if (res.status !== 'ok') {
            track('rewrite_failed', { engine_id: 'pro' })
            setPhase({ kind: 'error', message: res.error ?? 'The rewrite could not be completed.' })
            return
          }
          track('rewrite_completed', { engine_id: 'pro', device, downgraded: Boolean(downgraded) })
          setPhase({
            kind: 'result',
            result: res,
            engineUsed: `Pro engine · ${model.repo} on ${device === 'webgpu' ? 'WebGPU' : 'WASM (this device has no WebGPU)'}`,
            downgraded,
          })
          return
        } catch (advancedErr) {
          // A real failure state: the local model genuinely could not load (no
          // WebGPU or WASM support, a blocked download, out of memory). Fall
          // back to the always-available engine and say exactly why, rather
          // than swallowing it or blocking on it. Reported to Sentry because it
          // would otherwise leave no trace beyond the silent downgrade the
          // visitor sees, and the only sign anything went wrong is a message they
          // may not read.
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
          tier: isSubscriber ? 'pro' : 'free',
        },
        PUBLIC_DETECTION_KEYS,
      )
      if (res.status !== 'ok') {
        track('rewrite_failed', { engine_id: 'standard' })
        setPhase({ kind: 'error', message: res.error ?? 'The rewrite could not be completed.' })
        return
      }
      track('rewrite_completed', { engine_id: 'standard', downgraded: Boolean(downgraded) })
      setPhase({
        kind: 'result',
        result: res,
        engineUsed: 'Standard engine · rule-based, no download',
        downgraded,
      })
    } catch (err) {
      Sentry.captureException(err, { tags: { feature: 'rewrite' } })
      track('rewrite_failed', { engine_id: engineId, reason: 'exception' })
      setPhase({ kind: 'error', message: (err as Error).message || 'An unexpected error occurred.' })
    }
  }, [text, settings, trial, isSubscriber])

  if (phase.kind === 'result') {
    return (
      <div ref={surfaceRef}>
        <WorkspaceResult
          result={phase.result}
          engineUsed={phase.engineUsed}
          downgraded={phase.downgraded}
          onStartOver={() => {
            setPhase({ kind: 'input' })
            setProgress(null)
          }}
        />
      </div>
    )
  }

  return (
    <div ref={surfaceRef} className="space-y-4">
      <DocumentInput
        value={text}
        onChange={setText}
        disabled={busy}
        rows={9}
        words={words}
        wordCap={null}
        onFileError={setFileError}
        placeholder={
          autoFocusHeading ??
          'Paste your text here, or drop a file anywhere on this box. Nothing is uploaded.'
        }
        toolbar={
          <button
            type="button"
            onClick={run}
            disabled={busy || words === 0}
            className={buttonClass('primary', 'disabled:bg-ink-300 disabled:text-white')}
          >
            {busy ? (
              <>
                <Spinner />
                Working on your device…
              </>
            ) : (
              'Clean up my text'
            )}
          </button>
        }
      />

      {fileError && (
        <p className="rounded-[var(--radius-control)] border border-signal-200 bg-signal-50 px-4 py-3 text-sm text-signal-800">
          {fileError}
        </p>
      )}

      {busy && progress && (
        <p className="rounded-[var(--radius-control)] border border-ink-200 bg-ink-50 px-4 py-3 text-sm text-ink-600" role="status">
          Downloading the Pro engine to your browser: {progress.status}
          {progress.file ? ` · ${progress.file}` : ''}
          {typeof progress.progress === 'number' ? ` (${Math.round(progress.progress)}%)` : ''}
        </p>
      )}

      {phase.kind === 'error' && (
        <div className="rounded-[var(--radius-control)] border border-signal-300 bg-signal-50 px-4 py-3 text-sm text-signal-800">
          <p className="font-semibold">The rewrite did not run.</p>
          <p className="mt-1">{phase.message}</p>
        </div>
      )}

      <AdvancedSettings
        settings={settings}
        onChange={setSettings}
        disabled={busy}
        trial={trial.status}
        subscriber={isSubscriber}
        trialLoading={trial.loading}
      />

      <p className="text-center text-[13px] text-ink-500">
        Free, no account needed. Your text is processed in this browser tab and never uploaded.{' '}
        <Link href="/method" className="link-quiet">
          Here is how that works
        </Link>
        .
      </p>
    </div>
  )
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
    />
  )
}
