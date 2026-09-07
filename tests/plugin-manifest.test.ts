import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * The plugin's distribution contract.
 *
 * Two failures this file exists to catch, both found by trying to ship an
 * update to a real installation:
 *
 * 1. The version is declared in two manifests. `claude plugin update` compares
 *    versions to decide whether to re-download, so a changed bundle with an
 *    unchanged version is a silent no-op: every existing install keeps running
 *    the old code and nobody is told. The version MUST be bumped whenever
 *    dist/ changes, and the two manifests must agree.
 * 2. The committed bundles are the whole reason installation is two commands
 *    rather than a checkout plus a build. If either goes missing or is
 *    obviously truncated, installation silently produces a plugin whose MCP
 *    server cannot start.
 */

const ROOT = join(__dirname, '..')

const readJson = (path: string) => JSON.parse(readFileSync(join(ROOT, path), 'utf8'))

describe('plugin manifest', () => {
  const plugin = readJson('plugins/markwitness/.claude-plugin/plugin.json')
  const marketplace = readJson('.claude-plugin/marketplace.json')
  const listed = marketplace.plugins.find((p: { name: string }) => p.name === 'markwitness')

  it('declares the same version in both manifests', () => {
    expect(listed, 'markwitness is listed in the marketplace').toBeDefined()
    expect(
      listed.version,
      'plugin.json and marketplace.json disagree on the version. An installed plugin updates on ' +
        'a version change, so a mismatch ships one number and installs another.',
    ).toBe(plugin.version)
  })

  it('uses a semver version, since that is what the update check compares', () => {
    expect(plugin.version).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('keeps the name, description and repository identical across both', () => {
    expect(listed.name).toBe(plugin.name)
    expect(listed.description).toBe(plugin.description)
    expect(listed.repository).toBe(plugin.repository)
  })

  it('points the MCP server and hook at bundles that are actually committed', () => {
    const mcp = readJson('plugins/markwitness/.mcp.json')
    const hooks = readJson('plugins/markwitness/hooks/hooks.json')

    const serverArg = mcp.mcpServers.markwitness.args[0] as string
    const hookCommand = hooks.hooks.PostToolUse[0].hooks[0].command as string

    for (const [label, reference] of [
      ['MCP server', serverArg],
      ['hook', hookCommand],
    ] as const) {
      const match = reference.match(/\$\{CLAUDE_PLUGIN_ROOT\}\/(\S+?\.mjs)/)
      expect(match, `${label} does not reference a bundle under CLAUDE_PLUGIN_ROOT`).not.toBeNull()

      const bundle = readFileSync(join(ROOT, 'plugins/markwitness', match![1]), 'utf8')
      // A truncated or placeholder bundle is the failure worth catching: it
      // installs fine and then cannot start.
      expect(bundle.length, `${label} bundle looks truncated`).toBeGreaterThan(50_000)
      expect(bundle.startsWith('#!/usr/bin/env node'), `${label} bundle lost its shebang`).toBe(true)
    }
  })
})
