import { MIRROR_PRODUCT } from '@/lib/site'

/**
 * The mirror-image pointer, on every page.
 *
 * MarkWitness is for checking YOUR OWN writing. Someone who arrives wanting to
 * screen a student's or a contractor's work is in the wrong place, and sending
 * them straight to Learnaway is better for both of them than letting them run a
 * self-check tool against someone else's document and misread the output.
 *
 * This sits in the root layout rather than on individual pages so a new page
 * cannot ship without it.
 */
export function MirrorBanner() {
  return (
    <div className="border-b border-seal-200 bg-seal-900 text-seal-100">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-2 gap-y-1 px-5 py-2.5 text-center text-[13px]">
        <span className="t-eyebrow text-seal-300">Wrong tool?</span>
        <span>
          Checking <strong className="font-semibold text-white">someone else’s</strong> work for AI
          use is a different job.{' '}
          <a
            href={MIRROR_PRODUCT.url}
            className="font-semibold text-white underline decoration-seal-500 underline-offset-[3px] transition-colors hover:decoration-white"
          >
            {MIRROR_PRODUCT.name}
          </a>{' '}
          does that. MarkWitness checks and edits writing <strong className="font-semibold text-white">you</strong> wrote
          yourself, not work someone else handed you to submit.
        </span>
      </div>
    </div>
  )
}
