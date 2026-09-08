'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { checkDocument } from '@/lib/detector'
import { PUBLIC_DETECTION_KEYS } from '@/lib/detector/public-keys'
import { countWords } from '@/lib/detector/tokenize'
import { alignParagraphs, replaceRange } from '@/lib/diff/words'
import {
  clearRuns,
  deleteRun,
  historyAvailable,
  listRuns,
  loadRun,
  saveRun,
} from '@/lib/workspace/history'
import { stageRun, takeStagedRun } from '@/lib/workspace/handoff'
import { readIdentity, type AnonIdentity } from '@/lib/workspace/identity'
import { newRun, trimResultForStorage, type RunRecord } from '@/lib/workspace/runs'
import { RUN_PARAM, workspaceUrl } from '@/lib/workspace/route'
import { buttonClass } from '@/components/brand/ui'
import { DocumentInput } from '@/components/workspace/document-input'
import { AdvancedSettings, type WorkspaceSettings } from '@/components/workspace/advanced-settings'
import { DEFAULT_STRENGTH } from '@/components/workspace/settings'
import type { ProTrialHandle } from '@/components/workspace/use-pro-trial'
import { useRewriteRunner } from '@/components/workspace/use-rewrite-runner'
import { RunView } from './run-view'
import { Sidebar } from './sidebar'

/**
 * The workspace.
 *
 * Everything on this screen happens in this tab: the run is read from the
 * browser's own database, rewritten by the engine bundled with the page, and
 * written back. There is no request carrying a document anywhere in this file
 * or in anything it imports, which is the same guarantee the marketing pages
 * make and is enforced by tests/product-constraints.test.ts.
 *
 * The run id travels in a query parameter so the page itself stays a static
 * file on the CDN. Nothing about a run reaches the origin, including its id.
 */
