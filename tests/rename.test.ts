import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

/**
 * The rename, enforced rather than assumed complete.
 *
 * The product was MarkWitness and is now WatermarkRemoverPro. A rename that is
 * "mostly done" is the worst state to leave one in: the old name survives in
 * the places nobody reads until they matter, and the places it MUST survive
 * look like leftovers and get swept away by the next person tidying up.
 *
 * So this file does two opposite jobs at once. It fails when the old name
 * appears somewhere new, and it fails when the old name DISAPPEARS from the
 * three places it is load-bearing. Both directions are how a rename stays
 * finished.
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
  '.claude',
  // Build output, regenerated from the source this walk already covers.
  'dist',
]

/**
 * Files that record what was true at the time and are not edited afterwards.
 * A changelog that gets rewritten every time the product is renamed is not a
 * changelog, and a design note that silently acquires a name the decision was
 * not made under is worse than no note.
 */
const HISTORY = [
  'CHANGELOG.md',
  'docs/BUILD_LOG.md',
  'docs/domain_shortlist.md',
  'docs/hardening_review.md',
  'docs/archive/NO_REMOVAL.md',
]

/**
 * The old name is allowed here, and each entry says why. Anything not on this
 * list is a leftover.
 */
const ALLOWED: Record<string, string> = {
  // The cryptographic domain separator, and the tests that pin it.
  'src/lib/detector/keys.ts': 'the open reference key’s domain-separation secret is a hash input',
  'src/lib/detector/keys.test.ts': 'pins that secret',
  'src/lib/detector/crypto.test.ts': 'a PRF test vector computed from that secret',
  // The accepted pre-rename configuration names.
  'src/lib/env-names.ts': 'declares the legacy variable names that are still read',
  'src/lib/env-names.test.ts': 'tests reading them',
  'mcp/server.ts': 'names the legacy variable in its own documentation',
  '.env.example': 'names the legacy variable beside the current one',
  'scripts/mcp-smoke.mts': 'clears both names so an ambient one cannot redirect the test',
  // The cache directory that moved, and the migration that moves it.
  'src/lib/rewrite/backend/model-cache.ts': 'the pre-rename cache directory it migrates from',
  'src/lib/rewrite/backend/model-cache.test.ts': 'tests that migration',
  // Migration instructions for people holding the old install.
  'README.md': 'tells a reader how to replace the pre-rename plugin install',
  'plugins/watermarkremoverpro/README.md': 'the same migration instructions',
  'src/app/(site)/docs/mcp/page.tsx': 'tells a reader the pre-rename variable still works',
  'tests/rename.test.ts': 'this file',
}

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.includes(entry)) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, files)
    else if (/\.(ts|tsx|mts|css|md|json|txt)$/.test(full)) files.push(full)
  }
  return files
}

const read = (file: string) => readFileSync(join(ROOT, file), 'utf8')

const files = walk(ROOT)
  .map((f) => relative(ROOT, f))
  .filter((f) => !f.startsWith('package-lock') && !HISTORY.includes(f))

const OLD_NAME = /markwitness/i

describe('the rename is finished', () => {
  it('covers a real file set', () => {
    // A guard that scans nothing passes forever.
    expect(files.length).toBeGreaterThan(80)
  })

  it('leaves the old name only where it is load-bearing, and each place says why', () => {
    const leftovers = files.filter((f) => OLD_NAME.test(read(f)) && !(f in ALLOWED))
    expect(
      leftovers,
      'The old product name appears in files that are not on the allowed list in this test. ' +
        'Rename them, or add an entry saying what makes the old name load-bearing there.',
    ).toEqual([])
  })

  it('does not keep an allowance for a file that no longer needs one', () => {
    // An allowance nobody removed is how the list stops meaning anything.
    const stale = Object.keys(ALLOWED).filter((f) => f !== 'tests/rename.test.ts' && !OLD_NAME.test(read(f)))
    expect(stale, 'These files no longer contain the old name; drop their allowance.').toEqual([])
  })

  it('points nothing at the pre-rename domain', () => {
    // markwitness.helm7.com still serves this site so old links keep working,
    // but nothing may advertise it as where the product lives.
    const offenders = files
      .filter((f) => f !== 'tests/rename.test.ts')
      .filter((f) => /markwitness\.helm7\.com/i.test(read(f)))
    expect(offenders).toEqual([])
  })
})

