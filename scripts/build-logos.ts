/**
 * Generate the web-sized logo assets, and the browser icons, from the master
 * artwork.
 *
 * The masters in public/ are 2069px and 496px wide, which is right for an
 * icon, an Open Graph card or print, and about thirty times more pixels
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
import { mkdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'

/** Three times the largest size either asset is rendered at anywhere in the app. */
const TARGET_HEIGHT = 160

const OUTPUTS = [
  { source: 'public/logo_with_text.png', target: 'public/brand/lockup.png' },
  { source: 'public/logo.png', target: 'public/brand/mark.png' },
]

/**
 * The browser icons come from the same mark the header and footer render, so
 * the tab and the page cannot end up showing two different logos.
 *
 * The mark is wider than it is tall, and every icon slot is square, so it is
 * fitted inside a white square rather than stretched. White rather than
 * transparent because a tab strip can be light or dark and the mark's palest
 * pixels vanish against a dark one; a white tile reads the same in both, which
 * is the whole job of a favicon.
 */
const ICON_SOURCE = 'public/logo.png'
/** Fraction of the square left as margin on each side. */
const ICON_PADDING = 0.1
/** The sizes packed into favicon.ico, smallest first. */
const ICO_SIZES = [16, 32, 48]

/**
 * `palette` is off for the frames packed into favicon.ico: the ICO decoder in
 * the build pipeline reads embedded PNGs as RGBA only and rejects a palette
 * frame outright. The standalone PNGs keep the palette, where it saves most of
 * the bytes anyway.
 */
async function squareIcon(size: number, palette = true): Promise<Buffer> {
  const inner = Math.round(size * (1 - ICON_PADDING * 2))
  const mark = await sharp(ICON_SOURCE)
    .resize({ width: inner, height: inner, fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .toBuffer()

  return sharp({
    create: { width: size, height: size, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  })
    .composite([{ input: mark, gravity: 'center' }])
    // A 256-colour palette keeps a 512px icon in the tens of kilobytes; the
    // mark is flat brand blue on white and shows no banding at icon sizes.
    .png({ compressionLevel: 9, palette, quality: 90 })
    .toBuffer()
}

/**
 * Pack PNGs into an ICO container.
 *
 * ICO has carried PNG-compressed entries since Vista, and every browser this
 * product supports reads them, so there is no need for a BMP encoder or a
 * dependency to produce one. The format is a 6-byte header, one 16-byte
 * directory entry per image, then the image payloads back to back.
 */
function packIco(images: { size: number; data: Buffer }[]): Buffer {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type 1 = icon
  header.writeUInt16LE(images.length, 4)

  const directory = Buffer.alloc(16 * images.length)
  let offset = header.length + directory.length

  images.forEach((image, index) => {
    const entry = index * 16
    // 0 in the width/height byte means 256; every size here is below that.
    directory.writeUInt8(image.size >= 256 ? 0 : image.size, entry)
    directory.writeUInt8(image.size >= 256 ? 0 : image.size, entry + 1)
    directory.writeUInt8(0, entry + 2) // palette size, 0 for truecolour
    directory.writeUInt8(0, entry + 3) // reserved
    directory.writeUInt16LE(1, entry + 4) // colour planes
    directory.writeUInt16LE(32, entry + 6) // bits per pixel
    directory.writeUInt32LE(image.data.length, entry + 8)
    directory.writeUInt32LE(offset, entry + 12)
    offset += image.data.length
  })

  return Buffer.concat([header, directory, ...images.map((i) => i.data)])
}

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

  /*
    Written into src/app/ rather than public/ so Next.js picks them up through
    its file conventions and emits the link tags itself. That keeps the icon
    declaration in one place: there is no `icons` block in the root layout's
    metadata to fall out of step with the files on disk.
  */
  const ico = packIco(
    await Promise.all(ICO_SIZES.map(async (size) => ({ size, data: await squareIcon(size, false) }))),
  )
  writeFileSync(join(process.cwd(), 'src/app/favicon.ico'), ico)
  console.log(`  src/app/favicon.ico  ${(ico.length / 1024).toFixed(1)} KB  (${ICO_SIZES.join(', ')}px)`)

  for (const [file, size] of [
    ['src/app/icon.png', 512],
    ['src/app/apple-icon.png', 180],
  ] as const) {
    const data = await squareIcon(size)
    writeFileSync(join(process.cwd(), file), data)
    console.log(`  ${file}  ${(data.length / 1024).toFixed(1)} KB  (${size}px)`)
  }
}

main().catch((err) => {
  console.error(`\nLogo build failed: ${err.message}`)
  process.exit(1)
})
