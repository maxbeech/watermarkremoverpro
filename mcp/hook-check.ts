/**
 * PostToolUse hook: check text this agent just wrote to a public-facing file.
 *
 * The job it does is the one the product exists for, applied automatically at
 * the moment it matters: an agent writing copy that will end up on a website
 * should know, before it ships, whether that copy carries a provenance mark
 * or reads like generated text. Asking a person to remember to paste every
 * file into a checker is not a workflow anyone actually follows.
 *
 * Design decisions worth stating, because they're the difference between a
 * hook people keep and a hook people delete:
 *
 * - It never edits the file. A hook that silently rewrites what an agent just
 *   wrote is a hook that makes changes nobody reviewed. This reports; the
 *   agent decides.
 * - It stays silent unless there is something real to say. Exit 0 and no
 *   output on a clean file. Feedback on every markdown write would be noise,
 *   and noise gets muted.
 * - It only looks at files that plausibly become public web content. Source
 *   code, configs, lockfiles and tests are none of its business.
 * - It strips code blocks, frontmatter and HTML tags before measuring, so a
 *   fenced code sample can't be mistaken for prose.
 *
 * Runs as a single bundled file under plain `node`, with nothing installed.
 */

import { checkDocument } from '../src/lib/detector'
import { OPEN_REFERENCE_KEY } from '../src/lib/detector/keys'
import { applyDeterministicPass } from '../src/lib/calibrate/ai-tells'
import { countWords } from '../src/lib/detector/tokenize'

interface HookInput {
  tool_name?: string
  tool_input?: { file_path?: string; content?: string; new_string?: string }
  cwd?: string
}

/**
 * Extensions that plausibly become public web content.
 *
 * Deliberately narrow. `.ts`/`.tsx` are excluded even though this project
 * keeps its own marketing copy in typed content files, because for the
 * average repo they're source code and flagging every component would make
 * the hook useless.
 */
const PUBLIC_CONTENT_EXTENSIONS = ['.md', '.mdx', '.markdown', '.html', '.htm', '.txt', '.rst']

/** Paths that are public-content-shaped even when the extension is ambiguous. */
const PUBLIC_CONTENT_PATH_HINTS = [
  '/content/',
  '/posts/',
  '/blog/',
  '/docs/',
  '/pages/',
  '/articles/',
  '/_posts/',
  '/copy/',
  '/marketing/',
]

/** Never worth checking, whatever the extension says. */
const IGNORED_PATH_HINTS = [
  '/node_modules/',
  '/.git/',
  '/dist/',
  '/build/',
  '/.next/',
  '/coverage/',
  '/CHANGELOG',
  '/LICENSE',
]

/** Minimum words before any statistic is worth computing or reporting. */
const MIN_WORDS = 120

function isPublicContent(filePath: string): boolean {
  const lower = filePath.toLowerCase()
  if (IGNORED_PATH_HINTS.some((h) => lower.includes(h.toLowerCase()))) return false

  const extensionMatch = PUBLIC_CONTENT_EXTENSIONS.some((e) => lower.endsWith(e))
  const pathMatch = PUBLIC_CONTENT_PATH_HINTS.some((h) => lower.includes(h))
  return extensionMatch || pathMatch
}

/**
 * Reduce a source file to the prose a reader would actually see.
 *
 * Fenced code, inline code, frontmatter, HTML tags and link targets are all
 * removed: they are not prose, and measuring them produces statistics about
 * syntax rather than about writing.
 */
