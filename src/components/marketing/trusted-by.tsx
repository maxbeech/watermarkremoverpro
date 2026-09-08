import { TRUSTED_BY, type TrustedByLogo } from '@/content/trusted-by'

/**
 * An infinite CSS marquee, not a JS carousel library: two identical copies of
 * the list sit side by side in one flex row, and the row is animated exactly
 * one copy-width to the left on a loop, so the seam where it resets is
 * invisible. No client bundle for this at all.
 *
 * The second copy is `aria-hidden` with every link taken out of tab order,
 * so a keyboard or screen-reader user reaches each brand once, not twice.
 */
export function TrustedByCarousel() {
  return (
    <div
      className={
        'relative overflow-hidden ' +
        '[mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] ' +
        '[-webkit-mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]'
      }
    >
      <div className="mw-marquee-track flex w-max items-center gap-3">
        <LogoRow />
        <LogoRow ariaHidden />
      </div>
    </div>
  )
}

function LogoRow({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <div className="flex shrink-0 items-center gap-3" aria-hidden={ariaHidden || undefined}>
      {TRUSTED_BY.map((brand) => (
        <LogoBadge key={brand.name} brand={brand} tabbable={!ariaHidden} />
      ))}
    </div>
  )
}

function LogoBadge({ brand, tabbable }: { brand: TrustedByLogo; tabbable: boolean }) {
  return (
    <a
      href={brand.url}
      target="_blank"
      rel="noopener noreferrer"
      tabIndex={tabbable ? undefined : -1}
      aria-label={`${brand.name} (opens in a new tab)`}
      className={
        'group flex shrink-0 items-center gap-2.5 rounded-full border border-ink-200 bg-white px-4 py-2 ' +
        'shadow-[var(--shadow-panel)] grayscale opacity-70 ' +
        'transition-[opacity,filter,transform,border-color,box-shadow] duration-200 ' +
        'hover:-translate-y-[1px] hover:border-ink-300 hover:opacity-100 hover:shadow-[var(--shadow-raised)] hover:grayscale-0 ' +
        'focus-visible:opacity-100 focus-visible:grayscale-0'
      }
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- 45 small,
          already web-sized local icons; not worth 45 next/image imports. */}
      <img
        src={brand.logo}
        alt=""
        width={22}
        height={22}
        loading="lazy"
        className="h-[22px] w-[22px] shrink-0 rounded-[6px] object-contain"
      />
      <span className="whitespace-nowrap text-sm font-semibold text-ink-700">{brand.name}</span>
    </a>
  )
}
