import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import nextPlugin from '@next/eslint-plugin-next'

export default tseslint.config(
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'next-env.d.ts',
      'corpus/**',
      // Build output, not source. Both are committed (the plugin's bundle is
      // what makes zero-install distribution work), so they have to be
      // ignored explicitly rather than by virtue of being untracked.
      'packages/*/dist/**',
      'plugins/*/dist/**',
      // Generated verbatim from ProductFactory/_services/stripe-guard and
      // reinstalled across every product unchanged (same carve-out as
      // tests/house-style.test.ts's SKIP_FILES, for the same reason): not
      // this product's code, and not ours to fix lint issues in here.
      'src/lib/gate.ts',
      'src/lib/stripe-guard.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { '@next/next': nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
)
