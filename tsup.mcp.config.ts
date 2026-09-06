import { defineConfig } from 'tsup'

/**
 * Bundles the MCP server into a single self-contained file, committed into
 * the Claude Code plugin at plugins/markwitness/dist.
 *
 * The point is zero-install distribution. Before this, using the MCP server
 * meant cloning the repo, running npm install, and pointing a client at
 * `npx tsx /absolute/path/to/mcp/server.ts`, which is a non-starter for
 * "add this to your workflow" and rules out every agent that isn't already
 * holding a checkout. Bundled, it is one committed file that runs under
 * plain `node` with nothing installed, which is what makes both the plugin
 * and the documented one-line `claude mcp add` work.
 *
 * @huggingface/transformers stays external and optional: it is only needed
 * for the advanced (local LLM) rewrite model, weighs far more than
 * everything else combined, and mcp/server.ts already falls back to the
 * rule-based engine and says so when the import fails.
 */
export default defineConfig({
  entry: { 'mcp-server': 'mcp/server.ts', 'hook-check': 'mcp/hook-check.ts' },
  outDir: 'plugins/markwitness/dist',
  tsconfig: 'tsconfig.rewrite-engine.json',
  format: ['esm'],
  outExtension: () => ({ js: '.mjs' }),
  dts: false,
  clean: true,
  splitting: false,
  sourcemap: false,
  target: 'node18',
  platform: 'node',
  // tsup treats package.json `dependencies` as external by default, which
  // would leave the MCP SDK to be resolved from a node_modules that a
  // zero-install consumer does not have. Everything gets inlined except the
  // one genuinely optional, genuinely huge dependency.
  //
  // The negative lookahead matters: tsup's `noExternal` overrides `external`,
  // so a blanket /.*/ here silently re-bundles @huggingface/transformers and
  // drags onnxruntime's native .node binaries in with it.
  noExternal: [/^(?!@huggingface\/transformers).*/],
  external: ['@huggingface/transformers'],
  banner: { js: '#!/usr/bin/env node' },
})
