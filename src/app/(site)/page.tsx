import { NeverPromptedHome } from '@/components/marketing/homepage-neverprompted'
import { WatermarkRemoverProHome } from '@/components/marketing/homepage-watermarkremoverpro'
import { markedSpecimenResult } from '@/components/marketing/specimen'
import { BRAND_ID } from '@/lib/site'

/**
 * The homepage IS the product.
 *
 * There is one thing to do here and it is above the fold: put your text in and
 * press one button. Everything that used to compete for that first screen
 * (two separate feature entry points, a full-width banner about a different
 * product, a settings panel, a wall of statistics) is either folded into the
 * tool itself or moved below it, in the order someone actually needs it.
 *
 * Rendered statically. The specimen below is computed by the real engine at
 * build time, and the tool is a client island, so this whole page is served
 * from the CDN rather than re-rendered per request.
 *
 * This file itself is just a switch. WatermarkRemoverPro and NeverPrompted
 * share the same live tool and the same real, build-time-computed specimen,
 * but need genuinely different copy to serve two different audiences (see
 * docs/neverprompted_launch_strategy.md, Part B1), so each brand's homepage
 * is its own component: homepage-watermarkremoverpro.tsx and
 * homepage-neverprompted.tsx.
 */
export default async function HomePage() {
  const marked = await markedSpecimenResult()

  return BRAND_ID === 'neverprompted' ? (
    <NeverPromptedHome marked={marked} />
  ) : (
    <WatermarkRemoverProHome marked={marked} />
  )
}
