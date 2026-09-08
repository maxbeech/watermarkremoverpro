import Image from 'next/image'
import Link from 'next/link'
import logoMark from '../../../public/brand/mark.png'
import logoLockup from '../../../public/brand/lockup.png'
import { SITE } from '@/lib/site'

/**
 * The logo, in one place.
 *
 * Both files are imported as static assets so Next.js can emit an immutable,
 * content-hashed URL with intrinsic dimensions attached: no layout shift, and
 * no second copy of the width/height numbers to keep in sync by hand.
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
  const source = variant === 'lockup' ? logoLockup : logoMark
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
