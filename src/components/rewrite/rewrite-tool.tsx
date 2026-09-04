'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { reduceEvidence, rewriteDocument, type RewriteResult, type Strength, type Tier } from '@/lib/rewrite'
import { createTransformersBrowserBackend, type BrowserBackendProgress } from '@/lib/rewrite/backend/browser'
import { PUBLIC_DETECTION_KEYS } from '@/lib/detector/public-keys'
import { SUPPORTED_LANGUAGES, LANGUAGE_NAMES, type LanguageCode } from '@/lib/detector/languages'

type ModelChoice = 'standard' | 'advanced'

const STRENGTH_OPTIONS: { value: Strength; label: string; description: string }[] = [
  {
    value: 'preserve',
    label: 'Preserve',
    description: 'Only touches passages a real check would flag as a finding.',
  },
  {
    value: 'balanced',
    label: 'Balanced',
    description: 'Also touches passages with a notable but uncorrected signal.',
  },
  {
    value: 'aggressive',
    label: 'Aggressive',
    description: 'Touches any passage the detector could measure at all.',
  },
  {
    value: 'regenerate',
    label: 'Regenerate',
    description: 'Rewrites every passage, regardless of measured evidence.',
  },
]

/**
 * The rewrite tool. Runs entirely in the browser: `reduceEvidence` is
 * isomorphic, so this component makes no network call for the rewrite itself.
 * A `PerformanceObserver`-backed request count (see TrustIndicator) makes that
 * a verifiable claim rather than a bare assertion.
 */
