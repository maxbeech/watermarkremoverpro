import { defineConfig } from 'tsup'

/**
 * Builds the standalone @watermarkremoverpro/rewrite-engine package from the same
 * source the Next.js app ships (src/lib/rewrite, plus the detector/calibrate
 * modules it depends on), so there is exactly one implementation, not a
 * forked copy kept in sync by hand. Two library entries: `index` (isomorphic,
 * rule-based default, safe for any environment) and `node` (adds the
 * Transformers.js/onnxruntime-node advanced backend, Node-only, kept
 * separate so a browser bundler never has to resolve node:os/node:path
 * pulling in this entry point by accident). `cli` is the published bin.
 */
export default defineConfig({
  entry: {
    index: 'src/lib/rewrite/index.ts',
    node: 'src/lib/rewrite/backend/node.ts',
    cli: 'src/lib/rewrite/cli.ts',
  },
  outDir: 'packages/rewrite-engine/dist',
  tsconfig: 'tsconfig.rewrite-engine.json',
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  target: 'node18',
  platform: 'node',
  external: ['@huggingface/transformers'],
})
