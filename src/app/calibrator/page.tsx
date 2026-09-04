import type { Metadata } from 'next'
import { Calibrator } from '@/components/calibrator/calibrator'
import { PageHeader, Wrap } from '@/components/brand/ui'

export const metadata: Metadata = {
  title: 'Calibrator | MarkWitness',
  description:
    'Calibrate your text for statistical profile adjustment. Understand and adjust word frequencies that trigger AI detection.',
}

/**
 * Calibrator page.
 * Main interface for text calibration with synonym substitution.
 */
export default function CalibratorPage() {
  return (
    <>
      <PageHeader
        eyebrow="Calibrate"
        title="Statistical Profile Adjustment"
        lead="Analyze your text's word-frequency patterns and explore synonym replacements to adjust the statistical profile. 100% local processing."
      />

      <Wrap className="py-12">
        <Calibrator />
      </Wrap>

      {/* FAQ Section */}
      <div className="border-t border-ink-200 bg-ink-100/70 py-12">
        <Wrap>
          <div className="max-w-2xl space-y-4">
            <h2 className="t-title text-ink-900">How it works</h2>

            <details className="cursor-pointer rounded-lg border border-ink-200 bg-white p-4">
              <summary className="font-medium text-ink-900">
                How is this different from the full Rewrite tool?
              </summary>
              <p className="mt-3 text-sm text-ink-700">
                This is the lightweight, fully deterministic layer: synonym substitution based on
                word frequency, no model involved. <a href="/rewrite" className="underline">Rewrite</a> also
                targets the specific passages a real check flags, removes stylistic AI tells like em
                dashes and stock phrasing, and generates multiple candidates scored for meaning
                preservation. Both run entirely on your device.
              </p>
            </details>

            <details className="cursor-pointer rounded-lg border border-ink-200 bg-white p-4">
              <summary className="font-medium text-ink-900">
                Where does my text go?
              </summary>
              <p className="mt-3 text-sm text-ink-700">
                All processing happens locally on your device. Your text never leaves your browser
                unless you explicitly send it via the API. No data is stored, tracked, or analyzed
                on our servers.
              </p>
            </details>

            <details className="cursor-pointer rounded-lg border border-ink-200 bg-white p-4">
              <summary className="font-medium text-ink-900">
                Why do some words get different confidence scores?
              </summary>
              <p className="mt-3 text-sm text-ink-700">
                Confidence reflects how strongly a word's frequency pattern matches known
                statistical signatures. Higher confidence means the word is more likely to trigger
                detection. Synonyms are scored by how well they preserve semantic meaning.
              </p>
            </details>

            <details className="cursor-pointer rounded-lg border border-ink-200 bg-white p-4">
              <summary className="font-medium text-ink-900">
                What is a daily quota?
              </summary>
              <p className="mt-3 text-sm text-ink-700">
                Free users can calibrate up to 5,000 words per day. This limit resets at UTC
                midnight. API users have higher limits depending on their plan.
              </p>
            </details>

            <details className="cursor-pointer rounded-lg border border-ink-200 bg-white p-4">
              <summary className="font-medium text-ink-900">
                Will calibration preserve my writing style?
              </summary>
              <p className="mt-3 text-sm text-ink-700">
                Yes. The tool only suggests synonyms and respects case, punctuation, and context.
                You review every change and can accept, reject, or choose alternatives.
              </p>
            </details>
          </div>
        </Wrap>
      </div>
    </>
  )
}
