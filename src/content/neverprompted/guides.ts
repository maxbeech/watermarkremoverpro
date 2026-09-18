import type { LongTailPage } from '../pages-types'

/**
 * NeverPrompted’s `/guide/*` pages.
 *
 * This brand leads with sounding human, not with watermark forensics: keep
 * that register here even where a page also has to be honest about the
 * on-device watermark check. See docs/neverprompted_launch_strategy.md for
 * why this is written fresh rather than reskinned from
 * ../watermarkremoverpro/pages.ts.
 */

export const GUIDES: LongTailPage[] = [
  {
    slug: 'does-my-writing-sound-like-ai',
    group: 'guide',
    title: 'Does My Writing Sound Like AI?',
    metaTitle: 'Does My Writing Sound Like AI? A Real Checklist | NeverPrompted',
    metaDescription:
      'The actual tells that make writing read as AI-generated, a checklist you can run on your own draft right now, and what an on-device check adds beyond eyeballing it.',
    intro:
      'Your writing probably sounds like AI if it leans on stock transitions, hedges constantly, keeps sentences a near-identical length, reaches for a showy word like “delve” instead of something plainer, and avoids specific, checkable detail. Read a paragraph aloud: flat, uniform rhythm is the tell. A proper check also tests for a statistical AI watermark, which reading alone can’t find.',
    sections: [
      {
        heading: 'The tells you can check for right now',
        body: [
          'Start with vocabulary. AI drafts default to a small set of safe, faintly impressive words that say very little, the word above is one of a whole family of them (this site keeps a fuller list, if you want to check yours against it). The same habit shows up in transition words strung between almost every paragraph, whether or not the ideas actually need stitching together. If you can cut a transition word and the sentence still makes sense, it was filler.',
          'Next, look at shape. Print a page and glance at where the sentences end: if every line breaks at roughly the same length, that’s worth noticing. Human writing naturally varies, a blunt six-word sentence next to a longer one that unpacks it. AI writing tends to smooth that out into a steady, even rhythm, the same paragraph shape recurring section after section instead of actually varying with what’s being said.',
          'Last, check for specifics. Vague, confident claims (“this approach offers significant advantages”) with no number, name, date, or concrete example attached are a strong signal. So is a total absence of hedging on things that actually deserve doubt, next to constant hedging on things that don’t; “it’s worth noting that” is the classic filler here. Real writing commits to a position somewhere and admits uncertainty somewhere else, unevenly, because that’s what actually thinking about a subject looks like.',
        ],
      },
      {
        heading: 'Why your own eyes only get you halfway',
        body: [
          'People are bad at spotting statistical uniformity across a whole document. You notice one stock phrase, not that a document uses the same handful of them a dozen times, or that every paragraph runs to within a few words of the same length. Once a paragraph reads smoothly, most readers, including the person who wrote it, stop scrutinizing it. That’s exactly the blind spot polished, AI-flavored prose exploits.',
          'There’s also a harder limit: if a passage came from a system that quietly biases its own word choices during generation, no amount of careful reading reveals that. That kind of signal, an AI watermark, is built to be invisible to a human reader and only recoverable with a keyed statistical test run against the actual text.',
          'The reverse is true too. Careful, well-edited, or non-native English can fail the “eyeball” tells above for reasons that have nothing to do with AI, formal register and correct grammar just look regular. So a page that passes your read-through isn’t necessarily clean, and a page that trips a tell or two isn’t necessarily AI-written. You need both a specific checklist and a proper statistical test, not one or the other.',
        ],
      },
      {
        heading: 'What NeverPrompted’s check adds',
        body: [
          'NeverPrompted runs two separate checks on your draft, entirely on your device. A style scan flags the exact tells above, the stock phrase, the hedge, the run of same-length sentences, with the specific passage that triggered it, so you can see and fix the actual sentence rather than stare at a single opaque score. A separate check runs a statistical test aimed at the kind of watermark some AI systems apply to their own output.',
          'Checking is free and unlimited on the Free plan; the point is that you can run it as often as you draft, not just once at the end. Nothing is uploaded for either check: the text stays on your device the whole time.',
          'One honest limit, stated plainly: no check, including this one, can promise a specific result against a watermark keyed by a vendor who has never shared that key. What NeverPrompted gives you is real, checkable evidence, the specific phrases and patterns, and where any statistical signal concentrates, so you can make an informed edit, not a score to chase.',
        ],
      },
    ],
    faq: [
      {
        question: 'Can I just tell by reading it myself?',
        answer:
          'Partly. The checklist in this guide (stock transitions, hedging, uniform sentence length, showy vocabulary, missing specifics) catches a lot on its own. What it can’t catch is a statistical AI watermark, a signal built to be invisible to a reader and only recoverable with a keyed test, which is what NeverPrompted’s separate check is for.',
      },
      {
        question: 'Does a clean result mean my writing definitely wasn’t AI-generated?',
        answer:
          'No. A clean result means this particular test, run against the keys it holds, didn’t find this particular kind of signal in this passage. It isn’t proof of authorship in either direction, and no honest tool can claim otherwise.',
      },
      {
        question: 'Can I use this to check someone else’s writing, like a student’s essay?',
        answer:
          'No. NeverPrompted is built for checking and improving your own writing before you publish or submit it. Screening someone else’s submissions is a different job, with different obligations around consent and fairness, and that’s what the separate product Learnaway (learnaway.ai) is built for.',
      },
    ],
  },

  {
    slug: 'how-to-make-ai-text-sound-human',
    group: 'guide',
    title: 'How to Make AI Text Sound Human',
    metaTitle: 'How to Make AI Text Sound Human: What Actually Works | NeverPrompted',
    metaDescription:
      'The concrete edits that actually change AI-flavoured writing: sentence rhythm, cutting hedges and stock transitions, adding specifics, reading it aloud, and how to automate the pass.',
    intro:
      'Vary your sentence lengths so some are short and blunt and others run longer. Cut hedges like “it’s worth noting” and stock transitions like “moreover”. Replace a vague claim with one concrete, checkable detail: a number, a name, a specific example. Read it aloud and fix anything that sounds like a brochure. NeverPrompted automates this exact rewrite, on-device.',
    sections: [
      {
        heading: 'Vary the rhythm of your sentences',
        body: [
          'AI drafts tend to keep sentences a similar length and shape, which reads smoothly but flat. Go through a paragraph and mark each sentence short, medium, or long. If they’re all medium, that’s the problem: chop one into two, or combine two short ones with a comma and a connecting thought, until the paragraph has an actual rhythm to it.',
          'Compare: “The new process improves efficiency and reduces errors across the workflow, which benefits both the team and the client.” versus: “The new process is faster. It also catches mistakes the old one missed, which the team noticed within a week, and the client noticed in their invoice.” Same information, but the second version has a short opening statement, a real detail, and a specific consequence, instead of one long sentence doing everything at once.',
        ],
      },
      {
        heading: 'Cut the hedges and stock transitions',
        body: [
          'Scan for stock transition words, the ones you reach for out of habit rather than because the sentence needs them. Most of the time you can cut the word entirely and the sentence reads better, because it was gluing two ideas together that could just sit next to each other, or connect with a plain “and”, “but”, or “so”.',
          'Hedges are a separate problem: phrases like “this may suggest” or “arguably”, stacked up, let a piece of writing avoid ever actually claiming anything. State your actual view. If you’re genuinely unsure, say so once, specifically, rather than hedging every sentence out of habit.',
        ],
      },
      {
        heading: 'Add one concrete detail, then read it aloud',
        body: [
          'The single highest-value edit is usually the smallest: take a vague, general claim and attach one specific fact to it, a number, a date, a name, an anecdote. “This approach saves time” becomes “this cut our review time from three days to one.” Specificity is what a person with actual knowledge sounds like; vagueness is what a summary of a summary sounds like.',
          'Then read the whole thing aloud. Your mouth catches things your eye skips over, an unnaturally even rhythm, a sentence that’s technically fine but nobody would actually say out loud. If you stumble on a sentence because it’s a mouthful, a reader will stumble on it too.',
          'NeverPrompted runs this exact pass automatically: an on-device model targets uneven sentence rhythm and stock phrasing in your own draft, at a strength you choose. The Free plan includes a weekly token budget for this; Pro gives you unlimited rewriting with a better on-device model, plus a dated PDF report of what changed.',
        ],
      },
    ],
    faq: [
      {
        question: 'Does shorter always mean more human?',
        answer:
          'No, it’s about variety, not brevity. A paragraph of only short sentences reads just as flat and mechanical as one of only long sentences. The tell is uniformity in either direction, not length itself.',
      },
      {
        question: 'What’s the single biggest change I can make?',
        answer:
          'Cut the hedges and stock transitions, then add one specific, checkable detail to your vaguest sentence. Those two edits alone fix most of what makes a paragraph read as generic.',
      },
      {
        question: 'Can NeverPrompted do this for me automatically?',
        answer:
          'Yes. The rewrite runs entirely on your device, targets these exact patterns in your own draft, and never uploads your text. You choose the strength; you approve the result.',
      },
    ],
  },

  {
    slug: 'why-does-my-writing-get-flagged-as-ai',
    group: 'guide',
    title: 'Why Does My Writing Get Flagged as AI?',
    metaTitle: 'Why Does My Writing Get Flagged as AI (Even Though You Wrote It)',
    metaDescription:
      'Classifiers and style-flags measure predictability and pattern, not authorship. Here’s why clear, well-edited, or non-native English often gets caught, and what a flag actually does and doesn’t prove.',
    intro:
      'Getting flagged doesn’t mean a machine caught you lying. Classifiers and style checkers measure how predictable your sentences are and how closely your patterns resemble a training set, not who actually typed the words. That’s why plenty of genuinely human writing, especially writing that’s careful, well-edited, or written in a second language, sets them off for reasons that have nothing to do with authorship.',
    sections: [
      {
        heading: 'What these tools are actually measuring',
        body: [
          'Language models tend to pick likely next words, so their output has low “surprise”, technically, low perplexity. A classifier built to spot AI writing is largely trained to notice that low-surprise pattern: predictable word choices, predictable sentence construction, predictable structure. It isn’t reading your text for who wrote it; it’s comparing statistical patterns to examples it was trained on.',
          'A related measure is variation across a document, sometimes called burstiness. Human writing naturally swings between simple and complex sentences, focused and rambling paragraphs, because a person’s attention and energy vary as they write. A classifier trained to notice AI output is also, by construction, trained to notice the absence of that variation. Either way, it’s pattern-matching against a labeled dataset, and it inherits every gap and bias baked into that dataset.',
        ],
      },
      {
        heading: 'Why careful or non-native English trips the wire',
        body: [
          'Someone writing fluently in a second language often produces textbook-correct, grammatically regular prose, fewer idioms, fewer unusual constructions, more consistent sentence patterns. Statistically, that regularity looks closer to model output than a native speaker’s looser, messier first draft does, even though it’s entirely human and often the result of real skill and effort.',
          'The same thing happens with heavily edited writing. Running a paragraph through a grammar or style checker nudges it toward smoother, more regular phrasing, the exact regularity a classifier is trained to notice. A careful copyedit and a model’s output can end up statistically closer to each other than either is to a rough, unedited human draft. Formal registers, academic, legal, technical writing, already sit closer to that same smoothed pattern, because both humans and models are trained on, or aiming at, the same conventions.',
        ],
      },
      {
        heading: 'What a flag actually tells you, and what it doesn’t',
        body: [
          'A flag is a statistical estimate with a real false-positive rate, not a verdict on who wrote something. Treat it as a pointer at specific sentences, usually the ones with the flattest rhythm or the most stock phrasing, worth a second look, rather than proof of anything about you.',
          'It’s also a different kind of signal from an actual AI watermark, a deliberate statistical mark some systems embed in their own output, testable with the right key. A style flag guesses from resemblance; a watermark test looks for a specific planted signal. But even a watermark check has its own honest limit: nobody outside the vendor holding that key can test it with full certainty, so no result from any tool, style-based or watermark-based, settles the question outright.',
        ],
      },
    ],
    faq: [
      {
        question: 'Can these tools ever be completely accurate?',
        answer:
          'No. They’re statistical estimates trained on a labeled dataset, and every one publishes, or should publish, a false-positive rate. That rate is never zero, and it tends to be worst at the edges, formal writing, non-native English, heavily edited prose.',
      },
      {
        question: 'Is being flagged the same as having a watermark in my text?',
        answer:
          'No. A style flag is a guess based on how closely your writing resembles known AI output. A watermark is a deliberate signal a specific AI system chose to embed in its own generation, tested for with a key. They measure different things, and a text can trip one without the other.',
      },
      {
        question: 'What should I do if I get flagged and I know I wrote it myself?',
        answer:
          'Look at the specific sentences the tool reacted to, usually the flattest or most formulaic ones, and decide on their own merits whether they’re worth revising for clarity. Don’t treat the score itself as evidence about you; it’s a pattern match, not a verdict.',
      },
    ],
  },

  {
    slug: 'neverprompted-how-it-actually-works',
    group: 'guide',
    title: 'How NeverPrompted Actually Works',
    metaTitle: 'How NeverPrompted Actually Works: Rewrite, Watermark Check, On-Device',
    metaDescription:
      'The honest, complete explanation of NeverPrompted: what the on-device rewrite changes, how the watermark check works and why it can’t promise a result, and why nothing is ever uploaded.',
    intro:
      'NeverPrompted does two separate things, both entirely on your device: it rewrites your own draft to cut the specific patterns that read as AI, and it runs a statistical test for the kind of watermark some AI systems embed in their output. Here’s exactly what each one does, how the watermark mechanism actually works, and where the honest limits are.',
    sections: [
      {
        heading: 'The rewrite: what it actually changes',
        body: [
          'The rewrite is an on-device language model that specifically targets the tells covered elsewhere on this site: stock transitions, hedging phrases, showy vocabulary, a dash used as an all-purpose connector, a flat, uniform sentence rhythm across a whole document. It isn’t a generic paraphraser that shuffles synonyms; it’s aimed at the specific patterns that make writing read as AI-generated in the first place.',
          'It works on your own draft, keeping your meaning and structure, and you choose how heavy a pass to run. A light pass might just break up a run of same-length sentences and cut a handful of stock phrases; a heavier pass rewrites more aggressively while staying anchored to what you actually said. Either way, you see and approve the result, it’s an edit, not a black box.',
          'One honest limit: this is a style edit. The words are genuinely changed, by a model acting on your instructions, but no tool can promise a rewritten passage will clear every checker every time, because style-based classifiers keep changing what they key on, and nobody, including us, controls that.',
        ],
      },
      {
        heading: 'The watermark check: what it actually tests',
        body: [
          'Some AI systems embed a deliberate statistical signature in their own output, a genuine provenance mark, not a style guess. The specific mechanism, after the method described by Kirchenbauer et al. in 2023, works by splitting a model’s vocabulary into a “green” list and a “red” list at each generation step, using a hash seeded by a secret key and the words already generated, then quietly biasing generation toward the green list. Over enough text, that produces a statistical skew that wouldn’t happen by chance.',
          'NeverPrompted’s check runs a keyed statistical test aimed at exactly that kind of skew, entirely on-device, and reports how strong any signal is and which passages carry it. The honest catch: only the party holding the actual key used at generation time can test with full certainty. An outside test, including this one, is necessarily an estimate against a scheme it wasn’t given the key to, which is exactly why no honest tool can promise a specific result against an undisclosed vendor’s watermark. A clean result here means this test found no such signal under the keys it holds, not that the text is cleared. For someone dealing with an actual accusation who needs the deeper statistical and forensic detail behind a specific case, that’s a more specialized job than this feature is built for, and a separate product exists for exactly that side of it.',
        ],
      },
      {
        heading: 'Why nothing is ever uploaded, on either feature',
        body: [
          'Text you haven’t published yet, or a document someone’s already questioning, is sensitive by nature. Sending it to a server for either job would mean someone else’s infrastructure has a copy of it. Running both the rewrite model and the watermark test on-device avoids that by how the product is built, not by a policy promise you have to trust.',
          'In practice, that means the model doing the rewriting and the test doing the watermark check both execute locally on your machine. Your draft, and the result of checking it, stay there.',
        ],
      },
    ],
    faq: [
      {
        question: 'What’s the actual difference between the rewrite and the check?',
        answer:
          'The rewrite changes your writing to cut specific AI-sounding patterns, stock phrasing, hedging, flat rhythm. The check tests for a completely different thing: a deliberate statistical watermark some AI systems embed in their own output. You can use either on its own, or both together.',
      },
      {
        question: 'Can NeverPrompted promise my text won’t be flagged or won’t test positive for a watermark?',
        answer:
          'No, and any tool that claims otherwise is overselling what’s technically possible. Style classifiers keep changing, and a watermark is keyed by whoever generated the text, so nobody outside that vendor can test it with certainty. NeverPrompted reduces detectable AI-style evidence and reports what it finds; it can’t promise an outcome against a scheme it doesn’t hold the key to.',
      },
      {
        question: 'Why does on-device processing matter if I trust the company?',
        answer:
          'Drafts often contain unpublished ideas, client material, or something you’re actively worried will be scrutinized. Keeping the text on your device sidesteps the question of trust entirely, there’s no upload for anyone to trust in the first place.',
      },
    ],
  },

  {
    slug: 'make-your-essay-sound-more-human',
    group: 'guide',
    title: 'How to Make Your Essay Sound More Human Before You Submit It',
    metaTitle: 'Make Your Essay Sound More Human Before You Submit | NeverPrompted',
    metaDescription:
      'Used AI to get a first draft moving? A practical, honest guide to rewriting your essay in your own voice and words before you hand it in, not a trick to disguise it afterward.',
    intro:
      'If you used AI to get a first draft moving and now want your final version to actually be yours, the fix isn’t a trick, it’s rewriting the thing properly before you hand it in. Here’s how to do that in a way that actually holds up, not just one that reads smoother.',
    sections: [
      {
        heading: 'Understand it before you touch a sentence',
        body: [
          'Read the whole draft, paragraph by paragraph, and ask yourself honestly: could I explain this point out loud to a friend, right now, without looking at the screen? If the answer is no, you don’t own that idea yet, and rephrasing the sentence won’t fix that. Go figure out the actual point first, from the sources or the reasoning behind it, not from the draft’s wording.',
          'Once you understand a paragraph, close the draft and write it again from memory of the idea, not the wording. This is the single most reliable technique here: because you’re generating the sentences yourself, from your own understanding, the result is genuinely in your voice, not an adjusted version of someone else’s.',
          'It’s fine to keep a structure or argument order that was already good, that’s a separate question from whether the sentences themselves are honestly yours.',
        ],
      },
      {
        heading: 'Make the sentences actually sound like you',
        body: [
          'Vary your sentence lengths instead of keeping them all the same size. Cut hedging phrases and stock transitions wherever you find them. Swap generic phrasing for how you’d actually say it, including a real opinion or a genuine hesitation, if that’s honestly where you land.',
          'Add specifics only you would actually know or would go find: a detail from the reading you did, a real reaction you had to it, a caveat you actually believe rather than a safe, balanced non-statement. That specificity is what separates writing that’s technically correct from writing with an actual person and a stance behind it.',
          'Leave in a few natural rough edges. Real drafts have the odd imperfect sentence; polishing every single line to the same finish is itself a tell.',
        ],
      },
      {
        heading: 'Before you submit',
        body: [
          'Run the final version through NeverPrompted’s check as a sanity read on the patterns covered in this guide, stock phrasing, hedging, flat rhythm, not as a pass or fail gate. It runs on your device, so the essay doesn’t leave your machine before you hand it in.',
          'Separately, and just as importantly, know your school’s actual policy on AI assistance. That’s a different question from whether the prose reads as AI-flavored, and it matters regardless of how the answer to that first question comes out. A paragraph you’ve genuinely rewritten in your own words doesn’t retroactively resolve a policy that required you to disclose how you used AI along the way, if that’s what your institution asks for.',
        ],
      },
    ],
    faq: [
      {
        question: 'Is it cheating to use a tool to help me rewrite?',
        answer:
          'It depends entirely on your institution’s policy, so check it rather than guess. A rewrite tool edits the phrasing of your own understanding, it doesn’t research the topic or construct the argument for you, but whether that’s permitted, and whether you need to disclose it, is a question only your syllabus or academic integrity policy can answer.',
      },
      {
        question: 'How much do I actually need to change?',
        answer:
          'Enough that you could sit in office hours and explain, in your own words, why every sentence says what it says. That’s a more useful bar than any percentage or score.',
      },
      {
        question: 'Will this promise my essay won’t get flagged?',
        answer:
          'No. Rewriting a paragraph properly, in your own words and understanding, is genuinely different from disguising AI-written text, and it’s the only approach that holds up regardless of what any detector says. But no tool can promise a specific result against a checker it doesn’t control.',
      },
    ],
  },

  {
    slug: 'why-does-grammarly-flag-my-writing-as-ai',
    group: 'guide',
    title: 'Why Does Grammarly Flag My Writing as AI?',
    metaTitle: 'Why Does Grammarly Flag My Writing as AI? (Even When You Wrote It)',
    metaDescription:
      'Grammarly’s AI-detection feature measures surface style patterns, not a mark an AI system placed in the text. Here’s why that flags real human writing, and what actually tells you more.',
    intro:
      'Grammarly’s AI-detection feature isn’t reading a signature that ChatGPT or any other system stamped into your text. It’s a classifier trained to recognize the surface patterns common in AI writing, predictable phrasing, even sentence rhythm, and those same patterns show up plenty in real human writing too.',
    sections: [
      {
        heading: 'What that indicator is actually measuring',
        body: [
          'A tool like this is trained on a large set of examples labeled AI-written or human-written, and it learns to notice the surface patterns that tend to distinguish them: predictable word choices, regular sentence construction, a particular density of certain transition words. It’s a resemblance judgment, not a detection of any actual mark or metadata the AI system left behind. Nothing about how a language model generates text embeds a Grammarly-readable signature; the tool is guessing from style.',
          'That means the output is a statistical estimate, usually shown as a percentage, shaped entirely by whatever the training data happened to contain. Its blind spots and its false-positive patterns are set the moment that training data was chosen, and there’s no way for the tool itself to tell you which of those it’s currently tripping over in your text.',
        ],
      },
      {
        heading: 'Why real human writing sets it off',
        body: [
          'Over-edited prose pushes toward exactly the kind of regularity the classifier keys on. Running your own paragraph through Grammarly’s grammar and clarity suggestions, ironically, nudges it toward smoother, more consistent phrasing, closer to the pattern its own AI-detection feature is trained to flag. Using the tool’s suggestions can make your writing statistically resemble what the tool considers suspicious.',
          'Non-native English speakers who write careful, textbook-correct sentences often get flagged more than native speakers writing loose or unusual prose, because correct and regular statistically resembles model output more than a messy human first draft does. None of that has anything to do with who actually wrote the sentence.',
          'Formal registers make this worse. Academic writing, business writing, technical writing, all of it already sits closer to the same conventions language models were trained on, so a careful, well-structured report or essay starts from a position that looks more like AI output than a casual email would, before a single word was generated by a machine.',
        ],
      },
      {
        heading: 'What actually tells you more',
        body: [
          'A real AI watermark, when one exists, is a deliberate statistical signal a specific system embeds during its own generation, testable with the right key, which is a fundamentally different kind of evidence from a style guess based on resemblance. It’s still not certain proof either way, since nobody outside the vendor holding that key can test it with full confidence, but it’s answering a different, more specific question than “does this look like typical AI phrasing.”',
          'If you got flagged and know you wrote it yourself, look at what the tool is actually reacting to, probably rhythm or hedge-heavy phrasing, and decide on the merits whether it’s worth changing for clarity’s sake. Treat the score as a pattern match against someone else’s dataset, not a verdict about you.',
        ],
      },
    ],
    faq: [
      {
        question: 'Does Grammarly know if I used ChatGPT?',
        answer:
          'No. It’s inferring from writing style, comparing your text’s patterns to examples it was trained on, not reading any marker the AI system left behind. It has no way to confirm provenance either way.',
      },
      {
        question: 'Why did my writing get flagged more after I used Grammarly’s own suggestions?',
        answer:
          'Its editing suggestions smooth phrasing toward more regular, consistent sentence construction, which happens to be closer to the pattern its AI-detection feature is trained to notice. The suggestions and the detector are pulling in the same statistical direction.',
      },
      {
        question: 'What should I do if I’m confident I wrote it myself?',
        answer:
          'Look at the specific sentences it flagged rather than the score itself. If they’re genuinely formal or heavily edited, that’s likely why, and it says nothing about your actual authorship.',
      },
    ],
  },

  {
    slug: 'ai-tells-that-give-away-generated-text',
    group: 'guide',
    title: 'AI Tells That Give Away Generated Text',
    metaTitle: 'AI Tells That Give Away Generated Text: A Working Reference | NeverPrompted',
    metaDescription:
      'A concrete, specific reference to the actual patterns that read as AI-generated: stock phrases, structural habits, and rhetorical tics, worth bookmarking rather than skimming once.',
    intro:
      'Here’s a working list of the patterns that make text read as AI-generated, specific words, structures, and habits, not vague vibes. Bookmark it: run through it any time something you or a colleague wrote feels a little off, and check the exact thing tripping the alarm instead of guessing.',
    sections: [
      {
        heading: 'Phrasing and vocabulary tells',
        body: [
          'A short list of words and phrases shows up constantly in AI-generated text: “delve into”, “it’s important to note”, “in today’s fast-paced world”, “boast” (as in “the app boasts a range of features”), “robust”, “tapestry”, “testament to”, “navigate the complexities of”. These became defaults because they’re safe and generic, they sound substantial without committing to anything specific, which is exactly what a model optimizing for plausible-sounding text tends to produce.',
          'Watch the transition words too: “moreover”, “furthermore”, “additionally”, “in conclusion”, “that said”, stacked between nearly every paragraph. Human writing usually connects ideas with a plain “and”, “but”, or “so”, or nothing at all, letting one point follow another without narrating the connection. A document that formally announces every transition is doing more scaffolding than the ideas actually need.',
          'The dash is a related tell, specifically its overuse as an all-purpose connector, standing in for a comma, colon, or period in sentence after sentence. One dash used well is ordinary punctuation. A document that reaches for it constantly, in place of every other kind of pause, is showing a habit rather than a stylistic choice.',
        ],
      },
      {
        heading: 'Structural tells',
        body: [
          'Uniform sentence length across a whole document is one of the most reliable tells: human writing swings between short and long, focused and rambling, because attention and energy vary as a person writes. A document where every sentence runs to within a few words of the same length, paragraph after paragraph, reads smooth but mechanical.',
          'Watch for listicle-brain hiding inside prose: paragraphs secretly organized into three neat, parallel points even when written as flowing sentences rather than a bulleted list. A topic sentence, three supporting points of roughly equal weight, and a tidy wrap-up sentence, repeated with the same shape across every section of a piece, is a structural fingerprint, not a coincidence.',
          'Symmetric openings and closings are another: restating the question almost word-for-word at the start of an answer, then again as a summary at the end, as though the piece needs to prove it addressed the prompt on both sides of the content in the middle.',
        ],
      },
      {
        heading: 'Rhetorical tells',
        body: [
          'Excessive hedging is a strong signal: “it could be argued that”, “some might say”, “it’s worth considering”, stacked so densely that no actual claim ever lands. Genuine writing usually commits to a position somewhere, even a modest one, because a person with a real view eventually says what they think.',
          'A flattened emotional register is another: every topic gets the same even-handed, mildly positive treatment regardless of whether the subject actually has an obvious lean, with no real surprise, frustration, or specific enthusiasm about anything in particular.',
          'None of these tells alone proves a document was AI-generated, a careful human writer can do any single one of them on a given day. It’s the density and repetition of several of them together, across a whole piece, that’s the actual signal, which is exactly what a proper statistical check measures instead of a reader guessing from a handful of examples.',
        ],
      },
    ],
    faq: [
      {
        question: 'Is using a dash always a sign of AI writing?',
        answer:
          'No. One dash used correctly is normal punctuation that plenty of human writers use well. The tell is the pattern: reaching for it constantly, in place of commas, colons, and periods alike, throughout a whole document.',
      },
      {
        question: 'What’s the single most common tell?',
        answer:
          'Probably the combination of uniform sentence rhythm and a handful of stock transition words repeated across every paragraph. Either one alone is unremarkable; together, and repeated, they’re a strong pattern.',
      },
      {
        question: 'Can I train myself to spot these without a tool?',
        answer:
          'Partly, and this list is a good starting checklist. But tallying pattern density accurately across a whole document by eye is hard, that’s what an automated check is actually good at, and why NeverPrompted’s style scan flags the specific passages rather than asking you to spot them all yourself.',
      },
    ],
  },

  {
    slug: 'turnitin-ai-humaniser-guide',
    group: 'guide',
    title: 'The Honest Guide to Turnitin AI Humanisers',
    metaTitle: 'Turnitin AI Humaniser: The Honest Guide | NeverPrompted',
    metaDescription:
      'Two separate questions: does your writing register as AI to Turnitin, and is what you did actually permitted by your school’s policy. An AI humaniser tool only ever answers the first, honestly.',
    intro:
      'If you searched for a Turnitin AI humaniser, you’re probably hoping for something that makes AI-written text register as zero percent AI. That’s not something anyone can honestly promise, and it’s not actually the question you should be asking. There are two separate questions here: does the writing read as AI to a detector, and is what you did with AI actually allowed by your school’s policy. Getting the first one down to zero doesn’t answer the second.',
    sections: [
      {
        heading: 'Two different questions, not one',
        body: [
          'The first question is statistical: does this writing resemble the patterns Turnitin’s indicator, or any style-based tool, associates with AI-generated text. That’s answerable, at least as an estimate, with tools like Turnitin’s own indicator or NeverPrompted’s style check.',
          'The second question is a policy question, and no detector answers it at all: regardless of what a score says, did what you actually did, using AI to brainstorm, to draft, to edit, comply with what your institution’s academic integrity policy permits? Some policies allow AI for brainstorming but not drafting. Some require you to disclose any use. Some ban it outright. That’s a decision about honesty and process, not a percentage.',
          'A low or zero AI-likelihood score doesn’t touch the second question at all, and treating the two as the same thing is exactly how tools marketed as “humanisers” mislead people: they sell an answer to the first question as though it settles the second.',
        ],
      },
      {
        heading: 'What Turnitin’s indicator actually measures, and its limits',
        body: [
          'Turnitin’s AI indicator is a percentage estimate based on how closely a document’s style resembles patterns found in training examples of AI-generated text. Turnitin itself has published that this comes with real false-positive and false-negative rates, it’s a statistical estimate, not a certain read of who wrote something.',
          'Because it’s a resemblance-based classifier, running text through a paraphrasing or “humaniser” tool can shift the score, sometimes considerably, by changing surface style. But that’s a style change. It says nothing about whether the underlying thinking, research, or drafting was actually yours. A low score produced this way is not evidence that you did the work.',
        ],
      },
      {
        heading: 'What actually holds up',
        body: [
          'Genuine authorship is the thing that protects you, not a score in either direction: understanding what you wrote well enough to explain and defend every sentence, and disclosing AI use exactly as your policy requires, if it requires it at all.',
          'If you used AI for a first draft, the honest path is rewriting it properly in your own words and understanding first, then separately checking your institution’s stated policy on AI assistance and disclosing accordingly. Treat those as two genuinely separate steps, not one.',
          'No tool, including NeverPrompted’s, can promise a specific outcome against any detector, because these classifiers keep changing and none of them are testing a mark the writer controls. The only durable answer is writing, or genuinely rewriting, the work yourself and being straightforward about how you used AI along the way.',
        ],
      },
    ],
    faq: [
      {
        question: 'Will an AI humaniser tool promise I pass Turnitin?',
        answer:
          'No honest one can. Style tools can shift a resemblance-based score, sometimes considerably, but they can’t promise a specific result against a classifier that keeps changing. And even a passing score only ever answers the style question, not whether your process met your institution’s policy.',
      },
      {
        question: 'If my score comes back at zero percent AI, am I in the clear?',
        answer:
          'Not necessarily. That result only answers whether the writing statistically resembles known AI output. It says nothing about whether your process, disclosure included, met your institution’s actual policy, which is a separate requirement that a style score can’t satisfy on its own.',
      },
      {
        question: 'Can I use NeverPrompted to check my students’ papers for AI?',
        answer:
          'No. NeverPrompted checks and improves your own writing before you publish or submit it. Screening someone else’s submissions is a different job, with different obligations around consent and fairness, and that’s what the separate product Learnaway (learnaway.ai) is built for.',
      },
    ],
  },
]
