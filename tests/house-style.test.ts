import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

/**
 * House style, enforced rather than remembered.
 *
 * Two things make writing read as machine-assembled regardless of how good the
 * argument underneath is: the em dash used as an all-purpose connector, and a
 * small vocabulary of promotional verbs that say nothing. Both creep back in one
 * edit at a time, so both are asserted here across the whole tree.
 *
 * The em dash rule has one deliberate carve-out. The detector MEASURES dash
 * punctuation in documents a user submits, and the PDF writer has to fold dashes
 * into WinAnsi, so those code points are real requirements. They are written as
 * `\u2014` escapes: identical behaviour, no literal glyph in the source, and the
 * rule below stays absolute.
 */

const ROOT = join(__dirname, '..')

const SKIP_DIRS = [
  'node_modules',
  '.next',
  '.git',
  'corpus',
  '.agents',
  '.vercel',
  '.polish-shots',
  // Vendored third-party tooling documentation. Not this product's writing, and
  // not ours to rewrite.
  '.claude',
]

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.includes(entry)) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, files)
    else if (/\.(ts|tsx|mts|css|md|json)$/.test(full)) files.push(full)
  }
  return files
}

const files = walk(ROOT).filter((f) => !relative(ROOT, f).startsWith('package-lock'))

const EM_DASH = '\u2014'

describe('house style', () => {
  it('contains no literal em dash anywhere in the repository', () => {
    const offenders: string[] = []

    for (const file of files) {
      const lines = readFileSync(file, 'utf8').split('\n')
      lines.forEach((line, i) => {
        if (line.includes(EM_DASH)) {
          offenders.push(`${relative(ROOT, file)}:${i + 1}: ${line.trim().slice(0, 100)}`)
        }
      })
    }

    expect(
      offenders,
      `Em dashes found. Rewrite the sentence rather than substituting a semicolon or a colon. ` +
        `If the character is genuinely required by the code, write it as a \\u2014 escape.\n` +
        offenders.join('\n'),
    ).toEqual([])
  })

  /**
   * Only the words that are pure filler. "Seamless" describes nothing a reader
   * can check, and neither does "supercharge". A word that carries a claim we
   * can stand behind is not on this list.
   */
  const BANNED = [
    'supercharge',
    'unlock the power',
    'elevate your',
    'effortless',
    'seamless',
    'game-changing',
    'revolutionise',
    'revolutionize',
    'cutting-edge',
    'best-in-class',
    'harness the power',
  ]

  /**
   * Scoped to what ships: application source and the README. The design notes in
   * docs/ quote this vocabulary in order to name it as a failure mode, and a
   * rule that cannot survive being written down is not a useful rule.
   */
  const shipped = files.filter((f) => {
    const rel = relative(ROOT, f)
    return rel.startsWith('src') || rel.startsWith('mcp') || rel === 'README.md'
  })

  it('uses none of the promotional filler vocabulary', () => {
    const offenders: string[] = []

    for (const file of shipped) {
      const lines = readFileSync(file, 'utf8').split('\n')
      lines.forEach((line, i) => {
        const lower = line.toLowerCase()
        for (const word of BANNED) {
          if (lower.includes(word)) {
            offenders.push(`${relative(ROOT, file)}:${i + 1}: ${word}`)
          }
        }
      })
    }

    expect(offenders, `Promotional filler found:\n${offenders.join('\n')}`).toEqual([])
  })
})
