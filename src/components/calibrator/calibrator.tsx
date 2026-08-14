'use client'

import { useState, useCallback } from 'react'
import { calibrateText, type CalibrationResult, type Substitution } from '@/lib/calibrate'
import { InputPanel } from './input-panel'
import { MetricsDisplay } from './metrics-display'
import { DiffViewer } from './diff-viewer'
import { SubstitutionsList } from './substitutions-list'
import { BudgetStatus } from './budget-status'

/**
 * Main calibration interface container.
 * Orchestrates text input, processing, and results display.
 */
export function Calibrator() {
  const [text, setText] = useState('')
  const [language, setLanguage] = useState<string>('')
  const [mode, setMode] = useState<'preview' | 'apply'>('preview')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<CalibrationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [appliedSubstitutions, setAppliedSubstitutions] = useState<Set<number>>(
    new Set()
  )
  const [processingTime, setProcessingTime] = useState(0)

  /**
   * Handle calibration request.
   */
  const handleCalibrate = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setAppliedSubstitutions(new Set())

    const startTime = performance.now()

    try {
      const res = await calibrateText({
        text,
        language: language || undefined,
        mode,
        config: {
          confidenceThreshold: 0.7,
          maxRepeats: 3,
        },
      })

      setProcessingTime(res.processingTimeMs)

      if (res.status !== 'ok') {
        setError(res.error || 'Calibration failed')
        setResult(null)
        return
      }

      setResult(res)
      // Mark all applied substitutions as accepted by default
      const accepted = new Set(
        res.substitutions
          .map((s, idx) => (s.reason === 'synonym' ? idx : null))
          .filter((idx): idx is number => idx !== null)
      )
      setAppliedSubstitutions(accepted)
    } catch (err) {
      setError((err as Error).message || 'An unexpected error occurred')
      setResult(null)
    } finally {
      setIsLoading(false)
    }
  }, [text, language, mode])

  /**
   * Handle substitution change (acceptance/rejection/alternative selection).
   */
  const handleSubstitutionChange = useCallback((index: number, value: string) => {
    // This would require mutable substitutions, which we'll handle via UI state
    // For now, just mark as applied
    setAppliedSubstitutions((prev) => {
      const next = new Set(prev)
      if (value === result?.substitutions[index].original) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }, [result])

  /**
   * Generate revised text based on applied substitutions.
   */
  const getRevisedText = useCallback(() => {
    if (!result) return text

    let output = text
    // Apply substitutions in reverse order to maintain indices
    const toApply = result.substitutions
      .map((s, idx) => ({ ...s, idx }))
      .filter((s) => s.reason === 'synonym' && appliedSubstitutions.has(s.idx))
      .reverse()

    for (const subst of toApply) {
      const token = result.original.text.substring(
        // Find token position (approximate)
        text.indexOf(subst.original),
        text.indexOf(subst.original) + subst.original.length
      )
      if (token === subst.original) {
        output = output.replace(token, subst.replacement)
      }
    }

    return output
  }, [result, text, appliedSubstitutions])

  return (
    <div className="space-y-6">
      {/* Budget Status */}
      <BudgetStatus />

      {/* Input Panel */}
      <InputPanel
        text={text}
        onTextChange={setText}
        language={language}
        onLanguageChange={setLanguage}
        isLoading={isLoading}
        onCalibrate={handleCalibrate}
        mode={mode}
        onModeChange={setMode}
      />

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-signal-200 bg-signal-50 p-4">
          <p className="text-sm font-medium text-signal-900">Error</p>
          <p className="mt-1 text-sm text-signal-700">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && result.status === 'ok' && (
        <div className="space-y-6">
          {/* Processing Info */}
          <div className="text-xs text-ink-500">
            Processed in {processingTime.toFixed(1)}ms • {result.language || 'auto-detected'}
          </div>

          {/* Metrics */}
          <MetricsDisplay
            before={result.original.metrics}
            after={result.revised.metrics}
            lexicalChangePercent={result.comparison.lexicalChangePercent}
          />

          {/* Diff Viewer */}
          {result.substitutions.length > 0 && (
            <DiffViewer
              original={result.original.text}
              revised={result.revised.text}
              substitutions={result.substitutions}
              onSubstitutionChange={handleSubstitutionChange}
            />
          )}

          {/* Substitutions List */}
          {result.substitutions.length > 0 && (
            <SubstitutionsList
              substitutions={result.substitutions}
              appliedCount={Array.from(appliedSubstitutions).length}
            />
          )}

          {/* No Changes Info */}
          {result.substitutions.length === 0 && (
            <div className="rounded-lg border border-ink-200 bg-ink-50 p-4">
              <p className="text-sm text-ink-700">
                No substitutions were found. Your text's word frequency profile does not contain
                high-frequency patterns that would trigger statistical detection.
              </p>
            </div>
          )}

          {/* Export */}
          <ExportPanel revisedText={getRevisedText()} />
        </div>
      )}

      {/* Empty State */}
      {!result && !error && !isLoading && text.trim().length > 0 && (
        <div className="rounded-lg border border-ink-200 bg-ink-50 p-8 text-center">
          <p className="text-sm text-ink-600">Click "Calibrate" to analyze your text</p>
        </div>
      )}
    </div>
  )
}

/**
 * Export panel for copying or downloading revised text.
 */
function ExportPanel({ revisedText }: { revisedText: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(revisedText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleDownload = () => {
    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(revisedText))
    element.setAttribute('download', 'calibrated-text.txt')
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div className="rounded-lg border border-ink-200 bg-white p-5 shadow-[var(--shadow-panel)]">
      <p className="text-sm font-medium text-ink-900">Export</p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={handleCopy}
          className="inline-flex items-center justify-center gap-2 rounded-[3px] border border-ink-200 bg-white px-4 py-2 text-xs font-medium text-ink-700 shadow-[var(--shadow-panel)] transition-[background-color,border-color] hover:border-seal-300 hover:bg-seal-50 hover:text-seal-700"
        >
          {copied ? '✓ Copied' : 'Copy to clipboard'}
        </button>
        <button
          onClick={handleDownload}
          className="inline-flex items-center justify-center gap-2 rounded-[3px] border border-ink-200 bg-white px-4 py-2 text-xs font-medium text-ink-700 shadow-[var(--shadow-panel)] transition-[background-color,border-color] hover:border-seal-300 hover:bg-seal-50 hover:text-seal-700"
        >
          Download .txt
        </button>
      </div>
    </div>
  )
}
