'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as Sentry from '@sentry/nextjs'
import { countWords } from '@/lib/detector/tokenize'
import { buttonClass } from '@/components/brand/ui'
import { track } from '@/lib/openhelm-analytics'
import { stageRun } from '@/lib/workspace/handoff'
import { saveRun } from '@/lib/workspace/history'
import { newRun } from '@/lib/workspace/runs'
import { workspaceUrl } from '@/lib/workspace/route'
import { DocumentInput } from './document-input'
import { AdvancedSettings, type WorkspaceSettings } from './advanced-settings'
import { DEFAULT_STRENGTH } from './settings'
import { useProTrial } from './use-pro-trial'

/**
 * The front door: put text in, and get taken to the workspace.
 *
 * This component used to run the rewrite and then render the result inline
 * underneath the marketing copy, which meant the most involved screen in the
 * product (a rewritten document, a diff, an analysis, per-paragraph controls)
 * lived halfway down a landing page with a footer under it. Pressing the button
 * now opens the workspace at /app, which is a real application shell with a
 * history sidebar, and the draft travels there in memory rather than through a
 * server or a query string.
 *
 * NOTHING HERE IS UPLOADED. The draft goes into this browser's own database and
 * is rewritten in the next page's JavaScript. The only network call in this
 * tree is the weekly-allowance count in ./use-pro-trial, which carries no
 * document, no hash and no word count.
 */
export function Workspace({
  subscriber = false,
  autoFocusHeading,
}: {
  /** Whether the visitor holds a paid Pro plan. Resolved on the server. */
  subscriber?: boolean
  autoFocusHeading?: string
}) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [fileError, setFileError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [opening, setOpening] = useState(false)
  const [settings, setSettings] = useState<WorkspaceSettings>({
    language: '',
    strength: DEFAULT_STRENGTH,
    engineId: 'standard',
  })

  const trial = useProTrial({ subscriber })
  const isSubscriber = subscriber || trial.unlimited
  const words = useMemo(() => countWords(text), [text])

  const open = useCallback(async () => {
    setOpening(true)
    setError(null)
    setFileError(null)
    // Metadata only, as everywhere else on this path: which engine was chosen,
    // never the draft, its length or anything derived from its content. The
    // rewrite itself is instrumented where it runs, in ./use-rewrite-runner.
    track('workspace_opened', { engine_id: settings.engineId })
    try {
      const record = newRun(text, settings)
      // Staged in memory first so the handoff works even where the browser
      // refuses storage; the database copy is what survives a reload.
      stageRun(record)
      await saveRun(record)
      router.push(workspaceUrl(record.id))
    } catch (err) {
      Sentry.captureException(err, { tags: { feature: 'workspace_handoff' } })
      track('workspace_open_failed')
      setOpening(false)
      setError((err as Error).message || 'The workspace could not be opened.')
    }
  }, [router, settings, text])

  return (
    <div className="space-y-4">
      <DocumentInput
        value={text}
        onChange={setText}
        disabled={opening}
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
            onClick={open}
            disabled={opening || words === 0}
            className={buttonClass('primary')}
          >
            {opening ? (
              <>
                <Spinner />
                Opening the workspace…
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

      {error && (
        <div className="rounded-[var(--radius-control)] border border-signal-300 bg-signal-50 px-4 py-3 text-sm text-signal-800">
          <p className="font-semibold">The workspace did not open.</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      <AdvancedSettings
        settings={settings}
        onChange={setSettings}
        disabled={opening}
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
