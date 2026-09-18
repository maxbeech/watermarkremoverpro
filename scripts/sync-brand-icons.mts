/**
 * Copy the active brand's favicon set into `src/app/` before a build.
 *
 * Next.js picks up `favicon.ico`, `icon.png` and `apple-icon.png` in
 * `src/app/` purely by filename convention, and both brands build from this
 * one `src/app/` tree in their own Vercel project. `scripts/build-logos.ts`
 * pre-renders each brand's set into `public/brand/<brand>/`; this script just
 * copies the one matching `NEXT_PUBLIC_BRAND` into place, so it costs a file
 * copy rather than an image transformation.
 *
 * Wired as `prebuild` (and a per-brand `predev:*`) in package.json, so it runs
 * automatically and needs no manual step when adding a brand or switching
 * which one a given Vercel project builds.
 */
import { copyFileSync } from 'node:fs'
import { join } from 'node:path'

const BRAND_ID = process.env.NEXT_PUBLIC_BRAND?.trim() || 'watermarkremoverpro'

const FILES = ['favicon.ico', 'icon.png', 'apple-icon.png']

for (const file of FILES) {
  const source = join(process.cwd(), 'public', 'brand', BRAND_ID, file)
  const target = join(process.cwd(), 'src', 'app', file)
  copyFileSync(source, target)
}

console.log(`Synced ${BRAND_ID}'s favicon set into src/app/`)
