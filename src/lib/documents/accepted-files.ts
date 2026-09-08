/**
 * What a document can arrive as, in one place.
 *
 * The rule this module exists to hold: every accepted format is one the
 * BROWSER can turn into text on its own, with `FileReader`. The moment a
 * format needs a server to parse it (a .docx, a scanned PDF) the product's
 * central promise, that the document never leaves your device, would have to be
 * broken to support it, so those formats are refused by name with a message
 * that tells the reader what to do instead, rather than silently producing
 * mojibake from a zip container.
 */

export const ACCEPTED_EXTENSIONS = ['.txt', '.md', '.markdown', '.text', '.rtf', '.csv'] as const

/** The `accept` attribute for a file input. */
export const ACCEPT_ATTRIBUTE = [...ACCEPTED_EXTENSIONS, 'text/plain', 'text/markdown'].join(',')

/** Human-readable list for the drop zone. */
export const ACCEPTED_LABEL = '.txt, .md, .rtf or .csv'

/**
 * Formats people genuinely try to drop in, mapped to the reason they cannot be
 * read here. Naming the format beats a generic "unsupported file".
 */
const REFUSED: Record<string, string> = {
  '.docx':
    'Word documents are a zip container, and unpacking one in the browser is not something this tool does. Open it in Word and paste the text, or save as .txt.',
  '.doc':
    'Legacy Word documents are a binary format this tool cannot read on your device. Open it and paste the text instead.',
  '.pdf':
    'PDFs need a parser this tool deliberately does not ship, because reliable PDF text extraction is a server-side job and your document is never sent to a server. Copy the text out of your PDF reader and paste it.',
  '.pages': 'Pages documents are a package format. Export as plain text and try again.',
  '.odt': 'OpenDocument files are a zip container. Export as plain text and try again.',
}

export type FileCheck =
  | { ok: true }
  | { ok: false; reason: string }

/** How large a document may be before the browser is the wrong place for it. */
export const MAX_FILE_BYTES = 2 * 1024 * 1024

export function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot === -1 ? '' : name.slice(dot).toLowerCase()
}

/**
 * Decide whether a dropped or chosen file can be read here, before any attempt
 * to read it. Returns the reason on a refusal so the UI never has to invent
 * one.
 */
export function checkFile(file: { name: string; size: number; type?: string }): FileCheck {
  const extension = extensionOf(file.name)

  if (REFUSED[extension]) return { ok: false, reason: REFUSED[extension] }

  const looksLikeText =
    (ACCEPTED_EXTENSIONS as readonly string[]).includes(extension) ||
    (file.type ?? '').startsWith('text/')

  if (!looksLikeText) {
    return {
      ok: false,
      reason: `${file.name} is not a plain-text file. Accepted: ${ACCEPTED_LABEL}. Anything else can be pasted straight into the box.`,
    }
  }

  if (file.size > MAX_FILE_BYTES) {
    return {
      ok: false,
      reason: `${file.name} is ${(file.size / 1024 / 1024).toFixed(1)} MB. Files over ${MAX_FILE_BYTES / 1024 / 1024} MB are refused, because a document that size would lock up the browser tab doing the analysis on your own machine.`,
    }
  }

  if (file.size === 0) {
    return { ok: false, reason: `${file.name} is empty.` }
  }

  return { ok: true }
}
