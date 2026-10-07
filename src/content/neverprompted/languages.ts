import { LANGUAGE_NAMES, SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/detector/languages'
import type { LongTailPage } from '../pages-types'

/**
 * Language pages: light variation from watermarkremoverpro/pages.ts's LANGUAGES
 * is enough here, deliberately. The underlying fact (a style baseline has to be
 * measured per language, not borrowed from a neighbouring one) is a feature
 * fact, not a positioning claim, so it does not need reframing the way the
 * audience and comparison pages do. See docs/neverprompted_launch_strategy.md,
 * Part B2.
 */

const LANGUAGE_NOTES: Record<LanguageCode, string> = {
  en: 'English has the largest reference corpus of the five, simply because it is where most contemporary writing samples come from.',
  es: 'Spanish writing measured against a Spanish reference rather than an English one, because comparing Spanish prose to an English baseline produces deviations that are artefacts of the mismatch, not signal.',
  fr: 'French writing measured against a French reference, including the elision and clitic patterns a token-level English baseline handles badly.',
  de: 'German writing measured against a German reference, where compounding and verb-final clauses make sentence-length and vocabulary statistics differ substantially from English.',
  pt: 'Portuguese writing measured against a Portuguese reference rather than folded in with Spanish, which is a common and consequential shortcut in multilingual tooling.',
}

export const LANGUAGES: LongTailPage[] = SUPPORTED_LANGUAGES.map((code) => ({
  slug: LANGUAGE_NAMES[code].toLowerCase(),
  group: 'in' as const,
  title: `Make ${LANGUAGE_NAMES[code]} writing sound like you again`,
  metaTitle: `${LANGUAGE_NAMES[code]} AI humaniser, on your device`,
  metaDescription: `Rewrite ${LANGUAGE_NAMES[code]} writing so it sounds like you again, measured against a reference baseline built from real ${LANGUAGE_NAMES[code]} prose, not borrowed from another language. Runs in your browser.`,
  intro: `NeverPrompted supports ${LANGUAGE_NAMES[code]} with its own measured reference baseline, not a shortcut through English or a neighbouring language. ${LANGUAGE_NOTES[code]}`,
  sections: [
    {
      heading: 'Why a borrowed baseline gives you the wrong answer',
      body: [
        'Telling you how AI-flavoured your writing reads means comparing it to real writing in the same language. Comparing it to the wrong language does not give you a smaller signal, it gives you a meaningless one dressed up as a real measurement.',
        `NeverPrompted measured its ${LANGUAGE_NAMES[code]} baseline from contemporary ${LANGUAGE_NAMES[code]} prose, and every document in that corpus was verified to be ${LANGUAGE_NAMES[code]} before it was used.`,
        'The rewrite itself works the same way: it targets the phrasing habits that read as AI-generated in that specific language, not a translated list of English ones.',
      ],
    },
      {
        heading: 'If the language cannot be worked out',
      body: [
        'When the engine cannot confidently tell what language a document is in, it says so rather than guessing and quietly measuring against the nearest match. A wrong-language result looks exactly like a right one until you notice everything you write scores the same, which is the sign something upstream is broken.',
          'You can also set the language explicitly before running the check, if you know it and the engine is unsure.',
        ],
      },
      {
        heading: 'What the result can and cannot tell you',
        body: [
          `A result for ${LANGUAGE_NAMES[code]} tells you how this draft compares with the ${LANGUAGE_NAMES[code]} reference used by the engine. It does not grade your fluency, decide whether the writing is good, or identify who wrote it. A formal register, specialist subject or careful second-language edit can all sit away from the reference for perfectly ordinary reasons.`,
          'Use the highlighted passages as editing prompts, not verdicts. Keep a change when it makes the sentence clearer or more like something you would say; ignore it when it changes your meaning, your terminology or a deliberate choice of tone. The point is control over the draft, not a number to chase.',
          `The rewrite is equally explicit about its limits. It can change stock phrasing and rhythm in ${LANGUAGE_NAMES[code]} while preserving the facts you supplied, but it cannot prove authorship or guarantee a result against a vendor's private detector. You see the before-and-after text and decide what stays.`,
          'That distinction matters when a draft is formal or translated. A lower distance from the reference is not automatically better, and a higher distance is not a failure. The useful question is whether a suggested change improves this sentence for its intended reader.',
          'Keep the draft you started with, review each proposed change, and treat the measurement as one piece of editing evidence. Your judgement about meaning, tone and context remains the final check.',
        ],
      },
  ],
  faq: [
    {
      question: `Does the rewrite work as well in ${LANGUAGE_NAMES[code]} as in English?`,
      answer:
        'It targets whatever the measured baseline for that language actually shows, so it is only as good as that baseline, and the English one is currently the largest. Every result states the size and retrieval date of the corpus behind it, so you are never guessing how much to trust it.',
    },
    {
      question: 'What happens with a language that is not supported yet?',
      answer:
        'It is reported as unsupported rather than quietly analysed against a substitute. Adding a language means measuring a real corpus for it first, not adding a name to a dropdown.',
    },
  ],
}))
