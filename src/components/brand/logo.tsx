import Image from 'next/image'
import Link from 'next/link'
import wrpMark from '../../../public/brand/watermarkremoverpro/mark.png'
import wrpLockup from '../../../public/brand/watermarkremoverpro/lockup.png'
import npMark from '../../../public/brand/neverprompted/mark.png'
import npLockup from '../../../public/brand/neverprompted/lockup.png'
import { SITE, BRAND_ID, type BrandId } from '@/lib/site'

/**
 * The logo, in one place.
 *
 * `public/brand/<brand>/{mark,lockup}.png` are each brand's own commissioned
 * artwork, generated from the masters in `public/` by `npm run logos` (see
 * scripts/build-logos.ts). Both brands' assets are bundled into every build;
 * only the active `BRAND_ID` decides which pair actually renders, so there is
 * one code path rather than a per-brand branch to keep in sync.
 *
 * Both image files are imported as static assets so Next.js can emit an
 * immutable, content-hashed URL with intrinsic dimensions attached: no layout
 * shift, and no second copy of the width/height numbers to keep in sync by
 * hand.
 *
 * `unoptimized` is deliberate. These are web-sized derivatives already (see
 * scripts/build-logos.ts), so routing them through the image optimiser would
 * spend a billable per-deployment transformation on a fixed brand asset in
 * exchange for nothing. Served straight from the CDN with an immutable
 * content hash instead.
 *
 * `variant="lockup"` is the mark plus the wordmark and is what the header and
 * footer use. `variant="mark"` is the square-ish mark on its own, for places
 * too narrow for the wordmark.
 */
const LOGOS: Record<BrandId, { mark: typeof wrpMark; lockup: typeof wrpLockup }> = {
  watermarkremoverpro: { mark: wrpMark, lockup: wrpLockup },
  neverprompted: { mark: npMark, lockup: npLockup },
}

export function Logo({
  variant = 'lockup',
  height = 28,
  className = '',
  priority = false,
}: {
  variant?: 'lockup' | 'mark'
  height?: number
  className?: string
  priority?: boolean
}) {
  const source = variant === 'lockup' ? LOGOS[BRAND_ID].lockup : LOGOS[BRAND_ID].mark
  const width = Math.round((source.width / source.height) * height)
  return (
    <Image
      src={source}
      alt={SITE.name}
      height={height}
      width={width}
      priority={priority}
      unoptimized
      className={className}
      style={{ height, width: 'auto' }}
    />
  )
}

/** The logo as the link home. Used by the header and the footer. */
export function LogoLink({
  variant = 'lockup',
  height = 28,
  className = '',
  priority = false,
}: {
  variant?: 'lockup' | 'mark'
  height?: number
  className?: string
  priority?: boolean
}) {
  return (
    <Link
      href="/"
      aria-label={`${SITE.name} home`}
      className={`inline-flex items-center transition-opacity duration-150 hover:opacity-80 ${className}`}
    >
      <Logo variant={variant} height={height} priority={priority} />
    </Link>
  )
}
