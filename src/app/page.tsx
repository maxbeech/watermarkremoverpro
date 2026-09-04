import Link from 'next/link'
import { Checker } from '@/components/checker/checker'
import { CORE_FAQ, Faq } from '@/components/faq'
import { JsonLd, faqPageLd, softwareApplicationLd } from '@/components/json-ld'
import { Band, BandRule } from '@/components/brand/band'
import { BandField } from '@/components/brand/band-field'
import { ButtonLink, Eyebrow, LimitNote, Panel, Section, SectionHead, Wrap } from '@/components/brand/ui'
import { ExhibitFrame, ResultExhibit, StyleExhibit } from '@/components/marketing/exhibit'
import { Drift, Reveal } from '@/components/marketing/parallax'
import { markedSpecimenResult, unmarkedSpecimenResult } from '@/components/marketing/specimen'
import { PLANS, SITE, SUPPORTED_LANGUAGE_NAMES } from '@/lib/site'

/**
 * The homepage is built around one idea a visitor can hold: the same paragraph,
 * measured twice. One copy carries a mark under the published reference key and
 * one does not, and both panels are the app's own components rendering analyses
 * computed at build time by the same engine a browser runs. Nothing here is a
 * screenshot and no figure on this page was typed by hand.
 */
export default async function HomePage() {
  const [marked, unmarked] = await Promise.all([markedSpecimenResult(), unmarkedSpecimenResult()])

  return (
    <>
      <JsonLd data={[softwareApplicationLd(), faqPageLd(CORE_FAQ)]} />

      {/* ------------------------------------------------------------ hero */}
      <div className="paper border-b border-ink-200">
        <Wrap wide className="grid items-start gap-12 pt-16 pb-20 lg:grid-cols-[minmax(0,29rem)_minmax(0,1fr)] lg:gap-16 lg:pt-24">
          <div className="lg:pt-6">
            <Eyebrow>On-device provenance-mark diagnostic</Eyebrow>

            <h1 className="t-display mt-6 text-ink-900">
              Someone said your writing was AI.
            </h1>
            <p className="t-display mt-1 text-ink-400">
              Read the evidence yourself.
            </p>

            <BandRule at={68} className="mt-8 max-w-[11rem]" />

            <p className="t-lead mt-8 text-ink-600">
              {SITE.name} tests your own writing for a statistical provenance mark, shows how strong
              the signal is and which passages carry it, and is equally plain about what it cannot
              tell you. The free check runs in your browser. The document never leaves your device.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <ButtonLink href="/check">Check a document</ButtonLink>
              <ButtonLink href="/verify" tone="quiet">
                Test the detector first
              </ButtonLink>
            </div>

            <p className="t-eyebrow mt-8 text-ink-400">
              {SUPPORTED_LANGUAGE_NAMES.join(' · ')}
            </p>
          </div>

          {/* The two exhibits. Same prose, measured twice. */}
          <div className="relative">
            <Reveal>
              <ExhibitFrame
                url="markwitness.helm7.com/check"
                tilt
                caption={
                  <>
                    <strong className="font-medium text-signal-700">Marked specimen.</strong>{' '}
                    Committee minutes rewritten to prefer green-list continuations under the open
                    reference key {SITE.name} publishes, then measured. Every figure on this panel
                    was computed by the engine, not written here.
                  </>
                }
              >
                <ResultExhibit result={marked} passages={2} animate />
              </ExhibitFrame>
            </Reveal>

            <Drift rate={0.045} max={22} className="relative z-10 mt-10 lg:ml-16">
              <Reveal delay={120}>
                <ExhibitFrame
                  url="markwitness.helm7.com/check"
                  tilt
                  caption={
                    <>
                      <strong className="font-medium text-seal-700">The same prose, untouched.</strong>{' '}
                      Nothing was applied to this copy. The statistic sits at chance, which is what
                      an honest null result looks like.
                    </>
                  }
                >
                  <ResultExhibit result={unmarked} passages={1} />
                </ExhibitFrame>
              </Reveal>
            </Drift>
          </div>
        </Wrap>
      </div>

      {/* ----------------------------------------------------- read a band */}
      <Section surface="panel" tight>
        <Wrap wide className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-20">
          <div>
            <SectionHead
              eyebrow="How to read one"
              title="Four marks, and you can read any result on the site."
              lead="Every measurement in this product is drawn the same way, so learning it once is enough."
            />

            <dl className="mt-10 grid gap-x-10 gap-y-7 sm:grid-cols-2">
              <Legend
                term="The track"
                swatch={<div className="h-[10px] w-full rounded-[2px] bg-seal-100" />}
              >
                The whole range the statistic can take. Nothing about your document yet.
              </Legend>
              <Legend
                term="The chance line"
                swatch={
                  <div className="relative h-[10px] w-full rounded-[2px] bg-seal-100">
                    <div className="absolute top-[-3px] bottom-[-3px] left-1/2 w-px bg-ink-400" />
                  </div>
                }
              >
                Where the number sits when nothing is there. A result at this line is a null result,
                not a low score.
              </Legend>
              <Legend
                term="The hatched interval"
                swatch={
                  <div className="relative h-[10px] w-full rounded-[2px] bg-seal-100">
                    <div className="hatch absolute inset-y-0 left-[38%] w-[34%] text-seal-300" />
                  </div>
                }
              >
                How much the measurement could move if you had measured a slightly different sample.
                Hatched, so it can never be mistaken for the value.
              </Legend>
              <Legend
                term="The marker"
                swatch={
                  <div className="relative h-[10px] w-full rounded-[2px] bg-signal-100">
                    <div className="absolute top-[-3px] bottom-[-3px] left-[72%] w-[3px] rounded-[1px] bg-signal-700" />
                  </div>
                }
              >
                What was actually measured. Amber only ever means a mark was found under a key that
                was tested.
              </Legend>
            </dl>

            <div className="mt-10 max-w-xl">
              <Eyebrow tone="ink" className="mb-3">
                The two panels above, side by side
              </Eyebrow>
              <div className="space-y-4">
                <CompareRow
                  label="Marked specimen"
                  result={marked}
                  tone="signal"
                />
                <CompareRow label="Untouched specimen" result={unmarked} tone="seal" />
              </div>
              <p className="mt-4 text-xs leading-relaxed text-ink-400">
                Same prose, same length, same engine, same key. The only difference between the two
                rows is whether a mark was applied.
              </p>
            </div>
          </div>

          <div className="hidden lg:block">
            <Drift rate={0.03} max={18}>
              <BandField className="mt-6" />
            </Drift>
            <p className="mt-6 max-w-[18rem] text-xs leading-relaxed text-ink-400">
              A document is not one measurement. It is a stack of them, each with its own interval,
              each read against the same chance line.
            </p>
          </div>
        </Wrap>
      </Section>

      {/* ------------------------------------------------------ the check */}
      <Section id="check" tight>
        <Wrap>
          <SectionHead
            eyebrow="Free, no account, nothing uploaded"
            title="Check a document now."
            lead={`Up to ${PLANS.anonymous.wordCap.toLocaleString()} words without an account. The engine downloads to your device and your text is measured there, so there is nothing for us to store, log or hand to anyone.`}
          />
          <div className="mt-10">
            <Checker />
          </div>
        </Wrap>
      </Section>

      {/* ------------------------------------------------- three positions */}
      <Section surface="deep" tight>
        <Wrap wide>
          <SectionHead
            eyebrow="Three positions this product will not trade away"
            title="What it does, and what it refuses to do."
          />

          <div className="mt-12 grid gap-10 lg:grid-cols-3 lg:gap-8">
            <Position
              index="01"
              title="It shows its working"
              band={<Band value={0.68} low={0.6} high={0.75} reference={0.5} min={0.25} max={0.85} tone="seal" />}
            >
              Every figure is a computed statistic carrying the count it came from and a band around
              it. Where something could not be measured, the result says so instead of printing a
              zero and letting you assume it meant something.
            </Position>

            <Position
              index="02"
              title="It refuses to overclaim"
              band={<Band value={0.5} low={0.42} high={0.58} reference={0.5} min={0.25} max={0.85} tone="muted" />}
            >
              A green-list mark is keyed, and no model vendor publishes its key. Results always name
              the keys that were tested, so a null result reads as “no mark found under these keys”
              and never quietly becomes “you are cleared”.
            </Position>

            <Position
              index="03"
              title="It rewrites without overclaiming"
              band={<Band value={null} min={0.25} max={0.85} reference={0.5} tone="muted" />}
            >
              The on-device rewrite reduces detectable evidence in writing you produced yourself.
              It never claims “undetectable” and never promises a specific outcome, because no
              tool, including this one, can honestly guarantee defeating a vendor’s undisclosed
              watermark, on any tier.
            </Position>
          </div>
        </Wrap>
      </Section>

      {/* ----------------------------------------------- the style channel */}
      <Section surface="panel" tight>
        <Wrap wide className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHead
              eyebrow="The second channel"
              title="A style measurement, kept in its place."
              lead="How far a document sits from contemporary reference prose in the same language is a real, useful number. It is also the single most misread number in this field, so it is reported separately and never folded into the verdict."
            />
            <div className="mt-8">
              <LimitNote>
                Distance from reference reflects register, subject and translation. Technical
                writing, fiction, translated text and non-native prose all sit far from an
                encyclopaedic reference for entirely ordinary reasons, and none of that is evidence
                about how a document was produced.
              </LimitNote>
            </div>
            <Link href="/method" className="link-quiet mt-6 inline-block text-sm text-ink-700">
              Read how both channels are computed
            </Link>
          </div>

          <Reveal>
            <ExhibitFrame url="markwitness.helm7.com/check" tilt>
              <StyleExhibit result={marked} />
            </ExhibitFrame>
          </Reveal>
        </Wrap>
      </Section>

      {/* ---------------------------------------------------------- verify */}
      <Section tight>
        <Wrap wide className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:gap-16">
          <div>
            <SectionHead
              eyebrow="Auditability"
              title="Do not take our word for it."
              lead={
                <>
                  A detector you cannot test is a detector you have to trust. On the{' '}
                  <Link href="/verify" className="link-quiet text-ink-800">
                    verify page
                  </Link>{' '}
                  you can mark a passage under our published reference key in your own browser, run
                  the check, and watch the statistic move. Then run the same passage against a
                  different key and watch it sit at chance. That is the difference between
                  arithmetic and theatre, and it takes about fifteen seconds.
                </>
              }
            />
            <div className="mt-8">
              <ButtonLink href="/verify" tone="quiet">
                Run the demonstration
              </ButtonLink>
            </div>
          </div>

          <Panel className="p-6" interactive>
            <Eyebrow tone="ink" className="mb-4">
              What that demonstration shows
            </Eyebrow>
            <ul className="space-y-4 text-sm leading-relaxed text-ink-600">
              <li className="flex gap-3">
                <span className="mt-[7px] h-[3px] w-[3px] shrink-0 bg-signal-500" />
                Marked text scored under the key it was marked with, far from chance.
              </li>
              <li className="flex gap-3">
                <span className="mt-[7px] h-[3px] w-[3px] shrink-0 bg-ink-400" />
                The very same text scored under an unrelated key, sitting at chance.
              </li>
              <li className="flex gap-3">
                <span className="mt-[7px] h-[3px] w-[3px] shrink-0 bg-seal-500" />
                Both runs happening in your browser, on text generated in front of you.
              </li>
            </ul>
          </Panel>
        </Wrap>
      </Section>

      {/* ------------------------------------------------------------- faq */}
      <Faq items={CORE_FAQ} />

      {/* ------------------------------------------------------------- cta */}
      <Section tight>
        <Wrap wide>
          <div className="paper overflow-hidden rounded-[6px] border border-ink-200 bg-white shadow-[var(--shadow-raised)]">
            <div className="grid gap-8 p-8 sm:p-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div>
                <Eyebrow>If you need something to hand over</Eyebrow>
                <h2 className="t-title mt-4 text-ink-900">
                  An on-screen result answers your question. An appeal needs a document.
                </h2>
                <p className="t-lead mt-5 max-w-2xl text-ink-600">
                  The Pro evidence report is a dated PDF carrying the signal strength and its band,
                  the per-passage breakdown after correction, the keys tested, the full stated
                  limits, and a SHA-256 hash tying it to the exact file you checked. The hash is
                  what stops the report being waved at a different draft.
                </p>
              </div>
              <div className="shrink-0">
                <ButtonLink href="/pricing" tone="ink">
                  See what is in the report
                </ButtonLink>
              </div>
            </div>
          </div>
        </Wrap>
      </Section>
    </>
  )
}