export function RewriteTool() {
  const [text, setText] = useState('')
  const [language, setLanguage] = useState('')
  const [strength, setStrength] = useState<Strength>('balanced')
  const [tier, setTier] = useState<Tier>('free')
  const [modelChoice, setModelChoice] = useState<ModelChoice>('standard')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<RewriteResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [modelProgress, setModelProgress] = useState<BrowserBackendProgress | null>(null)
  const [backendUsed, setBackendUsed] = useState<string | null>(null)
  const [fallbackNote, setFallbackNote] = useState<string | null>(null)

  const wordCount = useMemo(() => text.trim().split(/\s+/).filter(Boolean).length, [text])

  const handleTierChange = useCallback((next: Tier) => {
    setTier(next)
    if (next === 'free') setModelChoice('standard') // the advanced local-LLM download is a Pro-tier option only
  }, [])

  const handleRewrite = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setModelProgress(null)
    setFallbackNote(null)
    try {
      if (modelChoice === 'advanced') {
        try {
          const { backend, model, device } = await createTransformersBrowserBackend({
            tier,
            onProgress: (info) => setModelProgress(info),
          })
          const res = await rewriteDocument(
            { text, language: language || undefined, strength, tier },
            backend,
            PUBLIC_DETECTION_KEYS,
          )
          if (res.status !== 'ok') {
            setError(res.error ?? 'The rewrite could not be completed.')
            setResult(null)
            return
          }
          setBackendUsed(`Advanced: ${model.repo} on ${device === 'webgpu' ? 'WebGPU' : 'WASM (no WebGPU on this device)'}`)
          setResult(res)
          return
        } catch (advancedErr) {
          // Real failure state: the local model genuinely could not load
          // (no WebGPU/WASM support, a blocked download, out of memory).
          // Fall back to the always-available rule-based backend and say so,
          // rather than silently swallowing the error or blocking on it.
          setFallbackNote(
            `Advanced (on-device model) unavailable on this device: ${(advancedErr as Error).message}. Used Standard instead.`,
          )
        }
      }

      const res = await reduceEvidence(
        { text, language: language || undefined, strength, tier },
        PUBLIC_DETECTION_KEYS,
      )
      if (res.status !== 'ok') {
        setError(res.error ?? 'The rewrite could not be completed.')
        setResult(null)
        return
      }
      setBackendUsed('Standard: rule-based, no download')
      setResult(res)
    } catch (err) {
      setError((err as Error).message || 'An unexpected error occurred.')
      setResult(null)
    } finally {
      setIsLoading(false)
    }
  }, [text, language, strength, tier, modelChoice])

  return (
    <div className="space-y-6">
      <TrustIndicator active={isLoading} expectModelDownload={modelChoice === 'advanced'} />

      <div className="space-y-4 rounded-lg border border-ink-200 bg-white p-5 shadow-[var(--shadow-panel)]">
        <div>
          <p className="t-eyebrow mb-2">Input</p>
          <h3 className="t-heading text-ink-900">Paste the text to rewrite</h3>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isLoading}
          placeholder="Paste text here. It is rewritten entirely on your device; nothing is uploaded."
          className="min-h-48 w-full resize-none rounded border border-ink-200 bg-white p-3 font-mono text-sm text-ink-900 placeholder-ink-400 focus:border-seal-500 focus:outline-none focus:ring-1 focus:ring-seal-500 disabled:bg-ink-50 disabled:text-ink-500"
        />
        <p className="text-xs text-ink-500">
          {wordCount} word{wordCount !== 1 ? 's' : ''}, 100% on-device processing
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="rewrite-language" className="block text-xs font-medium text-ink-700">
              Language
            </label>
            <select
              id="rewrite-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={isLoading}
              className="mt-1 block w-full rounded border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:border-seal-500 focus:outline-none focus:ring-1 focus:ring-seal-500 disabled:bg-ink-50 disabled:text-ink-500"
            >
              <option value="">Auto-detect</option>
              {SUPPORTED_LANGUAGES.map((code: LanguageCode) => (
                <option key={code} value={code}>
                  {LANGUAGE_NAMES[code]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="rewrite-tier" className="block text-xs font-medium text-ink-700">
              Model tier
            </label>
            <select
              id="rewrite-tier"
              value={tier}
              onChange={(e) => handleTierChange(e.target.value as Tier)}
              disabled={isLoading}
              className="mt-1 block w-full rounded border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:border-seal-500 focus:outline-none focus:ring-1 focus:ring-seal-500 disabled:bg-ink-50 disabled:text-ink-500"
            >
              <option value="free">Standard (free, unlimited)</option>
              <option value="pro">Advanced (Pro, unlimited)</option>
            </select>
          </div>
        </div>

        {tier === 'pro' && (
          <div>
            <label htmlFor="rewrite-model" className="block text-xs font-medium text-ink-700">
              Rewrite engine
            </label>
            <select
              id="rewrite-model"
              value={modelChoice}
              onChange={(e) => setModelChoice(e.target.value as ModelChoice)}
              disabled={isLoading}
              className="mt-1 block w-full rounded border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:border-seal-500 focus:outline-none focus:ring-1 focus:ring-seal-500 disabled:bg-ink-50 disabled:text-ink-500"
            >
              <option value="standard">Standard: rule-based, instant, no download</option>
              <option value="advanced">Advanced: real local LLM, downloads on first use</option>
            </select>
            {modelChoice === 'advanced' && (
              <p className="mt-1 text-xs text-ink-500">
                Downloads a small language model straight from the Hugging Face CDN and runs it in your
                browser (WebGPU if available, WASM otherwise). Never from a MarkWitness-operated server.
                Cached after the first run. Falls back to Standard automatically if this device can't run it.
              </p>
            )}
          </div>
        )}

        {modelProgress && (
          <p className="text-xs text-ink-500" role="status">
            {modelProgress.status}
            {modelProgress.file ? `: ${modelProgress.file}` : ''}
            {typeof modelProgress.progress === 'number' ? ` (${Math.round(modelProgress.progress)}%)` : ''}
          </p>
        )}

        <StrengthSlider value={strength} onChange={setStrength} disabled={isLoading} />

        <button
          onClick={handleRewrite}
          disabled={isLoading || text.trim().length === 0}
          className="inline-flex w-full items-center justify-center gap-2 rounded-[3px] bg-seal-600 px-5 py-2.5 text-sm font-medium text-white shadow-[var(--shadow-panel)] transition-[background-color,box-shadow] duration-150 hover:bg-seal-700 hover:shadow-[var(--shadow-raised)] active:translate-y-[0.5px] disabled:cursor-not-allowed disabled:bg-seal-400 disabled:shadow-[var(--shadow-panel)] sm:w-auto"
        >
          {isLoading ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Rewriting on your device...
            </>
          ) : (
            'Reduce evidence'
          )}
        </button>
      </div>

      {fallbackNote && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">Fell back to Standard</p>
          <p className="mt-1 text-sm text-amber-700">{fallbackNote}</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-signal-200 bg-signal-50 p-4">
          <p className="text-sm font-medium text-signal-900">Error</p>
          <p className="mt-1 text-sm text-signal-700">{error}</p>
        </div>
      )}

      {result && <RewriteResultView result={result} backendUsed={backendUsed} />}
    </div>
  )
}

