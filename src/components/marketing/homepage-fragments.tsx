/**
 * Small presentational helpers shared by both brands' homepages.
 *
 * Pure presentation, no brand-specific text baked in: a title, a body and a
 * tone come in as props from whichever homepage renders them, so
 * WatermarkRemoverPro's and NeverPrompted's homepages can both reuse the same
 * cards, legends and bullets without duplicating this markup.
 */

export function TrustItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-mint-500">
        <path d="M20 6L9 17l-5-5" />
      </svg>
      {children}
    </li>
  )
}

export const STEP_TONES = {
  seal: { card: 'border-seal-200 bg-seal-50', badge: 'bg-seal-200 text-seal-800' },
  mint: { card: 'border-mint-200 bg-mint-100/60', badge: 'bg-mint-200 text-mint-700' },
  butter: { card: 'border-butter-200 bg-butter-100/60', badge: 'bg-butter-200 text-butter-700' },
} as const

export function StepCard({
  index,
  title,
  body,
  tone,
}: {
  index: string
  title: string
  body: string
  tone: keyof typeof STEP_TONES
}) {
  const colours = STEP_TONES[tone]
  return (
    <div className={`rounded-[var(--radius-panel)] border p-6 ${colours.card}`}>
      <span
        className={`figure inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${colours.badge}`}
      >
        {index}
      </span>
      <h3 className="t-heading mt-4 text-ink-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-700">{body}</p>
    </div>
  )
}

export function Legend({ term, body }: { term: string; body: string }) {
  return (
    <div className="rounded-[var(--radius-control)] border border-ink-200 bg-white px-4 py-3">
      <p className="text-sm font-semibold text-ink-900">{term}</p>
      <p className="mt-1 text-sm leading-relaxed text-ink-600">{body}</p>
    </div>
  )
}

export function Bullet({ colour, children }: { colour: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className={`mt-[7px] h-[6px] w-[6px] shrink-0 rounded-full ${colour}`} />
      <span>{children}</span>
    </li>
  )
}

export const POSITION_TONES = {
  seal: 'bg-seal-100 text-seal-700',
  mint: 'bg-mint-100 text-mint-700',
  rose: 'bg-rose-100 text-rose-700',
} as const

/**
 * Deliberately carries no `Band`.
 *
 * These cards used to be illustrated with one, which meant a hand-typed number
 * drawn using the exact graphic this product reserves for a real measurement,
 * on the section arguing that it never fabricates a figure. A numbered pastel
 * badge makes the same visual point and claims nothing.
 */
export function Position({
  index,
  title,
  tone,
  children,
}: {
  index: string
  title: string
  tone: keyof typeof POSITION_TONES
  children: React.ReactNode
}) {
  return (
    <div className="rounded-[var(--radius-panel)] border border-ink-200 bg-white p-6">
      <span
        className={`figure inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${POSITION_TONES[tone]}`}
      >
        {index}
      </span>
      <h3 className="t-heading mt-5 text-ink-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-600">{children}</p>
    </div>
  )
}
