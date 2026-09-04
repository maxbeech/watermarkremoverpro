'use client'

import type { TextMetrics } from '@/lib/calibrate'

/**
 * Before/After metrics comparison display.
 * Shows key lexical diversity metrics side-by-side with percentage changes.
 */
export function MetricsDisplay({
  before,
  after,
  lexicalChangePercent,
}: {
  before: TextMetrics
  after: TextMetrics
  lexicalChangePercent: number
}) {
  const ttrChange = after.typeTokenRatio - before.typeTokenRatio
  const freqChange = after.averageTokenFrequency - before.averageTokenFrequency
  const diversityChange = after.lexicalDiversity - before.lexicalDiversity

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="t-eyebrow mb-2">Impact Overview</p>
        <h2 className="t-title text-ink-900">Before & After Metrics</h2>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Left: Before */}
        <div className="rounded-lg border border-ink-200 bg-white p-5 shadow-[var(--shadow-panel)]">
          <p className="text-sm font-medium text-ink-600">Original</p>
          <div className="mt-4 space-y-3">
            <MetricRow label="Tokens" value={before.tokens} />
            <MetricRow label="Unique" value={before.uniqueTokens} />
            <MetricRow
              label="Diversity (TTR)"
              value={`${(before.typeTokenRatio * 100).toFixed(1)}%`}
            />
            <MetricRow
              label="Avg Frequency"
              value={`${before.averageTokenFrequency.toFixed(2)}`}
            />
          </div>
        </div>

        {/* Right: After */}
        <div className="rounded-lg border border-ink-200 bg-white p-5 shadow-[var(--shadow-panel)]">
          <p className="text-sm font-medium text-ink-600">Calibrated</p>
          <div className="mt-4 space-y-3">
            <MetricRow label="Tokens" value={after.tokens} />
            <MetricRow label="Unique" value={after.uniqueTokens} />
            <MetricRow
              label="Diversity (TTR)"
              value={`${(after.typeTokenRatio * 100).toFixed(1)}%`}
              delta={ttrChange}
            />
            <MetricRow
              label="Avg Frequency"
              value={`${after.averageTokenFrequency.toFixed(2)}`}
              delta={freqChange}
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="rounded-lg border border-seal-200 bg-seal-50 p-5">
        <p className="text-sm font-medium text-seal-900">Changes Applied</p>
        <div className="mt-3 flex items-baseline gap-6">
          <div>
            <p className="text-2xl font-bold text-seal-700">
              {lexicalChangePercent.toFixed(1)}%
            </p>
            <p className="text-xs text-seal-600">of tokens changed</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-seal-700">
              {diversityChange > 0 ? '+' : ''}{diversityChange.toFixed(3)}
            </p>
            <p className="text-xs text-seal-600">diversity shift</p>
          </div>
        </div>
      </div>

      {/* Interpretation */}
      <div className="space-y-2 border-l-2 border-ink-300 bg-ink-50 px-4 py-3">
        <p className="text-sm font-medium text-ink-900">What this means</p>
        <ul className="space-y-1 text-sm text-ink-700">
          {diversityChange > 0 && <li>✓ Vocabulary diversity increased</li>}
          {freqChange < 0 && (
            <li>✓ Token frequencies became more balanced (less overrepresented words)</li>
          )}
          {lexicalChangePercent > 0 && (
            <li>
              • {lexicalChangePercent.toFixed(0)}% of words were eligible for replacement based on
              frequency patterns
            </li>
          )}
          {lexicalChangePercent === 0 && (
            <li>• No high-frequency words found that matched the substitution criteria</li>
          )}
        </ul>
      </div>
    </div>
  )
}

/**
 * Individual metric row with optional delta indicator.
 */
function MetricRow({
  label,
  value,
  delta,
}: {
  label: string
  value: string | number
  delta?: number
}) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-ink-600">{label}</p>
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-ink-900">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        {delta !== undefined && (
          <p
            className={`text-xs font-medium ${
              delta > 0 ? 'text-seal-600' : delta < 0 ? 'text-signal-600' : 'text-ink-500'
            }`}
          >
            {delta > 0 ? '↑' : delta < 0 ? '↓' : '–'} {Math.abs(delta).toFixed(3)}
          </p>
        )}
      </div>
    </div>
  )
}
