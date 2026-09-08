/**
 * Generate the web-sized logo assets from the master artwork.
 *
 * The masters in public/ are 2069px and 496px wide, which is right for a
 * favicon, an Open Graph card or print, and about thirty times more pixels
 * than the header and footer ever render. Shipping the master to every page
 * costs 264 KB for a 26px-tall image.
 *
 * The derivatives are committed rather than built on demand, and served
 * `unoptimized` through next/image, on purpose: a fixed brand asset gains
 * nothing from a per-request image transformation, and on Vercel every
 * transformation is billable quota spent on a file that never changes.
 *
 * The masters stay the source of truth. Re-run this after replacing them:
 *   npx tsx scripts/build-logos.ts
 */
import { mkdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'

/** Three times the largest size either asset is rendered at anywhere in the app. */
const TARGET_HEIGHT = 160

const OUTPUTS = [
  { source: 'public/logo_with_text.png', target: 'public/brand/lockup.png' },
  { source: 'public/logo.png', target: 'public/brand/mark.png' },
]

async function main() {
  mkdirSync(join(process.cwd(), 'public', 'brand'), { recursive: true })

  for (const { source, target } of OUTPUTS) {
    await sharp(source)
      .resize({ height: TARGET_HEIGHT })
      // A 256-colour palette. Verified against the master at render size: the
      // blue gradient shows no banding at the sizes these are used, and it is
      // roughly a quarter of the bytes of full-colour PNG or WebP.
      .png({ compressionLevel: 9, palette: true, quality: 90 })
      .toFile(target)

    const before = statSync(source).size
    const after = statSync(target).size
    console.log(
      `  ${target}  ${(after / 1024).toFixed(1)} KB  (from ${(before / 1024).toFixed(1)} KB)`,
    )
  }
}

main().catch((err) => {
  console.error(`\nLogo build failed: ${err.message}`)
  process.exit(1)
})
