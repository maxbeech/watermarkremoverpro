import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    /**
     * Several suites are I/O bound rather than compute bound: the house-style
     * and product-constraint tests walk and read the entire repository, and
     * the detector tests load real language baselines. The 5s default is
     * enough on an idle machine and not enough on a busy one, where a dev
     * server and a bundler running alongside was enough to flake them. A slow
     * filesystem is not a failing constraint, so the budget is explicit and
     * generous rather than left to chance.
     */
    testTimeout: 30_000,
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