/* ------------------------------------------------------------- fragments */

function Legend({
  term,
  swatch,
  children,
}: {
  term: string
  swatch: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="max-w-[10rem]">{swatch}</div>
      <dt className="mt-3 text-sm font-medium text-ink-800">{term}</dt>
      <dd className="mt-1.5 text-sm leading-relaxed text-ink-600">{children}</dd>
    </div>
  )
}

function CompareRow({
  label,
  result,
  tone,
}: {
  label: string
  result: Awaited<ReturnType<typeof markedSpecimenResult>>
  tone: 'seal' | 'signal'
}) {
  const key = result.watermark.results[0]
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)_4.5rem] items-center gap-4">
      <span className="text-xs text-ink-500">{label}</span>
      <Band
        value={key?.greenRate}
        low={key?.greenRateInterval?.low}
        high={key?.greenRateInterval?.high}
        reference={key?.expectedGreenRate}
        min={0.25}
        max={0.85}
        tone={tone}
        title={`${label}: green-list rate against chance`}
      />
      <span className={`figure text-right text-xs ${tone === 'signal' ? 'text-signal-700' : 'text-ink-500'}`}>
        z {key?.z?.toFixed(2) ?? 'n/a'}
      </span>
    </div>
  )
}

function Position({
  index,
  title,
  band,
  children,
}: {
  index: string
  title: string
  band: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="group border-t border-ink-300 pt-6">
      <div className="flex items-baseline justify-between gap-4">
        <span className="figure text-xs text-ink-400">{index}</span>
        <div className="w-24 shrink-0 opacity-70 transition-opacity duration-300 group-hover:opacity-100">
          {band}
        </div>
      </div>
      <h3 className="t-heading mt-5 text-ink-900">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-ink-600">{children}</p>
    </div>
  )
}