describe('what the rename deliberately did not touch', () => {
  /**
   * Three identifiers stay. They are not brand: they are values other systems
   * already hold. Each is asserted here so that a future sweep for the old
   * name has to come and read this before removing one.
   */

  it('keeps the open reference key’s domain-separation secret', () => {
    // It is hashed into the green-list PRF, so a new value is a new key: text
    // marked under the published scheme would stop being detected, and every
    // evidence report issued under it would become unreproducible.
    expect(read('src/lib/detector/keys.ts')).toContain("utf8('markwitness/open-reference-key/v1')")
  })

  it('keeps the mw_live_ API key prefix', () => {
    // Live customer keys carry it. It is stored in api_keys.key_prefix, shown
    // in the dashboard, and matched on every authenticated request, so a new
    // prefix invalidates keys that are in use today.
    expect(read('src/lib/api-keys.ts')).toContain("const KEY_PREFIX = 'mw_live_'")
  })

  it('still reads the pre-rename configuration variables', () => {
    // A Vercel project or MCP client config set before the rename keeps
    // working. Losing a detection key silently, while every request continues
    // to answer normally, is the exact failure this product refuses.
    const names = read('src/lib/env-names.ts')
    for (const legacy of [
      'MARKWITNESS_DETECTION_KEYS',
      'MARKWITNESS_API_KEY',
      'MARKWITNESS_API_URL',
    ]) {
      expect(names, `${legacy} must stay readable`).toContain(legacy)
    }
  })
})

describe('the product publishes under the current name', () => {
  const json = (path: string) => JSON.parse(read(path))

  it('names the npm package and the plugin after the product', () => {
    expect(json('package.json').name).toBe('watermarkremoverpro')
    expect(json('packages/rewrite-engine/package.json').name).toBe('@watermarkremoverpro/rewrite-engine')
    expect(json('.claude-plugin/marketplace.json').name).toBe('watermarkremoverpro')
    expect(json('plugins/watermarkremoverpro/.claude-plugin/plugin.json').name).toBe('watermarkremoverpro')
  })

  it('gives the MCP server the current id, because tool names are derived from it', () => {
    // A client sees mcp__plugin_<plugin>_<server>__<tool>. The old id is still
    // installed on machines that installed the old plugin, and this is the
    // value that decides what they must migrate to.
    const mcp = json('plugins/watermarkremoverpro/.mcp.json')
    expect(Object.keys(mcp.mcpServers)).toEqual(['watermarkremoverpro'])
  })

  it('points the marketplace and the manifests at the current repository', () => {
    const repository = 'https://github.com/maxbeech/watermarkremoverpro'
    expect(json('plugins/watermarkremoverpro/.claude-plugin/plugin.json').repository).toBe(repository)
    expect(json('.claude-plugin/marketplace.json').plugins[0].repository).toBe(repository)
  })

  it('tells someone holding the old install how to replace it', () => {
    // The old plugin is pinned to a repository that will never update, so it
    // cannot be fixed from here. The only remedy is instructions.
    for (const doc of ['README.md', 'plugins/watermarkremoverpro/README.md']) {
      const content = read(doc)
      expect(content, `${doc} must name the marketplace to remove`).toMatch(
        /plugin marketplace remove markwitness/,
      )
      expect(content, `${doc} must name the marketplace to add`).toMatch(
        /plugin marketplace add maxbeech\/watermarkremoverpro/,
      )
    }
  })
})
