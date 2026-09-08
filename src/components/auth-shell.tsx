/**
 * The frame every sign-in, sign-up and password page sits in.
 *
 * Four pages were each applying the page-background class to their own narrow
 * centred column, which painted a grey stripe down the middle of a white page
 * rather than a tinted page. One shell fixes all four and keeps them
 * identical, which is what a visitor moving between sign-in and sign-up
 * expects.
 */
export function AuthShell({
  title,
  lead,
  children,
  footer,
}: {
  title: string
  lead?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="paper wash min-h-[70vh] px-5 py-16 sm:px-6">
      <div className="mx-auto w-full max-w-md">
        <h1 className="t-title text-ink-900">{title}</h1>
        {lead && <p className="mt-4 text-sm leading-relaxed text-ink-600">{lead}</p>}

        <div className="mt-7 rounded-[var(--radius-panel)] border border-ink-200 bg-white p-6 shadow-[var(--shadow-raised)]">
          {children}
        </div>

        {footer && <div className="mt-6 space-y-2 text-sm text-ink-500">{footer}</div>}
      </div>
    </div>
  )
}
