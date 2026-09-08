'use client'

import { SUPPORTED_LANGUAGES, LANGUAGE_NAMES, type LanguageCode } from '@/lib/detector/languages'

/**
 * Text input and language selection panel.
 * Provides user interface for entering text and choosing language.
 */
export function InputPanel({
  text,
  onTextChange,
  language,
  onLanguageChange,
  isLoading,
  onCalibrate,
  mode,
  onModeChange,
}: {
  text: string
  onTextChange: (text: string) => void
  language?: string
  onLanguageChange: (lang: string) => void
  isLoading: boolean
  onCalibrate: () => void
  mode: 'preview' | 'apply'
  onModeChange: (mode: 'preview' | 'apply') => void
}) {
  const wordCount = text.trim().split(/\s+/).length

  return (
    <div className="space-y-4 rounded-[var(--radius-panel)] border border-ink-200 bg-white p-5 shadow-[var(--shadow-panel)]">
      {/* Header */}
      <div>
        <p className="t-eyebrow mb-2">Input</p>
        <h3 className="t-heading text-ink-900">Enter text to calibrate</h3>
      </div>

      {/* Text Area */}
      <div>
        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          disabled={isLoading}
          placeholder="Paste your text here. It will be analyzed locally on your device."
          className="min-h-40 w-full resize-none rounded-[var(--radius-control)] border border-ink-200 bg-white p-3 font-mono text-sm text-ink-900 placeholder-ink-400 focus:border-seal-500 focus:outline-none focus:ring-1 focus:ring-seal-500 disabled:bg-ink-50 disabled:text-ink-500"
        />
        <p className="mt-2 text-xs text-ink-500">
          {wordCount} word{wordCount !== 1 ? 's' : ''} • 100% local processing
        </p>
      </div>

      {/* Controls Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        {/* Language Selector */}
        <div className="flex-1">
          <label htmlFor="language" className="block text-xs font-medium text-ink-700">
            Language
          </label>
          <select
            id="language"
            value={language || ''}
            onChange={(e) => onLanguageChange(e.target.value || '')}
            disabled={isLoading}
            className="mt-1 block w-full rounded-[var(--radius-control)] border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:border-seal-500 focus:outline-none focus:ring-1 focus:ring-seal-500 disabled:bg-ink-50 disabled:text-ink-500"
          >
            <option value="">Auto-detect</option>
            {SUPPORTED_LANGUAGES.map((code: LanguageCode) => (
              <option key={code} value={code}>
                {LANGUAGE_NAMES[code]}
              </option>
            ))}
          </select>
        </div>

        {/* Mode Selector */}
        <div className="flex-1">
          <label htmlFor="mode" className="block text-xs font-medium text-ink-700">
            Mode
          </label>
          <select
            id="mode"
            value={mode}
            onChange={(e) => onModeChange(e.target.value as 'preview' | 'apply')}
            disabled={isLoading}
            className="mt-1 block w-full rounded-[var(--radius-control)] border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:border-seal-500 focus:outline-none focus:ring-1 focus:ring-seal-500 disabled:bg-ink-50 disabled:text-ink-500"
          >
            <option value="preview">Preview (dry-run)</option>
            <option value="apply">Apply (record)</option>
          </select>
        </div>

        {/* Calibrate Button */}
        <button
          onClick={onCalibrate}
          disabled={isLoading || text.trim().length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] bg-seal-600 px-5 py-2.5 text-sm font-medium text-white shadow-[var(--shadow-panel)] transition-[background-color,box-shadow] duration-150 hover:bg-seal-700 hover:shadow-[var(--shadow-raised)] active:translate-y-[0.5px] disabled:cursor-not-allowed disabled:bg-seal-400 disabled:shadow-[var(--shadow-panel)]"
        >
          {isLoading ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Analyzing...
            </>
          ) : (
            'Calibrate'
          )}
        </button>
      </div>

      {/* Info Box */}
      {text.trim().length === 0 && (
        <div className="rounded-[var(--radius-control)] bg-ink-50 p-3 text-xs text-ink-600">
          This tool analyzes your text's statistical profile and suggests synonym replacements to
          adjust word frequencies. All processing happens locally on your device.
        </div>
      )}
    </div>
  )
}
