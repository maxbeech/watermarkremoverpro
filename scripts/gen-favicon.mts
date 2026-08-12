/**
 * Generates src/app/favicon.ico from the product's own signature shape (the
 * measurement band: a track, a hatched uncertainty interval, and a marker at
 * the measured value), using the exact brand colour tokens from globals.css,
 * rather than a stock or placeholder icon.
 *
 * Run: npx tsx scripts/gen-favicon.mts
 */
import sharp from 'sharp'
import { writeFileSync } from 'node:fs'

const INK_900 = '#162c38' // --color-seal-900
const SEAL_500 = '#3d7595' // --color-seal-500
const SEAL_300 = '#8bb3c9' // --color-seal-300
const PAPER = '#f7f7f5' // --color-ink-50

const svg = `
<svg width="256" height="256" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect width="64" height="64" rx="13" fill="${INK_900}"/>
  <rect x="10" y="27" width="44" height="10" rx="2" fill="${SEAL_500}"/>
  <rect x="24" y="27" width="16" height="10" fill="${SEAL_300}" opacity="0.85"/>
  <rect x="36" y="23" width="4" height="18" rx="1.5" fill="${PAPER}"/>
</svg>
`.trim()

const sizes = [16, 32, 48]
const pngs = await Promise.all(sizes.map((s) => sharp(Buffer.from(svg)).resize(s, s).png().toBuffer()))

/**
 * A minimal, spec-valid ICO container embedding PNG-compressed images
 * (supported since Windows Vista; every modern browser reads this).
 */
function buildIco(images: Buffer[], imageSizes: number[]): Buffer {
  const count = images.length
  const headerSize = 6 + 16 * count
  let offset = headerSize
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(count, 4)

  const dirEntries: Buffer[] = []
  for (let i = 0; i < count; i++) {
    const png = images[i]
    const size = imageSizes[i]
    const entry = Buffer.alloc(16)
    entry.writeUInt8(size === 256 ? 0 : size, 0)
    entry.writeUInt8(size === 256 ? 0 : size, 1)
    entry.writeUInt8(0, 2)
    entry.writeUInt8(0, 3)
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(png.length, 8)
    entry.writeUInt32LE(offset, 12)
    offset += png.length
    dirEntries.push(entry)
  }

  return Buffer.concat([header, ...dirEntries, ...images])
}

const ico = buildIco(pngs, sizes)
writeFileSync('src/app/favicon.ico', ico)
console.log(`wrote src/app/favicon.ico (${ico.length} bytes, sizes ${sizes.join('/')})`)