function StrengthSlider({
  value,
  onChange,
  disabled,
}: {
  value: Strength
  onChange: (s: Strength) => void
  disabled: boolean
}) {
  const index = STRENGTH_OPTIONS.findIndex((o) => o.value === value)
  const current = STRENGTH_OPTIONS[index]

  return (
    <div>
      <label htmlFor="rewrite-strength" className="block text-xs font-medium text-ink-700">
        Strength
      </label>
      <input
        id="rewrite-strength"
        type="range"
        min={0}
        max={STRENGTH_OPTIONS.length - 1}
        step={1}
        value={index}
        disabled={disabled}
        onChange={(e) => onChange(STRENGTH_OPTIONS[Number(e.target.value)].value)}
        className="mt-2 w-full accent-seal-600"
      />
      <div className="mt-1 flex justify-between text-[11px] text-ink-500">
        {STRENGTH_OPTIONS.map((o) => (
          <span key={o.value} className={o.value === value ? 'font-medium text-seal-700' : ''}>
            {o.label}
          </span>
        ))}
      </div>
      <p className="mt-2 text-xs text-ink-600">{current.description}</p>
    </div>
  )
}

/**
 * Counts fetch()/XHR calls this page's own code makes while a rewrite is
 * actually running, so the on-device claim is something a reader can verify
 * rather than take on trust. Deliberately scoped to fetch/XHR (the only
 * mechanisms this app could use to send your text anywhere) and to the
 * rewrite operation's own time window, not passive resource loads: counting
 * every `resource` performance entry would also catch the dev server's own
 * hot-reload chatter and framework chunk loads, which are real but have
 * nothing to do with whether your TEXT left the device, and would make an
 * honest 0-requests guarantee read as broken.
 *
 * Splits calls by destination: same-origin (this app's own domain, the
 * thing the privacy claim is actually about, and must always read 0) versus
 * cross-origin (only ever the model-weight CDN when the Advanced engine is
 * downloading, an expected, disclosed exception that is not a text-privacy
 * concern). Collapsing those into one count would make a real model download
 * look like the exact violation this indicator exists to rule out.
 */
function TrustIndicator({ active, expectModelDownload }: { active: boolean; expectModelDownload: boolean }) {
  const [sameOrigin, setSameOrigin] = useState(0)
  const [crossOrigin, setCrossOrigin] = useState(0)
  const [hasRun, setHasRun] = useState(false)

  useEffect(() => {
    if (!active) return
    setSameOrigin(0)
    setCrossOrigin(0)
    setHasRun(true)

    const isSameOrigin = (url: unknown): boolean => {
      try {
        return new URL(String(url), window.location.href).origin === window.location.origin
      } catch {
        return true // an unparseable URL is treated as same-origin (fail toward flagging it, not hiding it)
      }
    }
    const record = (url: unknown) => (isSameOrigin(url) ? setSameOrigin((c) => c + 1) : setCrossOrigin((c) => c + 1))

    const originalFetch = window.fetch
    const originalOpen = window.XMLHttpRequest.prototype.open

    window.fetch = ((...args: Parameters<typeof fetch>) => {
      record(args[0] instanceof Request ? args[0].url : args[0])
      return originalFetch(...args)
    }) as typeof fetch

    window.XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, ...args: unknown[]) {
      record(args[1])
      return (originalOpen as (...a: unknown[]) => void).apply(this, args)
    } as typeof originalOpen

    return () => {
      window.fetch = originalFetch
      window.XMLHttpRequest.prototype.open = originalOpen
    }
  }, [active])

  const sameOriginText = `${sameOrigin} call${sameOrigin !== 1 ? 's' : ''} to this site`
  const crossOriginText = expectModelDownload
    ? ` (plus ${crossOrigin} to the model CDN, downloading the Advanced engine, not your text)`
    : crossOrigin > 0
      ? ` (plus ${crossOrigin} to another origin)`
      : ''

  return (
    <div className="flex items-center gap-2 rounded-lg border border-ink-200 bg-ink-50 px-4 py-2.5 text-xs text-ink-600">
      <span aria-hidden="true">🔒</span>
      <span>
        {active
          ? `Rewriting now: ${sameOriginText}${crossOriginText} so far.`
          : hasRun
            ? `Done: ${sameOriginText}${crossOriginText} while rewriting.`
            : 'Processed on your device. Click Reduce evidence and watch this line: it counts every fetch/XHR call this page makes while rewriting, live, split by destination.'}
      </span>
    </div>
  )
}

