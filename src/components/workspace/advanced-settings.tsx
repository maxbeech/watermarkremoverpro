'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import type { Strength } from '@/lib/rewrite'
import { LANGUAGE_NAMES, SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/detector/languages'
import { splitExcludedWordsInput } from '@/lib/calibrate/excluded-terms'
import { ENGINES, STRENGTH_OPTIONS, engine, type EngineId } from './settings'

export interface WorkspaceSettings {
  language: string
  strength: Strength
  engineId: EngineId
  /** Words or phrases the rewrite must never swap out, unchanged wherever they occur. Useful for SEO keywords, product names or other terms worth keeping byte-for-byte. */
  excludedWords: string[]
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
  subscriber,
}: {
  settings: WorkspaceSettings
  onChange: (next: WorkspaceSettings) => void
  disabled: boolean
  /** True for a paying subscriber, who is the only one the Pro engine is offered to. */
  subscriber: boolean
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
                // The Pro engine is a paid feature, not a metered one: a free
                // visitor cannot select it at all, rather than selecting it and
                // discovering afterward that the rewrite silently ran on
                // Standard. It stays visible, disabled, so the upgrade is a
                // known thing rather than a hidden one.
                const locked = option.id === 'pro' && !subscriber
                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={locked}
                    aria-pressed={selected}
                    onClick={() => set('engineId', option.id)}
                    className={
                      'rounded-[var(--radius-control)] border p-3 text-left transition-colors duration-150 ' +
                      (selected
                        ? 'border-seal-500 bg-seal-50 ring-1 ring-seal-200'
                        : 'border-ink-200 hover:border-ink-300 hover:bg-ink-50') +
                      (disabled || locked ? ' opacity-60' : '')
                    }
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-ink-900">{option.label}</span>
                      {option.id === 'pro' && (
                        <Pill tone={subscriber ? 'mint' : 'ink'}>
                          {subscriber ? 'Included' : 'Pro plan'}
                        </Pill>
                      )}
                    </span>
                    <span className="mt-1 block text-[13px] leading-relaxed text-ink-500">
                      {option.description}
                    </span>
                  </button>
                )
              })}
            </div>
            {!subscriber && (
              <p className="mt-3 rounded-[var(--radius-control)] bg-ink-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-ink-600">
                The Pro engine comes with the Pro plan.{' '}
                <Link href="/pricing" className="font-semibold text-seal-700 underline underline-offset-2">
                  What it changes
                </Link>
                .
              </p>
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

          {/* --------------------------------------------------- excluded words */}
          <div>
            <label htmlFor={`${id}-excluded`} className="text-sm font-semibold text-ink-800">
              Never swap these words or phrases
            </label>
            <p className="mt-1 text-[13px] text-ink-500">
              One per line, or comma-separated. The rewrite leaves each of these exactly as written,
              wherever it occurs. Useful for SEO keywords, product names or terms you need to keep
              byte-for-byte.
            </p>
            <textarea
              id={`${id}-excluded`}
              rows={3}
              value={settings.excludedWords.join('\n')}
              onChange={(e) => set('excludedWords', splitExcludedWordsInput(e.target.value))}
              disabled={disabled}
              placeholder={'e.g. WatermarkRemoverPro\non-device AI detector'}
              className="mt-2 block w-full rounded-[var(--radius-control)] border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 transition-colors hover:border-ink-300 disabled:opacity-60"
            />
          </div>
        </div>
      )}
    </div>
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
