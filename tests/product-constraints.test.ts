import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
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

describe('constraint: no mark removal capability, anywhere', () => {
  /**
   * The permanent constraint. It must hold on every surface, free, Pro, API and
   * MCP, so this scans the whole source tree rather than a route list.
   *
   * The check is for a capability, not for a word: the guides discuss how
   * editing degrades a mark, which is legitimate explanation. What must not
   * exist is an exported function, route or tool that performs removal.
   */
  const FORBIDDEN_CAPABILITY = [
    /export\s+(async\s+)?function\s+\w*(remove|strip|scrub|evade|launder)\w*(Watermark|Mark|Signal)/i,
    /export\s+(async\s+)?function\s+\w*(humanize|humanise|paraphrase|rewrite)\w*/i,
    /name:\s*['"](remove|strip|reduce|paraphrase|humanize|humanise)_?\w*['"]/i,
  ]

  it('exposes no removal, paraphrase or score-reduction function', () => {
    const offenders: string[] = []
    for (const file of sourceFiles) {
      const content = read(file)
      for (const pattern of FORBIDDEN_CAPABILITY) {
        if (pattern.test(content)) offenders.push(`${file.replace(ROOT, '')} matched ${pattern}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('has no route whose path suggests removal', () => {
    const routePaths = sourceFiles
      .filter((f) => f.includes(join('app', 'api')) || f.endsWith('route.ts'))
      .map((f) => f.replace(ROOT, ''))
    for (const path of routePaths) {
      expect(path).not.toMatch(/remove|strip|humanize|humanise|paraphrase|rewrite|evade/i)
    }
  })

  it('states the policy on the surfaces a user or agent actually reads', () => {
    const surfaces = [
      'src/app/llms.txt/route.ts',
      'src/app/pricing.json/route.ts',
      'src/components/faq.tsx',
      'mcp/server.ts',
      'src/app/api/openapi.json/route.ts',
    ]
    for (const surface of surfaces) {
      const content = read(join(ROOT, surface)).toLowerCase()
      expect(content, `${surface} must state the no-removal policy`).toMatch(/remove|removal/)
    }
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

  const onDevicePath = [
    ...walk(join(ROOT, 'src', 'lib', 'detector')),
    ...walk(join(ROOT, 'src', 'components', 'checker')),
  ].filter((f) => !f.endsWith('.test.ts'))

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

  it('reads uploaded files locally rather than posting them', () => {
    const checker = read(join(ROOT, 'src/components/checker/checker.tsx'))
    expect(checker).toContain('readAsText')
    expect(checker).not.toMatch(/FormData|fetch\(/)
  })
})

// ---------------------------------------------------------------------------

describe('constraint: the mirror-product pointer ships on every page', () => {
  it('lives in the root layout, so a new page cannot omit it', () => {
    const layout = read(join(ROOT, 'src/app/layout.tsx'))
    expect(layout).toContain('MirrorBanner')

    // The banner reads the destination from the shared constant rather than
    // hardcoding it, which is the correct design, so assert the wiring here
    // and the value at its source.
    const banner = read(join(ROOT, 'src/components/mirror-banner.tsx'))
    expect(banner).toContain('MIRROR_PRODUCT.url')
    expect(read(join(ROOT, 'src/lib/site.ts'))).toContain('learnaway.ai')
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
