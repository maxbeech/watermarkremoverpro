'use client'

import { useCallback, useId, useRef, useState } from 'react'
import { ACCEPTED_LABEL, ACCEPT_ATTRIBUTE, checkFile } from '@/lib/documents/accepted-files'

/**
 * The one way text gets into this product.
 *
 * Paste, drag-and-drop, or the file button: all three land in the same
 * textarea, so there is a single place a visitor has to understand and a
 * single component the homepage, the rewrite flow and the check page all
 * render. Before this existed the homepage, /check and /rewrite each had their
 * own input with different affordances, and only one of them accepted a file.
 *
 * READS THE FILE LOCALLY. `FileReader.readAsText` is a main-thread operation
 * on the user's own machine; there is no upload here and there is no fetch in
 * this file or anything it imports. tests/product-constraints.test.ts fails
 * the build if that stops being true.
 */
export function DocumentInput({
  value,
  onChange,
  disabled = false,
  placeholder,
  rows = 12,
  words,
  wordCap,
  onFileError,
  toolbar,
  footer,
}: {
  value: string
  onChange: (text: string) => void
  disabled?: boolean
  placeholder?: string
  rows?: number
  words: number
  /** Null means no cap applies on this surface. */
  wordCap?: number | null
  onFileError?: (message: string | null) => void
  /** Rendered on the right of the footer bar; usually the primary action. */
  toolbar?: React.ReactNode
  /** Rendered under the box, inside the same card. */
  footer?: React.ReactNode
}) {
  const inputId = useId()
  const fileInput = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)

  const overCap = wordCap != null && words > wordCap

  const accept = useCallback(
    (file: File) => {
      const verdict = checkFile(file)
      if (!verdict.ok) {
        setFileName(null)
        onFileError?.(verdict.reason)
        return
      }
      onFileError?.(null)
      const reader = new FileReader()
      reader.onload = () => {
        onChange(String(reader.result ?? ''))
        setFileName(file.name)
      }
      reader.onerror = () => onFileError?.(`Could not read ${file.name} from your disk.`)
      // A local operation. The file is not uploaded.
      reader.readAsText(file)
    },
    [onChange, onFileError],
  )

  return (
    <div
      onDragOver={(e) => {
        if (disabled) return
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={(e) => {
        e.preventDefault()
        setDragging(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        if (disabled) return
        const file = e.dataTransfer.files?.[0]
        if (file) accept(file)
      }}
      className={
        'relative overflow-hidden rounded-[var(--radius-panel)] border bg-white transition-[border-color,box-shadow] duration-200 ' +
        (dragging
          ? 'border-seal-500 shadow-[var(--shadow-raised)] ring-4 ring-seal-100'
          : 'border-ink-200 shadow-[var(--shadow-raised)] focus-within:border-seal-300')
      }
    >
      <label htmlFor={inputId} className="sr-only">
        The text to work on
      </label>
      <textarea
        id={inputId}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          if (fileName) setFileName(null)
        }}
        disabled={disabled}
        rows={rows}
        spellCheck={false}
        placeholder={placeholder ?? 'Paste your text here, or drop a file anywhere on this box.'}
        className="w-full resize-y bg-transparent px-5 py-5 text-[15px] leading-relaxed text-ink-800 outline-none placeholder:text-ink-400 disabled:text-ink-500"
      />

      {dragging && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-seal-50/90">
          <p className="t-heading text-seal-700">Drop the file to load it</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <input
            ref={fileInput}
            type="file"
            accept={ACCEPT_ATTRIBUTE}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) accept(file)
              // Reset so choosing the same file twice still fires a change.
              e.target.value = ''
            }}
          />
          <button
            type="button"
            disabled={disabled}
            onClick={() => fileInput.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 px-3 py-1.5 text-[13px] font-medium text-ink-700 transition-colors hover:border-ink-300 hover:bg-ink-50 disabled:opacity-50"
          >
            <UploadIcon />
            Upload a file
          </button>

          <span className={overCap ? 'figure text-[13px] text-signal-700' : 'figure text-[13px] text-ink-500'}>
            {words.toLocaleString()}
            {wordCap != null ? ` / ${wordCap.toLocaleString()}` : ''} word{words === 1 ? '' : 's'}
          </span>

          {fileName && <span className="text-[13px] text-ink-500">Loaded {fileName}</span>}
        </div>

        {toolbar}
      </div>

      <p className="border-t border-ink-100 bg-ink-50/60 px-4 py-2.5 text-xs text-ink-500">
        Paste, drop a file, or upload {ACCEPTED_LABEL}. Everything is read and processed on your
        device.
      </p>

      {footer}
    </div>
  )
}

function UploadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M17 8l-5-5-5 5" />
      <path d="M12 3v13" />
    </svg>
  )
}
