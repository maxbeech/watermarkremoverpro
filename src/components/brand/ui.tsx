import Link from 'next/link'
import { BandRule } from './band'

/**
 * The shared chrome vocabulary. Every page composes from these rather than
 * inventing its own padding, its own card border and its own button, which is
 * how the spacing rhythm and the interaction states stay identical across 45
 * pages without anyone remembering to keep them identical.
 */

/** A monospace, letterspaced label. Marks the start of a section the way a
 *  figure caption marks a plate in a report. */
export function Eyebrow({
  children,
  tone = 'seal',
  className = '',
}: {
  children: React.ReactNode
  tone?: 'seal' | 'ink' | 'signal'
  className?: string
}) {
  const colour =
    tone === 'signal' ? 'text-signal-700' : tone === 'ink' ? 'text-ink-400' : 'text-seal-600'
  return (
    <p className={`t-eyebrow ${colour} ${className}`}>
      <span className="mr-2 inline-block h-[3px] w-[3px] translate-y-[-3px] bg-current align-middle" />
      {children}
    </p>
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
  surface?: 'floor' | 'panel' | 'deep'
  className?: string
  id?: string
}) {
  const bg =
    surface === 'panel'
      ? 'border-y border-ink-200 bg-white'
      : surface === 'deep'
        ? 'border-y border-ink-200 bg-ink-100/70'
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
    <div className={`mx-auto w-full px-5 ${wide ? 'max-w-6xl' : 'max-w-3xl'} ${className}`}>
      {children}
    </div>
  )
}

/** A section heading with the signature rule under it. */
export function SectionHead({
  eyebrow,
  title,
  lead,
  align = 'left',
}: {
  eyebrow?: string
  title: string
  lead?: React.ReactNode
  align?: 'left' | 'center'
}) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      {eyebrow && <Eyebrow className="mb-4">{eyebrow}</Eyebrow>}
      <h2 className="t-title text-ink-900">{title}</h2>
      <BandRule
        at={align === 'center' ? 50 : 22}
        className={`mt-5 max-w-[9rem] ${align === 'center' ? 'mx-auto' : ''}`}
      />
      {lead && <p className="t-lead mt-5 text-ink-600">{lead}</p>}
    </div>
  )
}

/**
 * The masthead every non-home page opens with. Having one of these is what stops
 * forty pages each inventing their own heading size and their own top padding.
 */
export function PageHeader({
  eyebrow,
  title,
  lead,
  wide = false,
  children,
}: {
  eyebrow: string
  title: string
  lead?: React.ReactNode
  wide?: boolean
  children?: React.ReactNode
}) {
  return (
    <div className="paper border-b border-ink-200">
      <Wrap wide={wide} className="pt-12 pb-12">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="t-title mt-5 text-ink-900">{title}</h1>
        <BandRule at={64} className="mt-6 max-w-[9rem]" />
        {lead && <p className="t-lead mt-6 max-w-2xl text-ink-600">{lead}</p>}
        {children}
      </Wrap>
    </div>
  )
}

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-[3px] px-5 py-2.5 text-sm font-medium ' +
  'transition-[background-color,color,box-shadow,transform] duration-150 ' +
  'active:translate-y-[0.5px] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0'

const BUTTON_TONES = {
  primary:
    'bg-seal-600 text-white shadow-[var(--shadow-panel)] hover:bg-seal-700 hover:shadow-[var(--shadow-raised)]',
  ink: 'bg-ink-900 text-ink-50 shadow-[var(--shadow-panel)] hover:bg-ink-800 hover:shadow-[var(--shadow-raised)]',
  quiet:
    'border border-ink-200 bg-white text-ink-700 hover:border-seal-300 hover:bg-seal-50 hover:text-seal-700',
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
        `rounded-[4px] border border-ink-200 bg-white shadow-[var(--shadow-panel)] ` +
        (interactive
          ? 'transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-[2px] hover:border-seal-200 hover:shadow-[var(--shadow-raised)] '
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
    <p className="border-l-2 border-ink-300 bg-ink-100/60 px-4 py-3 text-sm leading-relaxed text-ink-600">
      {children}
    </p>
  )
}