export function extractProse(raw: string): string {
  return raw
    .replace(/^---\n[\s\S]*?\n---\n/, '') // YAML frontmatter
    .replace(/```[\s\S]*?```/g, ' ') // fenced code
    .replace(/~~~[\s\S]*?~~~/g, ' ')
    .replace(/`[^`\n]*`/g, ' ') // inline code
    .replace(/<[^>]+>/g, ' ') // HTML tags
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links, keeping the text
    .replace(/^\s{0,3}#{1,6}\s+/gm, '') // heading markers
    .replace(/[*_>#|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks).toString('utf8')
}

async function main(): Promise<void> {
  const rawInput = await readStdin()
  if (!rawInput.trim()) return

  let input: HookInput
  try {
    input = JSON.parse(rawInput) as HookInput
  } catch {
    return // Not our business to fail a tool call over an unparseable payload.
  }

  const filePath = input.tool_input?.file_path
  if (!filePath || !isPublicContent(filePath)) return

  const { readFile } = await import('node:fs/promises')
  let raw: string
  try {
    raw = await readFile(filePath, 'utf8')
  } catch {
    return // File moved or removed between the write and this hook.
  }

  const prose = extractProse(raw)
  if (countWords(prose) < MIN_WORDS) return

  const findings: string[] = []

  // Channel one: the deterministic AI-tell pass. This is the signal a human
  // reader actually notices, and the one an agent can act on immediately.
  // 'extended': the report is free and complete. What the paid tier buys is
  // the deeper automated rewrite, not a more honest diagnosis.
  const { changes, flaggedStructures, elevatedVocabulary } = applyDeterministicPass(
    prose,
    'balanced',
    'extended',
  )
  if (changes.length > 0) {
    const sample = changes.slice(0, 5).map((c) => `"${c.original}" -> "${c.replacement}"`)
    findings.push(
      `${changes.length} AI-tell${changes.length === 1 ? '' : 's'} (em dashes used as clause connectors, stock phrasing): ${sample.join('; ')}${changes.length > 5 ? '; ...' : ''}`,
    )
  }

  // Channel two: constructions worth a human's judgement rather than a
  // find/replace. Reported with counts, because one triadic list is ordinary
  // English and six through a document is a tic.
  const triadic = flaggedStructures.filter((f) => f.kind === 'triadic-list')
  const parallelism = flaggedStructures.filter((f) => f.kind === 'negative-parallelism')
  if (triadic.length >= 3) {
    findings.push(
      `${triadic.length} three-item lists ("X, Y, and Z"), e.g. ${triadic.slice(0, 2).map((t) => `"${t.text}"`).join(', ')}. Ordinary once; a tic when it recurs.`,
    )
  }
  if (parallelism.length > 0) {
    findings.push(
      `${parallelism.length} "not just X, but Y" construction${parallelism.length === 1 ? '' : 's'}, e.g. "${parallelism[0].text.trim()}"`,
    )
  }

  // Channel three: vocabulary whose frequency rises in LLM-assisted prose.
  // Never rewritten, only counted: each of these words is ordinary English.
  const heaviestVocabulary = elevatedVocabulary.filter((v) => v.count >= 2).slice(0, 6)
  if (heaviestVocabulary.length >= 2) {
    findings.push(
      `Elevated AI-associated vocabulary: ${heaviestVocabulary.map((v) => `${v.word} (${v.count})`).join(', ')}`,
    )
  }

  // Channel four: the keyed watermark test, under the open reference key this
  // deployment publishes. A null result here means "no mark under this key",
  // never "clean", and the message says so rather than implying otherwise.
  try {
    const analysis = await checkDocument(prose, { keys: [OPEN_REFERENCE_KEY] })
    const survived = analysis.passageCorrection?.survived ?? 0
    if (survived > 0) {
      findings.push(
        `${survived} passage${survived === 1 ? '' : 's'} carry watermark signal surviving false-discovery-rate correction under the open reference key`,
      )
    }
  } catch {
    // A measurement that could not run is not a finding. Silence is correct.
  }

  if (findings.length === 0) return

  const lines = [
    `MarkWitness checked ${filePath} before it ships as public content:`,
    ...findings.map((f) => `  - ${f}`),
    '',
    'To reduce this, call the reduce_ai_evidence MCP tool on the file\'s prose',
    '(strength "preserve" only touches passages a real check flags). It runs',
    'on this machine; no document text is transmitted.',
    '',
    'This is a report, not a verdict: a detected mark is not proof of authorship,',
    'and an absent one is not proof of human authorship.',
  ]

  // Exit 2 routes stderr back to the agent as feedback it can act on, which
  // is the only channel a PostToolUse hook has for saying something useful.
  // The write already happened; nothing is being undone here.
  process.stderr.write(lines.join('\n') + '\n')
  process.exit(2)
}

main().catch(() => {
  // A broken hook must never break the agent's actual work.
  process.exit(0)
})
