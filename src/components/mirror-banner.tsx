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
    <div className="border-b border-seal-100 bg-seal-50 text-seal-700">
      <div className="mx-auto max-w-5xl px-5 py-2 text-center text-sm">
        Checking <strong className="font-semibold">someone else’s</strong> work for AI use? That’s a
        different job —{' '}
        <a
          href={MIRROR_PRODUCT.url}
          className="font-semibold underline underline-offset-2 hover:text-seal-500"
        >
          {MIRROR_PRODUCT.name}
        </a>{' '}
        does it. MarkWitness checks writing you wrote yourself.
      </div>
    </div>
  )
}
