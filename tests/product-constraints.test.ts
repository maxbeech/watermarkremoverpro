import { describe, expect, it } from 'vitest'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

/**
 * The two constraints that define this product, enforced as tests rather than
 * as intentions.
 *
 * A promise in a README is a promise until someone is under deadline pressure.
 * A failing test is a conversation that has to happen before the change lands.
 */

const ROOT = join(__dirname, '..')

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (['node_modules', '.next', '.git', 'corpus', '.agents', '.vercel'].includes(entry)) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, files)
    else if (/\.(ts|tsx)$/.test(full)) files.push(full)
  }
  return files
}

const sourceFiles = walk(join(ROOT, 'src'))
  .concat(walk(join(ROOT, 'mcp')))
  .filter((f) => !f.endsWith('.test.ts'))

const read = (file: string) => readFileSync(file, 'utf8')

// ---------------------------------------------------------------------------

/**
 * The surfaces a user or agent actually reads before relying on a claim about
 * the rewrite feature. Shared between the two describe blocks below so the
 * "must not overclaim" and "must state the limitation" checks can never
 * silently drift onto different surface lists.
 */
const CLAIM_SURFACES = [
  'src/app/llms.txt/route.ts',
  'src/app/pricing.json/route.ts',
  'src/components/faq.tsx',
  'mcp/server.ts',
  'src/app/api/openapi.json/route.ts',
]

