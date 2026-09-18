import Link from 'next/link'
import { CORE_FAQ, Faq } from '@/components/faq'
import { JsonLd, faqPageLd, softwareApplicationLd } from '@/components/json-ld'
import { ButtonLink, Eyebrow, LimitNote, Panel, Section, SectionHead, Wrap } from '@/components/brand/ui'
import { ExhibitFrame, ResultExhibit, StyleExhibit } from '@/components/marketing/exhibit'
import { Bullet, Legend, Position, StepCard, TrustItem } from '@/components/marketing/homepage-fragments'
import { Reveal } from '@/components/marketing/parallax'
import type { markedSpecimenResult } from '@/components/marketing/specimen'
import { TrustedByCarousel } from '@/components/marketing/trusted-by'
import { Workspace } from '@/components/workspace/workspace'
import { REWRITE_TOKENS_PER_WINDOW, REWRITE_WINDOW_DAYS } from '@/lib/entitlements/rewrite-budget'
import { MIRROR_PRODUCT, SITE, SUPPORTED_LANGUAGE_NAMES } from '@/lib/site'

/**
 * WatermarkRemoverPro's homepage: forensic, post-accusation register. Same
 * live tool and the same exhibit components as NeverPrompted's homepage
 * (homepage-neverprompted.tsx), rendered with this brand's own copy.
 */
