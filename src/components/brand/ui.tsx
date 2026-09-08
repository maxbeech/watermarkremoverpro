import Link from 'next/link'

/**
 * The shared chrome vocabulary. Every page composes from these rather than
 * inventing its own padding, its own card border and its own button, which is
 * how the spacing rhythm and the interaction states stay identical across 45
 * pages without anyone remembering to keep them identical.
 */

const EYEBROW_TONES = {
  seal: 'bg-seal-100 text-seal-700',
  ink: 'bg-ink-100 text-ink-600',
  signal: 'bg-signal-100 text-signal-700',
  mint: 'bg-mint-100 text-mint-700',
  sky: 'bg-sky-100 text-sky-700',
  rose: 'bg-rose-100 text-rose-700',
} as const

export type EyebrowTone = keyof typeof EYEBROW_TONES

/** A small pastel pill that labels a section. */
export function Eyebrow({
  children,
  tone = 'seal',
  className = '',
}: {
  children: React.ReactNode
  tone?: EyebrowTone
  className?: string
}) {
  return (
    <span
      className={`t-eyebrow inline-flex items-center rounded-full px-3 py-1 ${EYEBROW_TONES[tone]} ${className}`}
    >
      {children}
    </span>
  )
}

/** One vertical rhythm for every marketing section. */
export function Section({
  children,
  tight = false,
  surface = 'floor',
  className = '',
  id,
}: {
  children: React.ReactNode
  tight?: boolean
  surface?: 'floor' | 'panel' | 'deep' | 'ink'
  className?: string
  id?: string
}) {
  const bg =
    surface === 'panel'
      ? 'bg-white'
      : surface === 'deep'
        ? 'bg-ink-50'
        : surface === 'ink'
          ? 'bg-ink-900 text-white'
          : ''
  return (
    <section
      id={id}
      className={`${bg} ${className}`}
      style={{
        paddingTop: tight ? 'var(--space-section-tight)' : 'var(--space-section)',
        paddingBottom: tight ? 'var(--space-section-tight)' : 'var(--space-section)',
      }}
    >
      {children}
    </section>
  )
}

/** The measure the whole site is set to. */
export function Wrap({
  children,
  wide = false,
  className = '',
}: {
  children: React.ReactNode
  wide?: boolean
  className?: string
}) {
  return (
    <div className={`mx-auto w-full px-5 sm:px-6 ${wide ? 'max-w-6xl' : 'max-w-3xl'} ${className}`}>
      {children}
    </div>
  )
}

/** A section heading. */
export function SectionHead({
  eyebrow,
  eyebrowTone = 'seal',
  title,
  lead,
  align = 'left',
}: {
  eyebrow?: string
  eyebrowTone?: EyebrowTone
  title: string
  lead?: React.ReactNode
  align?: 'left' | 'center'
}) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      {eyebrow && (
        <Eyebrow tone={eyebrowTone} className="mb-5">
          {eyebrow}
        </Eyebrow>
      )}
      <h2 className="t-title text-ink-900">{title}</h2>
      {lead && <p className="t-lead mt-4 text-ink-600">{lead}</p>}
    </div>
  )
}

/**
 * The masthead every non-home page opens with. Having one of these is what stops
 * forty pages each inventing their own heading size and their own top padding.
 */
export function PageHeader({
  eyebrow,
  eyebrowTone = 'seal',
  title,
  lead,
  wide = false,
  children,
}: {
  eyebrow: string
  eyebrowTone?: EyebrowTone
  title: string
  lead?: React.ReactNode
  wide?: boolean
  children?: React.ReactNode
}) {
  return (
    <div className="paper wash border-b border-ink-200">
      <Wrap wide={wide} className="pt-14 pb-14">
        <Eyebrow tone={eyebrowTone}>{eyebrow}</Eyebrow>
        <h1 className="t-title mt-5 text-ink-900">{title}</h1>
        {lead && <p className="t-lead mt-4 max-w-2xl text-ink-600">{lead}</p>}
        {children}
      </Wrap>
    </div>
  )
}

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold ' +
  'transition-[background-color,color,box-shadow,transform,border-color] duration-150 ' +
  'active:translate-y-[0.5px] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0'

const BUTTON_TONES = {
  primary:
    'bg-ink-900 text-white shadow-[var(--shadow-panel)] hover:bg-ink-800 hover:shadow-[var(--shadow-raised)]',
  seal: 'bg-seal-600 text-white shadow-[var(--shadow-panel)] hover:bg-seal-700 hover:shadow-[var(--shadow-raised)]',
  ink: 'bg-ink-900 text-white shadow-[var(--shadow-panel)] hover:bg-ink-800 hover:shadow-[var(--shadow-raised)]',
  quiet:
    'border border-ink-200 bg-white text-ink-800 hover:border-ink-300 hover:bg-ink-50',
  ghost: 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
} as const

export type ButtonTone = keyof typeof BUTTON_TONES

export function buttonClass(tone: ButtonTone = 'primary', extra = '') {
  return `${BUTTON_BASE} ${BUTTON_TONES[tone]} ${extra}`
}

export function ButtonLink({
  href,
  tone = 'primary',
  children,
  className = '',
}: {
  href: string
  tone?: ButtonTone
  children: React.ReactNode
  className?: string
}) {
  return (
    <Link href={href} className={buttonClass(tone, className)}>
      {children}
    </Link>
  )
}

/** A panel that sits on the floor. Hover lifts it slightly when it links out. */
export function Panel({
  children,
  className = '',
  interactive = false,
}: {
  children: React.ReactNode
  className?: string
  interactive?: boolean
}) {
  return (
    <div
      className={
        `rounded-[var(--radius-panel)] border border-ink-200 bg-white shadow-[var(--shadow-panel)] ` +
        (interactive
          ? 'transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-[2px] hover:border-ink-300 hover:shadow-[var(--shadow-raised)] '
          : '') +
        className
      }
    >
      {children}
    </div>
  )
}

/** The stated-limits note. Appears wherever a result or a claim about a result
 *  does, and is deliberately the one block on the page with no colour at all. */
export function LimitNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-[var(--radius-control)] border border-ink-200 bg-ink-50 px-4 py-3 text-sm leading-relaxed text-ink-600">
      {children}
    </p>
  )
}