export function WorkspaceApp({ subscriber = false }: { subscriber?: boolean }) {
  const router = useRouter()
  const params = useSearchParams()
  const activeId = params.get(RUN_PARAM)

  const runner = useRewriteRunner({ subscriber })

  const [identity, setIdentity] = useState<AnonIdentity | null>(null)
  const [storage, setStorage] = useState<boolean | null>(null)
  const [runs, setRuns] = useState<RunRecord[]>([])
  const [record, setRecord] = useState<RunRecord | null>(null)
  const [missing, setMissing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [busyParagraph, setBusyParagraph] = useState<number | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const [draft, setDraft] = useState('')
  const [fileError, setFileError] = useState<string | null>(null)
  const [settings, setSettings] = useState<WorkspaceSettings>({
    language: '',
    strength: DEFAULT_STRENGTH,
    engineId: 'standard',
  })

  /** A queued run is executed exactly once, however often this component renders. */
  const started = useRef<Set<string>>(new Set())

  const refreshList = useCallback(async () => {
    setRuns(await listRuns())
  }, [])

  useEffect(() => {
    setIdentity(readIdentity())
    void historyAvailable().then(setStorage)
    void refreshList()
  }, [refreshList])

  useEffect(() => setDrawerOpen(false), [activeId])

  /** Persist, then keep the sidebar and the open run in step with what was stored. */
  const commit = useCallback(
    async (next: RunRecord): Promise<RunRecord> => {
      const stored = await saveRun(next)
      setRecord(stored)
      await refreshList()
      return stored
    },
    [refreshList],
  )

  /** Rewrite a whole document into a record, storing the outcome either way. */
  const execute = useCallback(
    async (base: RunRecord, text: string, using: WorkspaceSettings): Promise<RunRecord> => {
      const attempt = await runner.execute(text, using)
      if (!attempt.ok) {
        return commit({ ...base, status: 'error', error: attempt.message, settings: using })
      }
      return commit({
        ...base,
        status: 'done',
        error: null,
        settings: using,
        revisedText: attempt.result.revisedText,
        engineUsed: attempt.engineUsed,
        downgraded: attempt.downgraded,
        words: countWords(attempt.result.revisedText),
        result: trimResultForStorage(attempt.result),
      })
    },
    [commit, runner],
  )

  /*
    Held in a ref so the effect below can depend on the run id alone.

    `execute` closes over the weekly-allowance handle, which is re-created
    whenever that allowance resolves; an effect that listed it as a dependency
    would re-read the run from the database on every one of those renders.
  */
  const executeRef = useRef(execute)
  useEffect(() => {
    executeRef.current = execute
  }, [execute])

  /* --------------------------------------------- open whatever the URL asks for */
  useEffect(() => {
    if (!activeId) {
      setRecord(null)
      setMissing(false)
      setNotice(null)
      return
    }

    let live = true
    void (async () => {
      const found = takeStagedRun(activeId) ?? (await loadRun(activeId))
      if (!live) return

      if (!found) {
        setRecord(null)
        setMissing(true)
        return
      }

      setMissing(false)
      setNotice(null)
      setRecord(found)
      setSettings(found.settings)

      if (found.status !== 'done' && found.status !== 'error' && !started.current.has(found.id)) {
        started.current.add(found.id)
        setBusy(true)
        try {
          // Yield a frame so the working state paints before the main thread is
          // taken by work that genuinely happens right here.
          await new Promise((r) => setTimeout(r, 16))
          await executeRef.current(
            { ...found, status: 'running' },
            found.originalText,
            found.settings,
          )
        } finally {
          /*
            Deliberately not gated on `live`.

            React's strict mode runs an effect, tears it down and runs it again.
            The first pass owns the in-flight rewrite and the second is refused
            it by `started`, so gating this on the first pass still being the
            live one leaves the whole screen disabled forever behind a spinner
            that never stops. Whoever finishes the work clears the flag.
          */
          setBusy(false)
        }
      }
    })()

    return () => {
      live = false
    }
  }, [activeId])

  /* ------------------------------------------------------------- the actions */

  /**
   * Queue a draft and hand it to the loader above.
   *
   * The record is written before the URL changes so there is exactly one place
   * that turns a queued run into a finished one, whether it was queued on the
   * marketing page or right here.
   */
  const startNew = useCallback(async () => {
    const created = newRun(draft, settings)
    stageRun(created)
    await saveRun(created)
    await refreshList()
    setDraft('')
    router.replace(workspaceUrl(created.id))
  }, [draft, refreshList, router, settings])

  const rerunAll = useCallback(async () => {
    if (!record) return
    setBusy(true)
    setNotice(null)
    const before = record.revisedText
    const next = await execute(
      { ...record, status: 'running', revision: record.revision + 1, rephrased: {} },
      record.originalText,
      settings,
    )
    setBusy(false)
    if (next.status === 'done' && next.revisedText === before) {
      setNotice(
        'That pass produced exactly the same text. The Standard engine is deterministic, so the same draft at the same strength always gives the same result. Change the strength or the engine under Advanced settings, or rewrite individual paragraphs below.',
      )
    }
  }, [execute, record, settings])

  /**
   * Store a document assembled from paragraph-level edits, and re-measure it.
   *
   * The rewrite result keeps every count it earned on its own pass; only the
   * text and the analysis OF that text are replaced, because those are the only
   * two things a paragraph edit actually changes. Re-running the whole document
   * to refresh the summary would be a different rewrite, not a measurement of
   * this one.
   */
  const commitRevised = useCallback(
    async (source: RunRecord, text: string, rephrased: Record<number, number>) => {
      let analysis = null
      try {
        analysis = await checkDocument(text, {
          keys: PUBLIC_DETECTION_KEYS,
          language: settings.language || undefined,
        })
      } catch (err) {
        setNotice(
          `The paragraph was rewritten, but the document could not be measured again (${(err as Error).message}). The figures above are from the previous pass.`,
        )
      }
      await commit({
        ...source,
        settings,
        revisedText: text,
        words: countWords(text),
        rephrased,
        result: source.result
          ? {
              ...source.result,
              revisedText: text,
              documentAfter: analysis ?? source.result.documentAfter,
            }
          : null,
      })
    },
    [commit, settings],
  )

  /**
   * Send one or more paragraphs back through the engine on their own.
   *
   * Each starts from the text currently shown for that paragraph rather than
   * from the draft, which is what makes a second pass produce something new,
   * and each uses whatever strength and engine are currently set rather than
   * the ones the first pass ran with: a reader who raises the strength and then
   * presses "rewrite again" is asking for the strength they just chose.
   * Replacements are applied back to front so an earlier one cannot shift the
   * offsets of a later one.
   */
  const rephrase = useCallback(
    async (indices: number[]) => {
      if (!record || indices.length === 0) return
      const alignment = alignParagraphs(record.originalText, record.revisedText)
      if (!alignment.aligned) return

      setBusy(true)
      setNotice(null)

      let text = record.revisedText
      const rephrased = { ...record.rephrased }
      let changed = false
      let failure: string | null = null

      for (const index of [...indices].sort((a, b) => b - a)) {
        const pair = alignment.pairs[index]
        if (!pair) continue
        setBusyParagraph(index)
        const attempt = await runner.execute(pair.after, settings)
        if (!attempt.ok) {
          failure = attempt.message
          break
        }
        const rewritten = attempt.result.revisedText.trim()
        if (rewritten.length > 0 && rewritten !== pair.after) {
          text = replaceRange(text, pair.start, pair.end, rewritten)
          rephrased[index] = (rephrased[index] ?? 0) + 1
          changed = true
        }
      }

      setBusyParagraph(null)

      if (failure) {
        setBusy(false)
        setNotice(`That paragraph could not be rewritten: ${failure}`)
        return
      }

      if (!changed) {
        setBusy(false)
        setNotice(
          `Another pass over ${indices.length === 1 ? 'that paragraph' : 'those paragraphs'} found nothing further it could safely change. Every candidate has to keep the numbers, negations and named entities intact and stay close in meaning; none did. A higher strength, or the Pro engine, targets more.`,
        )
        return
      }

      await commitRevised(record, text, rephrased)
      setBusy(false)
    },
    [commitRevised, record, runner, settings],
  )

  /** Put one paragraph back to exactly what the visitor wrote. */
  const restore = useCallback(
    async (index: number) => {
      if (!record) return
      const alignment = alignParagraphs(record.originalText, record.revisedText)
      if (!alignment.aligned) return
      const pair = alignment.pairs[index]
      if (!pair) return

      setBusy(true)
      setNotice(null)
      const rephrased = { ...record.rephrased }
      delete rephrased[index]
      await commitRevised(
        record,
        replaceRange(record.revisedText, pair.start, pair.end, pair.before),
        rephrased,
      )
      setBusy(false)
    },
    [commitRevised, record],
  )

  const remove = useCallback(
    async (id: string) => {
      await deleteRun(id)
      await refreshList()
      if (id === activeId) router.replace(workspaceUrl())
    },
    [activeId, refreshList, router],
  )

  const clearAll = useCallback(async () => {
    await clearRuns()
    await refreshList()
    router.replace(workspaceUrl())
  }, [refreshList, router])

  const progressNote = useMemo(() => {
    if (!runner.progress) return null
    const { status, file, progress } = runner.progress
    return `Downloading the Pro engine to your browser: ${status}${file ? ` · ${file}` : ''}${
      typeof progress === 'number' ? ` (${Math.round(progress)}%)` : ''
    }`
  }, [runner.progress])

  const sidebar = (onNavigate?: () => void) => (
    <Sidebar
      identity={identity}
      runs={runs}
      activeId={activeId}
      storageAvailable={storage}
      onDelete={remove}
      onClearAll={clearAll}
      onNavigate={onNavigate}
    />
  )

  const showRun = record !== null && (record.result !== null || record.status === 'error')

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-ink-50">
      <aside className="hidden w-72 shrink-0 lg:block">{sidebar()}</aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close the menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-ink-900/50"
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-[var(--shadow-raised)]">
            {sidebar(() => setDrawerOpen(false))}
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-ink-200 bg-white px-4 py-3 lg:hidden">
          <button
            type="button"
            aria-label="Open your rewrites"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-700 transition-colors hover:bg-ink-100"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <span className="truncate text-sm font-semibold text-ink-900">
            {record ? record.title : 'Workspace'}
          </span>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-5xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
            {busy && !showRun && (
              <Working label={progressNote ?? 'Working on your device…'} />
            )}

            {missing && !busy && <NotFound />}

            {showRun && record && (
              <RunView
                record={record}
                settings={settings}
                onSettingsChange={setSettings}
                onRerunAll={rerunAll}
                onRephrase={rephrase}
                onRestore={restore}
                busy={busy}
                busyParagraph={busyParagraph}
                trial={runner.trial}
                subscriber={runner.isSubscriber}
                progressNote={progressNote}
              />
            )}

            {notice && (
              <p className="rounded-[var(--radius-control)] border border-seal-200 bg-seal-50 px-4 py-3 text-sm leading-relaxed text-seal-800">
                {notice}
              </p>
            )}

            {!activeId && !busy && (
              <NewRun
                draft={draft}
                onDraftChange={setDraft}
                fileError={fileError}
                onFileError={setFileError}
                settings={settings}
                onSettingsChange={setSettings}
                trial={runner.trial}
                subscriber={runner.isSubscriber}
                onStart={startNew}
                previousCount={runs.length}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------- fragments */

function Working({ label }: { label: string }) {
  return (
    <div
      role="status"
      className="flex items-center gap-3 rounded-[var(--radius-panel)] border border-ink-200 bg-white px-5 py-5 text-sm text-ink-700"
    >
      <span
        aria-hidden="true"
        className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-ink-200 border-t-ink-800"
      />
      {label}
    </div>
  )
}

function NotFound() {
  return (
    <div className="rounded-[var(--radius-panel)] border border-ink-200 bg-white p-6">
      <h1 className="t-heading text-ink-900">That rewrite is not in this browser</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-600">
        The workspace history lives in this browser&apos;s own database and nowhere else, so a link
        opened on another device, in another browser, or after the site data was cleared has nothing
        to load. Start a new one instead.
      </p>
      <Link
        href={workspaceUrl()}
        className={buttonClass('primary', 'mt-5')}
      >
        Start a new rewrite
      </Link>
    </div>
  )
}

function NewRun({
  draft,
  onDraftChange,
  fileError,
  onFileError,
  settings,
  onSettingsChange,
  trial,
  subscriber,
  onStart,
  previousCount,
}: {
  draft: string
  onDraftChange: (text: string) => void
  fileError: string | null
  onFileError: (message: string | null) => void
  settings: WorkspaceSettings
  onSettingsChange: (next: WorkspaceSettings) => void
  trial: ProTrialHandle
  subscriber: boolean
  onStart: () => void
  previousCount: number
}) {
  const words = countWords(draft)
  return (
    <div className="space-y-4">
      <div>
        <h1 className="t-title text-ink-900">Clean up a draft</h1>
        <p className="t-lead mt-3 max-w-2xl text-ink-600">
          Paste it, drop a file on the box, or upload one. It is rewritten in this tab, measured in
          this tab, and kept in this browser.
          {previousCount > 0 &&
            ` Your last ${previousCount === 1 ? 'rewrite is' : `${previousCount} rewrites are`} in the sidebar.`}
        </p>
      </div>

      <DocumentInput
        value={draft}
        onChange={onDraftChange}
        rows={12}
        words={words}
        wordCap={null}
        onFileError={onFileError}
        placeholder="Paste your text here, or drop a file anywhere on this box. Nothing is uploaded."
        toolbar={
          <button
            type="button"
            onClick={onStart}
            disabled={words === 0}
            className={buttonClass('primary')}
          >
            Clean up my text
          </button>
        }
      />

      {fileError && (
        <p className="rounded-[var(--radius-control)] border border-signal-200 bg-signal-50 px-4 py-3 text-sm text-signal-800">
          {fileError}
        </p>
      )}

      <AdvancedSettings
        settings={settings}
        onChange={onSettingsChange}
        disabled={false}
        trial={trial.status}
        subscriber={subscriber}
        trialLoading={trial.loading}
      />
    </div>
  )
}