export function WatermarkRemoverProHome({
  marked,
}: {
  marked: Awaited<ReturnType<typeof markedSpecimenResult>>
}) {
  return (
    <>
      <JsonLd data={[softwareApplicationLd(), faqPageLd(CORE_FAQ)]} />

      {/* ------------------------------------------------------------ hero */}
      <div className="paper wash border-b border-ink-200">
        <Wrap wide className="pt-14 pb-16 sm:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <Eyebrow>Free · nothing is uploaded</Eyebrow>
            <h1 className="t-display mt-6 text-ink-900">
              Make your writing sound like you wrote it.
            </h1>
            <p className="t-lead mx-auto mt-5 max-w-2xl text-ink-600">
              Paste your draft and {SITE.name} opens a workspace with it rewritten, a comparison of
              every change, and exactly what a detector would still measure in the result. All of it
              runs in this browser tab.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-3xl">
            <Workspace />
          </div>

          <ul className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[13px] text-ink-500">
            <TrustItem>Runs on your device: open the network tab and watch</TrustItem>
            <TrustItem>{SUPPORTED_LANGUAGE_NAMES.join(', ')}</TrustItem>
            <TrustItem>
              {REWRITE_TOKENS_PER_WINDOW.toLocaleString('en-GB')} free rewriting tokens every{' '}
              {REWRITE_WINDOW_DAYS} days
            </TrustItem>
          </ul>
        </Wrap>
      </div>

      {/* --------------------------------------------------------- trusted by */}
      <div className="border-b border-ink-200 bg-white py-10 sm:py-12">
        <Wrap wide>
          <p className="text-center text-sm font-semibold text-ink-500">
            Just a few of the brands that trust{' '}
            <span className="text-ink-700">{SITE.name}</span>
          </p>
          <div className="mt-6">
            <TrustedByCarousel />
          </div>
        </Wrap>
      </div>

      {/* ------------------------------------------------------ three steps */}
      <Section tight>
        <Wrap wide>
          <SectionHead
            eyebrow="How it works"
            title="Three steps, and none of them involve a server."
            lead="The engine downloads to your browser once. Your document is read, measured and rewritten there, so there is nothing for us to store, log or hand to anyone."
          />

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <StepCard
              index="1"
              tone="seal"
              title="Put your text in"
              body="Paste it, drop the file on the box, or use the upload button. Plain text, Markdown, RTF and CSV are read straight off your disk."
            />
            <StepCard
              index="2"
              tone="mint"
              title="One button"
              body="Language, engine and how much to change all have sensible defaults. They are there under Advanced settings if you want them, and out of the way if you do not."
            />
            <StepCard
              index="3"
              tone="butter"
              title="A workspace, not a wall of text"
              body="The button opens your workspace: the rewritten draft, how much AI evidence is left, a comparison you can act on paragraph by paragraph, and the full analysis when you want it. Everything you run is kept there, on this device."
            />
          </div>
        </Wrap>
      </Section>

      {/* --------------------------------------------------- what you get back */}
      <Section surface="deep" tight>
        <Wrap wide className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHead
              eyebrow="What comes back"
              eyebrowTone="sky"
              title="A real measurement, not a percentage out of thin air."
              lead="Every figure carries the count it was computed from and a band around it. Where something could not be measured, the result says so instead of printing a zero and letting you assume it meant something."
            />
            <div className="mt-7 space-y-3">
              <Legend
                term="The chance line"
                body="Where the number sits when nothing is there. A result on this line is a null result, not a low score."
              />
              <Legend
                term="The hatched interval"
                body="How far the measurement could move on a slightly different sample. Hatched, so it can never be mistaken for the value itself."
              />
              <Legend
                term="The marker"
                body="What was actually measured. Amber only ever means a mark was found under a key that was tested."
              />
            </div>
            <Link href="/method" className="link-quiet mt-6 inline-block text-sm font-medium text-ink-800">
              Read how both channels are computed
            </Link>
          </div>

          <Reveal>
            <ExhibitFrame
              url={`${SITE.url.replace(/^https?:\/\//, '')}/check`}
              tilt
              caption={
                <>
                  <strong className="font-semibold text-signal-700">A marked specimen.</strong>{' '}
                  Committee minutes rewritten to prefer green-list continuations under the open
                  reference key {SITE.name} publishes, then measured. Every figure on this panel was
                  computed by the engine at build time, not written here.
                </>
              }
            >
              <ResultExhibit result={marked} passages={2} animate />
            </ExhibitFrame>
          </Reveal>
        </Wrap>
      </Section>

      {/* --------------------------------------------------- three positions */}
      <Section tight>
        <Wrap wide>
          <SectionHead
            eyebrow="What we will not trade away"
            eyebrowTone="ink"
            title="What it does, and what it refuses to do."
          />

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            <Position index="01" tone="seal" title="It shows its working">
              Every figure is a computed statistic carrying the count it came from and a band around
              it. Where something could not be measured, the result says so.
            </Position>

            <Position index="02" tone="mint" title="It refuses to overclaim">
              A green-list mark is keyed, and no model vendor publishes its key. Results always name
              the keys that were tested, so a null result reads as “no mark found under these keys”
              and never quietly becomes “you are cleared”.
            </Position>

            <Position index="03" tone="rose" title="Your text never leaves">
              Rewriting is on-device on every tier and every surface, with no hosted mode at all.
              It cannot guarantee defeating a vendor’s undisclosed watermark, and it never says it
              can.
            </Position>
          </div>
        </Wrap>
      </Section>

      {/* --------------------------------------------------- the style channel */}
      <Section surface="deep" tight>
        <Wrap wide className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHead
              eyebrow="The second channel"
              eyebrowTone="rose"
              title="A style measurement, kept in its place."
              lead="How far a document sits from contemporary reference prose in the same language is a real, useful number. It is also the single most misread number in this field, so it is reported separately and never folded into the verdict."
            />
            <div className="mt-7">
              <LimitNote>
                Distance from reference reflects register, subject and translation. Technical
                writing, fiction, translated text and non-native prose all sit far from an
                encyclopaedic reference for entirely ordinary reasons, and none of that is evidence
                about how a document was produced.
              </LimitNote>
            </div>
          </div>

          <Reveal>
            <ExhibitFrame url={`${SITE.url.replace(/^https?:\/\//, '')}/check`} tilt>
              <StyleExhibit result={marked} />
            </ExhibitFrame>
          </Reveal>
        </Wrap>
      </Section>

      {/* ------------------------------------------------------------ verify */}
      <Section tight>
        <Wrap wide className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-16">
          <div>
            <SectionHead
              eyebrow="Auditability"
              eyebrowTone="mint"
              title="Do not take our word for it."
              lead={
                <>
                  A detector you cannot test is a detector you have to trust. On the{' '}
                  <Link href="/verify" className="link-quiet font-medium text-ink-800">
                    verify page
                  </Link>{' '}
                  you can mark a passage under our published reference key in your own browser, run
                  the check, and watch the statistic move. Then run the same passage against a
                  different key and watch it sit at chance. That is the difference between
                  arithmetic and theatre, and it takes about fifteen seconds.
                </>
              }
            />
            <div className="mt-7">
              <ButtonLink href="/verify" tone="quiet">
                Run the demonstration
              </ButtonLink>
            </div>
          </div>

          <Panel className="p-6">
            <p className="t-heading text-ink-900">What that demonstration shows</p>
            <ul className="mt-4 space-y-3.5 text-sm leading-relaxed text-ink-600">
              <Bullet colour="bg-signal-500">
                Marked text scored under the key it was marked with, far from chance.
              </Bullet>
              <Bullet colour="bg-ink-400">
                The very same text scored under an unrelated key, sitting at chance.
              </Bullet>
              <Bullet colour="bg-seal-500">
                Both runs happening in your browser, on text generated in front of you.
              </Bullet>
            </ul>
          </Panel>
        </Wrap>
      </Section>

      {/* ------------------------------------------------- the mirror product */}
      {/*
        Moved down here on purpose. This used to be a full-width banner pinned
        above the header on every page, the loudest element on the site,
        addressed to the minority of visitors who are in the wrong place. It is
        still stated plainly, and still in the footer of every page, but it no
        longer greets the majority who are in the right one.
      */}
      <Section surface="deep" tight>
        <Wrap wide>
          <div className="grid items-center gap-8 rounded-[var(--radius-hero)] border border-ink-200 bg-white p-8 sm:p-10 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <Eyebrow tone="ink">Looking for the other side of this?</Eyebrow>
              <h2 className="t-title mt-4 text-ink-900">
                {SITE.name} is for writing you wrote yourself.
              </h2>
              <p className="t-lead mt-4 max-w-2xl text-ink-600">
                Screening someone else’s work, a student’s essay or a contractor’s copy, is a
                different job with different ethics and a different tool.{' '}
                <strong className="font-semibold text-ink-800">{MIRROR_PRODUCT.name}</strong> is
                built for {MIRROR_PRODUCT.reason}. This one is not, and running a self-check tool
                over work someone handed you is the fastest way to misread its output.
              </p>
            </div>
            <div className="shrink-0">
              <a
                href={MIRROR_PRODUCT.url}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-ink-200 bg-white px-5 py-2.5 text-sm font-semibold text-ink-800 transition-colors hover:border-ink-300 hover:bg-ink-50"
              >
                Go to {MIRROR_PRODUCT.name}
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </Wrap>
      </Section>

      {/* --------------------------------------------------------------- faq */}
      <Faq items={CORE_FAQ} />

      {/* --------------------------------------------------------------- cta */}
      <Section tight>
        <Wrap wide>
          <div className="wash grid gap-8 rounded-[var(--radius-hero)] border border-ink-200 p-8 sm:p-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <Eyebrow>If you need something to hand over</Eyebrow>
              <h2 className="t-title mt-4 text-ink-900">
                An on-screen result answers your question. An appeal needs a document.
              </h2>
              <p className="t-lead mt-4 max-w-2xl text-ink-600">
                The Pro evidence report is a dated PDF carrying the signal strength and its band,
                the per-passage breakdown after correction, the keys tested, the full stated limits,
                and a SHA-256 hash tying it to the exact file you checked. The hash is what stops
                the report being waved at a different draft.
              </p>
            </div>
            <div className="shrink-0">
              <ButtonLink href="/pricing" tone="primary">
                See what is in the report
              </ButtonLink>
            </div>
          </div>
        </Wrap>
      </Section>
    </>
  )
}