describe('constraint: no unverifiable guarantee, anywhere', () => {
  /**
   * The permanent constraint, reversed in content but not in spirit. WatermarkRemoverPro
   * now reduces detectable AI-style evidence; it must never claim, on any
   * surface, that it guarantees a result it has no way to verify. No tool can
   * honestly promise to defeat a model vendor's undisclosed watermark, since
   * nobody outside that vendor holds the key it was applied with. See
   * docs/REWRITE_PHILOSOPHY.md.
   */
  const FORBIDDEN_CLAIM = [
    /\b100%\s*(undetectable|guaranteed|invisible|safe)\b/i,
    /\bguarantees?\s+(it\s+will\s+)?(pass|beat|defeat|evade)\b/i,
    /\b(completely|fully|totally)\s+undetectable\b/i,
    /\bbypasses?\s+any\s+detector\b/i,
    /\bnever\s+(get|be)\s+(flagged|detected|caught)\b/i,
    /\bguaranteed\s+to\s+(pass|beat|defeat|evade|undetect)/i,
  ]

  it('makes no unverifiable-guarantee claim anywhere in source', () => {
    const offenders: string[] = []
    for (const file of sourceFiles) {
      const content = read(file)
      for (const pattern of FORBIDDEN_CLAIM) {
        if (pattern.test(content)) offenders.push(`${file.replace(ROOT, '')} matched ${pattern}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('states what the rewrite feature does not guarantee on the surfaces a user or agent actually reads', () => {
    for (const surface of CLAIM_SURFACES) {
      const content = read(join(ROOT, surface)).toLowerCase()
      expect(content, `${surface} must state that the rewrite feature cannot guarantee a result`).toMatch(
        /cannot guarantee|no guarantee|not guaranteed|can(?:no|')t guarantee/,
      )
    }
  })
})

describe('constraint: the rewrite feature never transmits the document, on any tier', () => {
  /**
   * The one absolute that survived the pivot unchanged: rewriting is more
   * sensitive than measuring, and gets no exception to the on-device
   * guarantee, on any tier or surface, ever.
   */
  const rewritePath = [...walk(join(ROOT, 'src', 'lib', 'rewrite'))].filter((f) => !f.endsWith('.test.ts'))
  const NETWORK_CALL = /(^|[^.\w])(fetch\s*\(|new\s+XMLHttpRequest|navigator\s*\.\s*sendBeacon|new\s+WebSocket|new\s+EventSource)/

  const stripComments = (source: string): string =>
    source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '')

  it('has no network call anywhere in the rewrite engine', () => {
    const offenders = rewritePath
      .filter((file) => NETWORK_CALL.test(stripComments(read(file))))
      .map((f) => f.replace(ROOT, ''))
    expect(offenders).toEqual([])
  })

  it('covers a real file set (guards against the walk silently matching nothing)', () => {
    expect(rewritePath.length).toBeGreaterThan(4)
  })

  it('the MCP rewrite tool has no hosted branch, unlike check_document', () => {
    const server = read(join(ROOT, 'mcp/server.ts'))
    const start = server.indexOf("name === 'reduce_ai_evidence'")
    const end = server.indexOf('Unknown tool', start)
    const toolBody = server.slice(start, end)
    expect(toolBody).not.toMatch(/API_BASE|fetch\(/)
  })
})

// ---------------------------------------------------------------------------

describe('constraint: the free check never transmits the document', () => {
  /**
   * The on-device promise. The engine and the components on the free path must
   * contain no network call whatsoever. If one appeared, the marketing claim
   * ("open your network tab and watch") would become false, and it would be
   * false in a way no user could easily detect.
   */
  /**
   * Matches an invocation, not a mention. These files discuss fetching
   * baselines in their comments, and a test that fails on the word would
   * either be muted or would push the explanation out of the code, and both
   * worse outcomes than a slightly more careful regex.
   */
  const NETWORK_CALL = /(^|[^.\w])(fetch\s*\(|new\s+XMLHttpRequest|navigator\s*\.\s*sendBeacon|new\s+WebSocket|new\s+EventSource)/

  const stripComments = (source: string): string =>
    source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '')

  /**
   * Every component that HOLDS the document, on any surface. The workspace
   * directory is included deliberately: it is where the homepage flow lives
   * now, so the constraint has to follow the document there rather than stay
   * pointed at the components it used to live in.
   *
   * One file in that directory is exempt and named here rather than pattern
   * matched. `use-pro-trial.ts` reads the weekly Pro-engine allowance over the
   * network; it never sees the document, and the test below asserts that the
   * module it calls cannot carry one.
   */
  const TRIAL_HOOK = join(ROOT, 'src', 'components', 'workspace', 'use-pro-trial.ts')

  const onDevicePath = [
    ...walk(join(ROOT, 'src', 'lib', 'detector')),
    ...walk(join(ROOT, 'src', 'components', 'checker')),
    ...walk(join(ROOT, 'src', 'components', 'workspace')),
  ].filter((f) => !f.endsWith('.test.ts') && f !== TRIAL_HOOK)

  it('has no network call anywhere on the on-device path', () => {
    const offenders = onDevicePath
      .filter((file) => NETWORK_CALL.test(stripComments(read(file))))
      .map((f) => f.replace(ROOT, ''))
    expect(offenders).toEqual([])
  })

  it('covers a real file set (guards against the walk silently matching nothing)', () => {
    // A constraint test that scans zero files passes forever and proves nothing.
    expect(onDevicePath.length).toBeGreaterThan(8)
  })

  it('carries the document through the workspace components it now lives in', () => {
    // Guards the exemption above from quietly becoming the whole directory.
    expect(onDevicePath.some((f) => f.includes('/components/workspace/'))).toBe(true)
  })

  it('reads uploaded files locally rather than posting them', () => {
    // One input component serves the homepage flow AND the dedicated check
    // page, so this assertion covers both surfaces at once.
    const input = read(join(ROOT, 'src/components/workspace/document-input.tsx'))
    expect(input).toContain('readAsText')
    expect(input).not.toMatch(/FormData|fetch\(/)

    const checker = read(join(ROOT, 'src/components/checker/checker.tsx'))
    expect(checker).toContain('DocumentInput')
    expect(checker).not.toMatch(/FormData|fetch\(/)
  })

  /**
   * The one network call anywhere near the document flow, pinned down.
   *
   * The weekly Pro-engine allowance has to be countable per account rather
   * than per browser, which means one endpoint. This asserts that endpoint
   * cannot carry a document: no request body is constructed anywhere in the
   * client, and the route accepts none.
   */
  it('counts the Pro-engine allowance without a request body of any kind', () => {
    const client = read(join(ROOT, 'src/lib/entitlements/pro-trial-store.ts'))
    // Every fetch in this module targets the allowance endpoint, and no call
    // passes a request body: the options object is matched directly rather
    // than searching the file for the word, which would also hit the local
    // variable holding the RESPONSE body.
    const calls = [...client.matchAll(/fetch\((.*?)\)\s*$/gm)].map((m) => m[1])
    expect(calls.length).toBeGreaterThan(0)
    for (const call of calls) {
      expect(call).toContain("'/api/v1/pro-trial'")
      expect(call).not.toMatch(/\bbody\b|FormData|JSON\.stringify/)
    }

    const route = read(join(ROOT, 'src/app/api/v1/pro-trial/route.ts'))
    expect(route).not.toMatch(/request\.(json|text|formData|arrayBuffer)\(/)
    // The handlers take no Request argument at all, so there is nothing to read.
    expect(route).toContain('export async function GET()')
    expect(route).toContain('export async function POST()')
  })
})

// ---------------------------------------------------------------------------

describe('constraint: the mirror-product pointer ships on every page', () => {
  /**
   * The pointer must be unmissable to someone in the wrong place and must not
   * be the first thing shouted at the majority who are in the right one. It
   * therefore lives in the ROOT LAYOUT FOOTER, so no page can ship without
   * it, rather than in a full-width banner above the header, and the homepage
   * carries a proper section of its own explaining the split.
   */
  const layout = read(join(ROOT, 'src/app/layout.tsx'))

  it('lives in the root layout, so a new page cannot omit it', () => {
    // Reads the destination from the shared constant rather than hardcoding
    // it, so assert the wiring here and the value at its source.
    expect(layout).toContain('MIRROR_PRODUCT.url')
    expect(layout).toContain('MIRROR_PRODUCT.name')
    expect(read(join(ROOT, 'src/lib/site.ts'))).toContain('learnaway.ai')
  })

  it('is not restored to a full-width banner above the fold', () => {
    // The banner component was deleted rather than left in the tree for
    // someone to re-add on a hunch that the page looked empty.
    expect(existsSync(join(ROOT, 'src/components/mirror-banner.tsx'))).toBe(false)
  })

  it('distinguishes editing your own writing from screening someone else\'s, now that WatermarkRemoverPro rewrites as well as checks', () => {
    const pointer = layout.toLowerCase()
    expect(pointer).toMatch(/you[\s\S]*wrote[\s\S]*yourself/)
    expect(pointer).toMatch(/handed you to submit|someone else/)
  })

  it('explains the split in its own homepage section rather than only in the footer', () => {
    const home = read(join(ROOT, 'src/app/page.tsx'))
    expect(home).toContain('MIRROR_PRODUCT')
    expect(home.toLowerCase()).toMatch(/someone else/)
  })

  it('tells llms.txt readers not to recommend this product for screening others', () => {
    const llms = read(join(ROOT, 'src/app/llms.txt/route.ts'))
    expect(llms).toContain('MIRROR_PRODUCT')
    expect(llms).toMatch(/NOT for/i)
  })
})

// ---------------------------------------------------------------------------

describe('constraint: no fabricated figures', () => {
  it('never renders a null statistic as a number', () => {
    // The formatters are the last line of defence between a null and a reader.
    // They live in measures.tsx, which is the shared rendering vocabulary used by
    // BOTH the app result view and the marketing exhibits, so this asserts
    // against that module rather than against whichever page happens to import
    // it today.
    const measures = read(join(ROOT, 'src/components/checker/measures.tsx'))
    expect(measures).toContain("'not computed'")

    // Every surface that renders a statistic must go through those formatters
    // rather than reimplementing them, and none of them may coerce a null.
    const renderers = [
      'src/components/checker/measures.tsx',
      'src/components/checker/result-view.tsx',
      'src/components/checker/passage-breakdown.tsx',
      'src/components/marketing/exhibit.tsx',
    ].map((f) => read(join(ROOT, f)))

    for (const source of renderers) {
      // A `?? 0` on a statistic would silently turn "not measured" into "zero".
      expect(source).not.toMatch(/(greenRate|compositeDeviation|watermarkZ|pValue)\s*\?\?\s*0/)
    }
  })

  it('ships a measured baseline for every language it claims to support', async () => {
    const { SUPPORTED_LANGUAGES } = await import('../src/lib/detector/languages')
    // Loaded through the real loader rather than read off disk, so this also
    // proves the loader resolves in a plain Node context, and the MCP server runs
    // there, and a baseline that only loads under the bundler is a baseline the
    // MCP server silently does without.
    const { loadBaseline } = await import('../src/lib/detector/baselines')

    for (const code of SUPPORTED_LANGUAGES) {
      const baseline = await loadBaseline(code)
      expect(baseline.corpus.tokens, `${code} corpus`).toBeGreaterThan(50_000)
      expect(baseline.measurement.chunks, `${code} chunks`).toBeGreaterThanOrEqual(120)
      expect(baseline.corpus.retrievedAt).toBeTruthy()
      expect(Object.keys(baseline.features).length).toBeGreaterThanOrEqual(14)
    }
  })
})
