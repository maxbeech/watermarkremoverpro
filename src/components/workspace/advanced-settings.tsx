'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import type { Strength } from '@/lib/rewrite'
import { LANGUAGE_NAMES, SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/detector/languages'
import { describeReset, type ProTrialStatus } from '@/lib/entitlements/pro-trial'
import { ENGINES, STRENGTH_OPTIONS, engine, type EngineId } from './settings'

export interface WorkspaceSettings {
  language: string
  strength: Strength
  engineId: EngineId
}

/**
 * Everything that is not "paste your text and press the button".
 *
 * Collapsed by default and summarised in one line when closed, because the
 * three controls in here changed the result for perhaps one visitor in twenty
 * and were the first thing every other visitor had to read past. The defaults
 * are the ones that suit almost everybody: detect the language, balanced
 * strength, and whichever engine the visitor is entitled to.
 */
export function AdvancedSettings({
  settings,
  onChange,
  disabled,
  trial,
  subscriber,
  trialLoading,
}: {
  settings: WorkspaceSettings
  onChange: (next: WorkspaceSettings) => void
  disabled: boolean
  /** Null while the allowance is still being read. */
  trial: ProTrialStatus | null
  subscriber: boolean
  trialLoading: boolean
}) {
  const [open, setOpen] = useState(false)
  const id = useId()

  const set = <K extends keyof WorkspaceSettings>(key: K, value: WorkspaceSettings[K]) =>
    onChange({ ...settings, [key]: value })

  const summary = [
    settings.language ? LANGUAGE_NAMES[settings.language as LanguageCode] : 'Detect language',
    `${engine(settings.engineId).label} engine`,
    STRENGTH_OPTIONS.find((s) => s.value === settings.strength)?.label ?? settings.strength,
  ].join(' · ')

  return (
    <div className="rounded-[var(--radius-panel)] border border-ink-200 bg-white">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2.5">
          <SlidersIcon />
          <span className="text-sm font-semibold text-ink-800">Advanced settings</span>
        </span>
        <span className="flex items-center gap-2 text-[13px] text-ink-500">
          <span className="hidden sm:inline">{summary}</span>
          <Chevron open={open} />
        </span>
      </button>

      {open && (
        <div id={id} className="space-y-6 border-t border-ink-100 px-4 py-5">
          {/* ---------------------------------------------------------- engine */}
          <fieldset disabled={disabled}>
            <legend className="text-sm font-semibold text-ink-800">Engine</legend>
            <p className="mt-1 text-[13px] text-ink-500">
              Both run entirely on your device. Neither sends your text anywhere.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {ENGINES.map((option) => {
                const selected = settings.engineId === option.id
                const locked =
                  option.id === 'pro' && !subscriber && !trialLoading && trial !== null && !trial.entitled
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => set('engineId', option.id)}
                    className={
                      'rounded-[var(--radius-control)] border p-3 text-left transition-colors duration-150 ' +
                      (selected
                        ? 'border-seal-500 bg-seal-50 ring-1 ring-seal-200'
                        : 'border-ink-200 hover:border-ink-300 hover:bg-ink-50') +
                      (disabled ? ' opacity-60' : '')
                    }
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-ink-900">{option.label}</span>
                      {option.id === 'pro' && (
                        <ProBadge
                          subscriber={subscriber}
                          trial={trial}
                          loading={trialLoading}
                          locked={locked}
                        />
                      )}
                    </span>
                    <span className="mt-1 block text-[13px] leading-relaxed text-ink-500">
                      {option.description}
                    </span>
                  </button>
                )
              })}
            </div>
            {settings.engineId === 'pro' && (
              <ProEngineNote subscriber={subscriber} trial={trial} loading={trialLoading} />
            )}
          </fieldset>

          {/* -------------------------------------------------------- strength */}
          <fieldset disabled={disabled}>
            <legend className="text-sm font-semibold text-ink-800">How much to change</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {STRENGTH_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => set('strength', option.value)}
                  aria-pressed={settings.strength === option.value}
                  className={
                    'rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-150 ' +
                    (settings.strength === option.value
                      ? 'border-ink-900 bg-ink-900 text-white'
                      : 'border-ink-200 text-ink-700 hover:border-ink-300 hover:bg-ink-50')
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="mt-2.5 text-[13px] leading-relaxed text-ink-500">
              {STRENGTH_OPTIONS.find((s) => s.value === settings.strength)?.description}
            </p>
          </fieldset>

          {/* -------------------------------------------------------- language */}
          <div>
            <label htmlFor={`${id}-language`} className="text-sm font-semibold text-ink-800">
              Language
            </label>
            <select
              id={`${id}-language`}
              value={settings.language}
              onChange={(e) => set('language', e.target.value)}
              disabled={disabled}
              className="mt-2 block w-full max-w-xs rounded-[var(--radius-control)] border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 transition-colors hover:border-ink-300 disabled:opacity-60"
            >
              <option value="">Detect automatically</option>
              {SUPPORTED_LANGUAGES.map((code: LanguageCode) => (
                <option key={code} value={code}>
                  {LANGUAGE_NAMES[code]}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}

function ProBadge({
  subscriber,
  trial,
  loading,
  locked,
}: {
  subscriber: boolean
  trial: ProTrialStatus | null
  loading: boolean
  locked: boolean
}) {
  if (subscriber) {
    return <Pill tone="mint">Included</Pill>
  }
  if (loading || trial === null) {
    return <Pill tone="ink">Checking…</Pill>
  }
  if (locked) {
    return <Pill tone="ink">Used this week</Pill>
  }
  return (
    <Pill tone="seal">
      {trial.remaining} free {trial.remaining === 1 ? 'run' : 'runs'} left
    </Pill>
  )
}

function ProEngineNote({
  subscriber,
  trial,
  loading,
}: {
  subscriber: boolean
  trial: ProTrialStatus | null
  loading: boolean
}) {
  if (subscriber) {
    return (
      <p className="mt-3 rounded-[var(--radius-control)] bg-mint-100 px-3.5 py-2.5 text-[13px] leading-relaxed text-mint-700">
        Your Pro subscription includes unlimited runs of this engine.
      </p>
    )
  }
  if (loading || trial === null) return null

  if (trial.entitled) {
    return (
      <p className="mt-3 rounded-[var(--radius-control)] bg-seal-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-seal-800">
        You have {trial.remaining} free {trial.remaining === 1 ? 'run' : 'runs'} of the Pro engine
        this week. It is spent when a rewrite actually starts, not by opening this panel. After
        that, Standard keeps working, unlimited, for free.
      </p>
    )
  }

  const back = describeReset(trial.resetsAt)
  return (
    <p className="mt-3 rounded-[var(--radius-control)] bg-signal-100 px-3.5 py-2.5 text-[13px] leading-relaxed text-signal-800">
      You have used your free Pro run for this week{back ? `; the next one is available ${back}` : ''}.
      Rewrites will use the Standard engine, which stays unlimited and free.{' '}
      <Link href="/pricing" className="font-semibold underline underline-offset-2">
        See Pro
      </Link>
      .
    </p>
  )
}

const PILL_TONES = {
  seal: 'bg-seal-100 text-seal-700',
  mint: 'bg-mint-100 text-mint-700',
  ink: 'bg-ink-100 text-ink-600',
} as const

function Pill({ tone, children }: { tone: keyof typeof PILL_TONES; children: React.ReactNode }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${PILL_TONES[tone]}`}>
      {children}
    </span>
  )
}

function SlidersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="text-ink-500">
      <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
      <circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" />
    </svg>
  )
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}
