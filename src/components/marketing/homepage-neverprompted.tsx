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
 * NeverPrompted's homepage: plain-English, "sound like yourself" register.
 * Same live tool and the same exhibit components as WatermarkRemoverPro's
 * homepage (homepage-watermarkremoverpro.tsx), rendered with this brand's
 * own copy rather than the statistical/forensic voice that brand leads with.
 * See docs/neverprompted_launch_strategy.md, Part B1.
 */
export function NeverPromptedHome({
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
            <Eyebrow>Free · nothing leaves this tab</Eyebrow>
            <h1 className="t-display mt-6 text-ink-900">Get your own voice back.</h1>
            <p className="t-lead mx-auto mt-5 max-w-2xl text-ink-600">
              Paste in a draft that reads like it came out of a prompt box, and {SITE.name} hands
              you back a version that sounds like you again, plus a plain comparison of what
              changed and why. It happens right here, in this browser tab, on this device.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-3xl">
            <Workspace />
          </div>

          <ul className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[13px] text-ink-500">
            <TrustItem>Runs on your device: open the network tab and watch nothing go out</TrustItem>
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
            title="Three steps, and none of them touch a server."
            lead="The engine downloads to your browser once. Your draft is read and rewritten there, so there is nothing about your writing for anyone else to store, log or read."
          />

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <StepCard
              index="1"
              tone="seal"
              title="Paste your draft in"
              body="Type it in, drop a file on the box, or use the upload button. Plain text, Markdown, RTF and CSV all read straight off your disk."
            />
            <StepCard
              index="2"
              tone="mint"
              title="Press one button"
              body="Language and how much to change already have sensible defaults. They live under Advanced settings if you want to adjust them, and stay out of your way if you do not."
            />
            <StepCard
              index="3"
              tone="butter"
              title="A workspace, not a wall of text"
              body="The button opens your workspace: the rewritten draft, a side-by-side comparison you can accept paragraph by paragraph, and the full check underneath if you want it. Everything you run stays on this device."
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
              title="Not different words. Your words, read out loud."
              lead="You get a version that sounds like the person who actually wrote it: fewer stock phrases, less uniform rhythm, none of the tics a careful reader has learned to spot. You can compare every paragraph, before and after, and keep only the changes you agree with."
            />
            <div className="mt-7 space-y-3">
              <Legend
                term="What changed, and why"
                body="Each paragraph shows its before and after side by side, so a change is something you can check, not something you have to take on trust."
              />
              <Legend
                term="Your call, paragraph by paragraph"
                body="Accept a rewrite, keep your own wording, or ask for another pass. Nothing is applied to the whole document without you seeing it first."
              />
              <Legend
                term="The technical check, for anyone who wants it"
                body="Underneath, the panel also reports whether a statistical watermark is present, plotted against a chance line with a confidence band around the figure. Most people never need this tab; it is there because we would rather show our working than ask for trust."
              />
            </div>
            <Link href="/method" className="link-quiet mt-6 inline-block text-sm font-medium text-ink-800">
              Read how both checks are computed
            </Link>
          </div>

          <Reveal>
            <ExhibitFrame
              url={`${SITE.url.replace(/^https?:\/\//, '')}/check`}
              tilt
              caption={
                <>
                  <strong className="font-semibold text-signal-700">A marked specimen.</strong>{' '}
                  Ordinary prose rewritten under the open reference key this product publishes,
                  then measured. Every figure on this panel was computed by the real engine at
                  build time, not written here.
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
            title="What it does, and what it won’t pretend to do."
          />

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            <Position index="01" tone="seal" title="It shows its working">
              Every number on the panel is a real statistic, carrying the sample it came from and a
              range around it. Where something could not be measured, it says so rather than
              showing a zero and letting you assume it means something.
            </Position>

            <Position index="02" tone="mint" title="It won’t oversell you">
              No tool can promise a guaranteed result against every detector, so this one doesn’t
              try. It reduces detectable AI-style evidence, both the stylistic tells and, where the
              technique allows it, the statistical mark, and it always tells you what it tested.
            </Position>

            <Position index="03" tone="rose" title="Your writing stays yours">
              Rewriting runs on your device on every plan, with no hosted mode and no copy sent
              anywhere. It cannot guarantee beating an undisclosed watermark from a model vendor,
              because nobody outside that vendor holds the key, and it never says it can.
            </Position>
          </div>
        </Wrap>
      </Section>

      {/* --------------------------------------------------- the style channel */}
      <Section surface="deep" tight>
        <Wrap wide className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHead
              eyebrow="A second, separate check"
              eyebrowTone="rose"
              title="A style number, kept in perspective."
              lead="How far your prose sits from typical contemporary writing in the same language is a real, useful figure. It is also the easiest one to misread, so it is reported on its own and never folded into a verdict about how the text was produced."
            />
            <div className="mt-7">
              <LimitNote>
                Distance from a reference reflects register, subject and translation as much as
                anything else. Technical writing, fiction, translated text and non-native English
                all sit far from an encyclopaedic reference for entirely ordinary reasons, and none
                of that says anything about how a document was written.
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
              eyebrow="Openness"
              eyebrowTone="mint"
              title="You can check this yourself."
              lead={
                <>
                  If you would rather see it than take our word for it, the{' '}
                  <Link href="/verify" className="link-quiet font-medium text-ink-800">
                    verify page
                  </Link>{' '}
                  lets you mark a passage under our published reference key in your own browser,
                  then run the same passage against an unrelated key and watch the number sit at
                  chance. It takes about fifteen seconds.
                </>
              }
            />
            <div className="mt-7">
              <ButtonLink href="/verify" tone="quiet">
                Try it yourself
              </ButtonLink>
            </div>
          </div>

          <Panel className="p-6">
            <p className="t-heading text-ink-900">What that demonstration shows</p>
            <ul className="mt-4 space-y-3.5 text-sm leading-relaxed text-ink-600">
              <Bullet colour="bg-signal-500">
                Marked text scored under the key it was marked with, clearly above chance.
              </Bullet>
              <Bullet colour="bg-ink-400">
                The same text scored under an unrelated key, sitting right back at chance.
              </Bullet>
            </ul>
          </Panel>
        </Wrap>
      </Section>

      {/* ------------------------------------------------- the mirror product */}
      <Section surface="deep" tight>
        <Wrap wide>
          <div className="grid items-center gap-8 rounded-[var(--radius-hero)] border border-ink-200 bg-white p-8 sm:p-10 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <Eyebrow tone="ink">Looking for something else?</Eyebrow>
              <h2 className="t-title mt-4 text-ink-900">
                {SITE.name} is for writing you wrote yourself.
              </h2>
              <p className="t-lead mt-4 max-w-2xl text-ink-600">
                Checking someone else’s writing, a student’s essay or a freelancer’s draft, is a
                different job with different ethics and a different tool.{' '}
                <strong className="font-semibold text-ink-800">{MIRROR_PRODUCT.name}</strong> is
                built for {MIRROR_PRODUCT.reason}. This one is for your own words, not for judging
                somebody else’s.
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
              <Eyebrow>If you want more</Eyebrow>
              <h2 className="t-title mt-4 text-ink-900">
                Write freely, then make it sound like you every time.
              </h2>
              <p className="t-lead mt-4 max-w-2xl text-ink-600">
                Pro gives you unlimited rewriting on your device with a stronger model and a wider
                library of AI tells to catch, so there is no weekly token budget to watch. If you
                also need a dated record of your own process, for a course requirement or a
                client, Pro adds a PDF report with the check results and a hash tying it to the
                exact file. That is a useful extra, not the reason to sign up.
              </p>
            </div>
            <div className="shrink-0">
              <ButtonLink href="/pricing" tone="primary">
                See what Pro includes
              </ButtonLink>
            </div>
          </div>
        </Wrap>
      </Section>
    </>
  )
}