function RewriteResultView({ result, backendUsed }: { result: RewriteResult; backendUsed: string | null }) {
  const [copied, setCopied] = useState(false)
  const touchedPassages = result.passages.filter((p) => p.chosen !== null)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.revisedText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be denied by the browser; the text is still
      // visible in the panel below for the reader to select manually.
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-seal-200 bg-seal-50 p-5">
        <p className="text-sm font-medium text-seal-900">
          {touchedPassages.length} of {result.passages.length} targeted passage
          {result.passages.length !== 1 ? 's' : ''} rewritten, plus {result.tellChangeCount} AI-tell
          swap{result.tellChangeCount !== 1 ? 's' : ''} (em dashes, stock phrasing), in{' '}
          {result.roundsUsed} round{result.roundsUsed !== 1 ? 's' : ''}
        </p>
        {backendUsed && <p className="mt-1 text-xs text-seal-700">Engine: {backendUsed}</p>}
        {touchedPassages.length === 0 && result.tellChangeCount === 0 && (
          <p className="mt-2 text-sm text-seal-800">
            No detectable AI-style evidence found to reduce at this strength. Try a higher strength,
            or this passage may already read as ordinary prose.
          </p>
        )}
        <EvidenceComparison result={result} />
      </div>

      <div className="rounded-lg border border-ink-200 bg-white p-5 shadow-[var(--shadow-panel)]">
        <p className="t-eyebrow mb-2">Result</p>
        <textarea
          readOnly
          value={result.revisedText}
          className="min-h-48 w-full resize-none rounded border border-ink-200 bg-ink-50 p-3 font-mono text-sm text-ink-900"
        />
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center justify-center gap-2 rounded-[3px] border border-ink-200 bg-white px-4 py-2 text-xs font-medium text-ink-700 shadow-[var(--shadow-panel)] transition-[background-color,border-color] hover:border-seal-300 hover:bg-seal-50 hover:text-seal-700"
          >
            {copied ? '✓ Copied' : 'Copy to clipboard'}
          </button>
        </div>
      </div>

      {touchedPassages.length > 0 && (
        <div className="space-y-3">
          <p className="t-eyebrow">Changed passages ({touchedPassages.length})</p>
          {touchedPassages.map((p) => (
            <details key={p.index} className="rounded-lg border border-ink-200 bg-white p-4">
              <summary className="cursor-pointer text-sm font-medium text-ink-900">
                Passage {p.index + 1}
                {p.beforeZ !== null && p.afterZ !== null && (
                  <span className="ml-2 font-normal text-ink-500">
                    z {p.beforeZ.toFixed(2)} &rarr; {p.afterZ.toFixed(2)}
                  </span>
                )}
              </summary>
              <div className="mt-3 space-y-2 text-sm">
                <p className="text-ink-500">Before</p>
                <p className="rounded bg-ink-50 p-2 text-ink-700">{p.original}</p>
                <p className="text-ink-500">After</p>
                <p className="rounded bg-seal-50 p-2 text-ink-900">{p.chosen}</p>
              </div>
            </details>
          ))}
        </div>
      )}

      <div className="space-y-1 border-l-2 border-ink-300 bg-ink-50 px-4 py-3 text-xs text-ink-600">
        {result.limits.map((limit) => (
          <p key={limit}>&bull; {limit}</p>
        ))}
      </div>
    </div>
  )
}

function EvidenceComparison({ result }: { result: RewriteResult }) {
  const beforeZ = result.documentBefore?.watermark.results[0]?.z ?? null
  const afterZ = result.documentAfter?.watermark.results[0]?.z ?? null
  const beforeSurvived = result.documentBefore?.passageCorrection?.survived ?? null
  const afterSurvived = result.documentAfter?.passageCorrection?.survived ?? null

  return (
    <div className="mt-3 flex flex-wrap gap-6">
      {beforeZ !== null && afterZ !== null && (
        <div>
          <p className="text-2xl font-bold text-seal-700">
            {beforeZ.toFixed(2)} &rarr; {afterZ.toFixed(2)}
          </p>
          <p className="text-xs text-seal-600">watermark z-score</p>
        </div>
      )}
      {beforeSurvived !== null && afterSurvived !== null && (
        <div>
          <p className="text-2xl font-bold text-seal-700">
            {beforeSurvived} &rarr; {afterSurvived}
          </p>
          <p className="text-xs text-seal-600">passages surviving correction</p>
        </div>
      )}
    </div>
  )
}
