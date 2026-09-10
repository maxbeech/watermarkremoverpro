import type { FaqItem } from '@/components/faq'
import { LANGUAGE_NAMES, SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/detector/languages'

/**
 * The long-tail pages.
 *
 * One typed source feeding /for/*, /vs/*, /guide/* and /in/*. Kept as data
 * rather than as a directory of near-identical page components so that a change
 * to the disclaimer wording, the CTA or the structured data lands on every page
 * at once. The usual failure of a programmatic SEO set is twenty pages that
 * disagree about what the product does.
 *
 * The breadth axes here are audience x comparison x language. This product has
 * no geography axis: a provenance mark does not vary by city, and generating
 * "AI watermark detector in Leeds" pages would be manufacturing pages rather
 * than answering questions.
 */

export interface Section {
  heading: string
  body: string[]
}

export interface LongTailPage {
  slug: string
  group: 'for' | 'vs' | 'guide' | 'in'
  title: string
  metaTitle: string
  metaDescription: string
  intro: string
  sections: Section[]
  faq: FaqItem[]
}

// ---------------------------------------------------------------------------
// Audience pages
// ---------------------------------------------------------------------------

const AUDIENCES: LongTailPage[] = [
  {
    slug: 'university-students',
    group: 'for',
    title: 'For university students accused of using AI',
    metaTitle: 'Accused of using AI on an essay? Check it yourself first',
    metaDescription:
      'A student’s guide to checking your own coursework for a statistical AI provenance mark, understanding what a detector result does and does not prove, and preparing an academic-misconduct appeal.',
    intro:
      'Being told your essay “came back as AI” is frightening partly because the number you are shown usually arrives with no explanation and no way to interrogate it. Before you write anything to your department, it is worth knowing what a statistical test can and cannot establish about a document, including this one.',
    sections: [
      {
        heading: 'What the number your university showed you probably is',
        body: [
          'Most institutional tools report a percentage that sounds like “this much of the document is AI”. It almost never means that. These systems are classifiers trained to separate two corpora, and the figure is a model’s confidence, not a proportion of your text and not a probability that you personally used a model.',
          'That distinction matters enormously in an appeal, because a confidence score has a false positive rate, and a false positive rate applied across a whole cohort produces a predictable number of wrongly accused students every term. You may be one of them, and the arithmetic is on your side more than it feels.',
        ],
      },
      {
        heading: 'What WatermarkRemoverPro checks instead',
        body: [
          'WatermarkRemoverPro looks for a provenance mark: a deliberate statistical signature that some generation systems apply to their output so it can later be recognised. That is a different question from “does this read like AI”, and it has a cleaner answer, because a mark is either present in the statistics or it is not.',
          'The honest catch, which we state on every result: a mark of this kind is keyed, and no model vendor publishes its detection key. So a null result from us means “no mark found under the keys we hold”, never “you are cleared”. We would rather give you a narrow true statement you can defend than a broad one that collapses the moment someone knowledgeable reads it.',
        ],
      },
      {
        heading: 'Putting an appeal together',
        body: [
          'Ask the department three things in writing: which tool produced the figure, what that tool’s published false positive rate is, and what corroborating evidence exists beyond the score. Many academic misconduct policies already require more than a detector output, and asking politely for the policy tends to be more productive than arguing about the number.',
          'Bring your own process evidence: drafts, version history, notes, library loans, supervision emails. A document history is far more persuasive than any detector result in either direction.',
          'The WatermarkRemoverPro evidence report is designed to sit alongside that: it is dated, states its own limits in full on the page, lists the keys tested, and carries a SHA-256 hash of the exact file so it cannot be argued to be about a different draft.',
        ],
      },
    ],
    faq: [
      {
        question: 'Will a WatermarkRemoverPro report clear my name?',
        answer:
          'It cannot, and any tool promising that is misleading you. No absence of evidence proves authorship. What the report does is document what a specific, named statistical test found on your exact file, with its limits stated, so the conversation moves from an unexplained percentage to something both sides can examine.',
      },
      {
        question: 'Is my essay uploaded anywhere?',
        answer:
          'Not on the free check. The analysis runs in your browser, and you can open the network tab and watch. That matters here specifically: uploading an unsubmitted essay to a third party is itself something some departments take a dim view of.',
      },
      {
        question: 'I did use AI for some parts. What now?',
        answer:
          "WatermarkRemoverPro's rewrite feature is a final-pass editing tool for your own drafting, not a substitute for disclosure your institution requires. It cannot guarantee a document won't be flagged, and it doesn't change what happened to a document that already went through an assisted-writing process your institution's policy required you to disclose. If your institution permits assisted writing with disclosure, disclose it. If it does not, an honest conversation earlier is almost always treated better than a discovered concealment later.",
      },
    ],
  },
  {
    slug: 'freelance-writers',
    group: 'for',
    title: 'For freelance writers whose client ran a detector',
    metaTitle: 'Client says your copy failed an AI detector? Check it yourself',
    metaDescription:
      'Check your own drafts for a statistical AI provenance mark before a client dispute escalates, and get a dated evidence report you can attach to an invoice dispute.',
    intro:
      'A client running your copy through a detector and refusing to pay is a commercial problem wearing a technical costume. You cannot win it by arguing about the tool in the abstract; you win it with documentation.',
    sections: [
      {
        heading: 'Why detector disputes escalate so fast',
        body: [
          'The client sees a number they believe is objective. You know you wrote it. Neither of you has anything to examine, so the disagreement becomes about trust, and trust disputes end contracts.',
          'The way out is to introduce something checkable. A test that names its method, states its own limits and anchors itself to a specific file gives you both something to look at other than each other.',
        ],
      },
      {
        heading: 'What to send a client',
        body: [
          'Your drafting history first: document version history, commits, or the dated outline you worked from. This is the strongest evidence you have and it costs nothing.',
          'Then the evidence report, which states what was tested and, importantly, what the test cannot establish. Sending a document that admits its own limits reads as considerably more credible than one that claims to prove your innocence.',
          'Keep the tone procedural. You are not disputing that they ran a tool; you are asking what the tool’s false positive rate is and what the contract says about acceptance criteria.',
        ],
      },
      {
        heading: 'Getting ahead of it next time',
        body: [
          'Put an AI clause in the contract: what is permitted, what must be disclosed, and what evidence is acceptable if a dispute arises. Naming an agreed process before there is money at stake is far easier than negotiating one afterwards.',
          'If you check drafts routinely, the Pro tier’s batch upload and API let you run a whole delivery rather than a file at a time.',
        ],
      },
    ],
    faq: [
      {
        question: 'Can I check a batch of articles at once?',
        answer:
          'Yes, on Pro. Batch upload in the browser, or the JSON API and MCP server if you want it inside your own delivery pipeline. Each document gets its own result and its own hash.',
      },
      {
        question: 'Does a clean result mean the client has to pay?',
        answer:
          'That is a contract question, not a statistics question. What the report changes is the quality of the conversation: it replaces an unexplained score with a documented test whose limits are on the page.',
      },
    ],
  },
  {
    slug: 'journalists',
    group: 'for',
    title: 'For journalists and editors checking their own copy',
    metaTitle: 'Check your own filed copy for an AI provenance mark',
    metaDescription:
      'For reporters and editors who need to know whether filed copy carries a statistical AI provenance mark before publication, with the method and its limits stated in full.',
    intro:
      'Newsrooms increasingly need to say something definite about how a piece was produced, whether to a standards editor, to a legal team, or in a correction. Guessing is not an option and neither is an unexplained percentage.',
    sections: [
      {
        heading: 'The disclosure problem',
        body: [
          'The question a standards desk actually asks is narrow: was any part of this produced by a system that marks its output, and can we show what we checked? That is answerable. “Does this feel like AI” is not.',
          'WatermarkRemoverPro answers the narrow question and refuses the broad one. The result names the keys tested and states plainly that a null result under those keys is not a statement about marks applied with a key nobody outside the vendor holds.',
        ],
      },
      {
        heading: 'Why the per-passage breakdown is corrected',
        body: [
          'A 1,500-word piece contains dozens of passages. Testing each one separately and reporting whatever looks significant would light up two or three sentences of anybody’s writing, every time. That is what running many simultaneous tests does.',
          'We apply a false-discovery-rate correction across all passages before presenting any of them as a finding, and the report says how many were tested and how many survived. An uncorrected highlighter is a machine for generating false accusations inside your own newsroom.',
        ],
      },
      {
        heading: 'Source material and confidentiality',
        body: [
          'The free check runs entirely in the browser, so unpublished copy is not transmitted to us. For a newsroom that is often the deciding factor: the alternative is uploading an embargoed piece to a third-party service.',
          'If you use the API or the report endpoint, those necessarily run on our servers, and that is documented rather than buried, so you can make that decision knowingly.',
        ],
      },
    ],
    faq: [
      {
        question: 'Can we run this on our own infrastructure?',
        answer:
          'The engine is a single TypeScript module with no network calls, and the MCP server runs locally with no API key. If your organisation holds a detection key under an agreement, WATERMARKREMOVERPRO_DETECTION_KEYS lets a deployment test against it without any change to the engine.',
      },
      {
        question: 'Does it work on non-English copy?',
        answer:
          'English, Spanish, French, German and Portuguese have measured reference baselines. A language without one is reported as unsupported rather than analysed against a substitute baseline.',
      },
    ],
  },
  {
    slug: 'non-native-english-writers',
    group: 'for',
    title: 'For non-native English writers flagged by a detector',
    metaTitle: 'AI detectors flag non-native English writing more often: what to do',
    metaDescription:
      'Non-native English writing is disproportionately flagged by AI detectors. What that bias is, why it happens, and how to check your own work for an actual provenance mark instead.',
    intro:
      'If you write English as an additional language and a detector has flagged your work, you should know that this is a documented, studied pattern and not a coincidence about your particular essay.',
    sections: [
      {
        heading: 'The measured bias',
        body: [
          'Published research has repeatedly found that classifier-style AI detectors flag text by non-native English writers at substantially higher rates than text by native speakers, on writing that was entirely human in both cases.',
          'The mechanism is not mysterious. These detectors lean on fluency signals, meaning how predictable and how varied the wording is. Writing in an additional language tends to use a narrower, more standard vocabulary and more regular sentence construction, which is exactly what those detectors read as machine-like. The tool is measuring second-language writing and reporting it as AI.',
        ],
      },
      {
        heading: 'Why this product measures something different',
        body: [
          'A provenance mark is not a fluency judgement. It is a statistical signature deliberately placed in text at generation time, and it is either present or absent regardless of how idiomatic the writing is.',
          'WatermarkRemoverPro does also report a style measurement, and we are direct about what it is worth: it says how far your writing sits from a reference corpus of contemporary prose in that language. Non-native writing often sits some distance from it. That distance is not evidence of anything about how the document was produced, and the result says so in those words, on the page, so nobody can quote the number without the caveat.',
        ],
      },
      {
        heading: 'Check in your own language too',
        body: [
          'If you also wrote a version in your first language, check that. Baselines exist for English, Spanish, French, German and Portuguese, and the comparison is often clarifying for a panel that has assumed fluency and authorship are the same thing.',
        ],
      },
    ],
    faq: [
      {
        question: 'Should I make my writing sound less fluent to avoid detection?',
        answer:
          'No. Writing worse to satisfy an unreliable tool is a bad trade, and it is also the road toward the evasion services this product deliberately is not. The better move is to challenge the detector’s reliability, which is well documented, and to bring your drafting history.',
      },
      {
        question: 'Does WatermarkRemoverPro correct for the bias?',
        answer:
          'It avoids it rather than correcting for it. The provenance-mark test does not use fluency at all. The style measurement is reported as a distance from a reference, explicitly labelled as a statement about register rather than about provenance, and we do not turn it into a verdict, so there is no verdict to be biased.',
      },
    ],
  },
  {
    slug: 'grant-and-bid-writers',
    group: 'for',
    title: 'For grant and bid writers under AI disclosure rules',
    metaTitle: 'AI disclosure in grant and tender submissions: check before you file',
    metaDescription:
      'Funders and procurement bodies increasingly require AI-use disclosure. Check a submission for a statistical provenance mark before filing, and keep a dated record of what you checked.',
    intro:
      'Funders and procurement authorities have started attaching AI-use declarations to submissions. The risk is rarely deliberate concealment. It is a bid assembled from many contributors where nobody is certain what went through what.',
    sections: [
      {
        heading: 'The multi-author problem',
        body: [
          'A bid is stitched together from a subject lead’s notes, a partner’s boilerplate, last year’s successful submission and a compliance annex. Any of those may have passed through an assisted drafting tool without the bid manager knowing.',
          'Signing a declaration you cannot substantiate is the actual exposure. Checking before filing turns an unknown into either a clean record or a specific passage to ask a colleague about.',
        ],
      },
      {
        heading: 'Keeping a defensible record',
        body: [
          'The value of a dated report here is not that it proves the submission is human-written, because it cannot, and it says so. The value is that it evidences due diligence: on this date, this exact file, this test was run, these keys were tested, and this is what it found.',
          'Because the report carries a SHA-256 of the file, it is tied to the version you actually submitted rather than to a draft.',
        ],
      },
      {
        heading: 'Fitting it into a submission workflow',
        body: [
          'Pro batch upload handles a full annex set in one pass. If your bid pipeline is automated, the JSON API and MCP server let a check run as a pre-submission gate, so provenance is disclosed before handoff rather than discovered after.',
        ],
      },
    ],
    faq: [
      {
        question: 'Does a clean check satisfy a funder’s declaration?',
        answer:
          'That depends entirely on the funder’s wording, and you should read it rather than assume. Most declarations ask what you did, not what a tool concluded. A dated record of the check you ran supports a declaration; it does not replace one.',
      },
      {
        question: 'Can this run inside our submission pipeline?',
        answer:
          'Yes. The API is documented in OpenAPI and metered per 1,000 words, and the MCP server exposes the same capability to an agent assembling the submission.',
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Comparison pages
// ---------------------------------------------------------------------------

interface ComparisonSeed {
  slug: string
  competitor: string
  metaTitle: string
  whatItIs: string[]
  keyDifference: string[]
  /**
   * 'detector' (the default): an accuser-side classifier or provenance check,
   * the shape all three original comparisons target. 'humanizer': a rewrite/
   * paraphrase competitor, which needs different fixed template text since
   * "neither can prove who wrote a document" and "will X's classifier flag
   * me" don't apply to a tool that doesn't classify anything.
   */
  kind?: 'detector' | 'humanizer'
}

const COMPARISON_SEEDS: ComparisonSeed[] = [
  {
    slug: 'turnitin-ai-detector',
    competitor: 'Turnitin’s AI writing indicator',
    metaTitle: 'WatermarkRemoverPro vs Turnitin’s AI detector: they answer different questions',
    whatItIs: [
      'Turnitin’s AI writing indicator is an institutional product. It is bought by a university, run against work students submit, and reports a percentage to a marker. The student is the subject of the check, not its user, and generally cannot run it themselves or see how it reached its figure.',
      'It is a classifier: it was trained to separate human-written from machine-written text and outputs a confidence. That approach has a false positive rate, which is why institutions are advised not to treat the indicator as proof on its own.',
    ],
    keyDifference: [
      'WatermarkRemoverPro is the mirror image. You run it, on your own writing, and it is built around the question a person on the receiving end of an accusation actually has.',
      'It also measures a different thing. Turnitin’s indicator judges whether text reads as machine-generated. WatermarkRemoverPro tests for a provenance mark, a deliberate statistical signature placed at generation time, and reports the style measurement separately, explicitly labelled as a statement about register rather than provenance.',
      'WatermarkRemoverPro cannot tell you what Turnitin will say about your document, and does not claim to. Nothing outside Turnitin can, because their model is theirs.',
    ],
  },
  {
    slug: 'gptzero',
    competitor: 'GPTZero',
    metaTitle: 'WatermarkRemoverPro vs GPTZero: a provenance-mark test, not a classifier',
    whatItIs: [
      'GPTZero is a widely used AI-text classifier. You paste text and it returns a judgement about how likely it is to be machine-generated, based largely on perplexity and burstiness, meaning how predictable the wording is and how much sentence structure varies.',
      'It is available directly to individuals, which makes it the tool many accused writers reach for first.',
    ],
    keyDifference: [
      'Both are self-serve, so the difference is in what is being measured. A perplexity-based classifier asks whether writing looks predictable. That signal is real but it is also the signal that penalises clear, plain, well-edited prose, and second-language writing in particular.',
      'WatermarkRemoverPro’s primary channel does not use fluency at all: it is a keyed test for a green-list watermark, which is present or absent independently of how the writing reads.',
      'We are also explicit about a limit a classifier does not have to state: our test is keyed, and no vendor publishes its key, so we tell you exactly which keys were tested and that a null result applies only to those.',
    ],
  },
  {
    slug: 'originality-ai',
    competitor: 'Originality.ai',
    metaTitle: 'WatermarkRemoverPro vs Originality.ai: checking your own work vs screening others’',
    whatItIs: [
      'Originality.ai is aimed at publishers, agencies and content buyers who want to screen work submitted to them, typically alongside plagiarism checking. Its buyer is the commissioner, and its output is a score used to accept or reject a delivery.',
      'It offers an API, and much of its use is bulk screening of freelance output.',
    ],
    keyDifference: [
      'The audiences are opposite. Originality.ai exists to help a buyer evaluate a supplier. WatermarkRemoverPro exists to help the writer on the other side of that transaction understand and respond to the result.',
      'That shapes everything: WatermarkRemoverPro runs the free check in your browser so unpublished drafts are not uploaded, and produces a report designed to be handed to someone else rather than a score designed to gate a payment.',
      'If your job genuinely is screening other people’s work, WatermarkRemoverPro is the wrong tool and we say so on every page. Learnaway is built for that.',
    ],
  },
  {
    slug: 'ai-humanizer-tools',
    competitor: 'AI humanizer tools like QuillBot, Undetectable.ai and StealthGPT',
    metaTitle: 'WatermarkRemoverPro vs AI Humanizer Tools: On-Device, No "Undetectable" Claim',
    kind: 'humanizer',
    whatItIs: [
      'QuillBot, Undetectable.ai, StealthGPT and a large field of similar products rewrite text to reduce the patterns an AI detector keys on. Most run the rewrite on their own servers, meaning your document is uploaded to a third party to be processed, and most advertise a permanent, universal escape from every detector in their marketing copy.',
      'That marketing claim is not something the underlying method can support. A keyed statistical mark is designed so only the party holding the key can reliably test for it, so no outside tool, including this one, can honestly promise a specific outcome against a specific vendor\'s undisclosed watermark.',
    ],
    keyDifference: [
      'WatermarkRemoverPro\'s rewrite runs entirely on your device or in your own process, on every tier: nothing about the document is ever sent to a WatermarkRemoverPro-operated server, and there is no REST endpoint for it by design. Most humanizer tools are the opposite: a cloud service you paste your draft into.',
      'The claim is the other real difference. WatermarkRemoverPro states a reduction, not a guarantee: the same conservative language used everywhere else on this site. It also shows the before/after evidence delta using the same arithmetic its own detector uses, so the change is something you can verify rather than take on faith.',
      'The Standard engine is unlimited on every plan, because the computation runs on your device rather than metering server compute. The Pro engine is a real local model, free once a week for everyone and unlimited on a Pro subscription.',
    ],
  },
]

const COMPARISONS: LongTailPage[] = COMPARISON_SEEDS.map((seed) => {
  if (seed.kind === 'humanizer') {
    return {
      slug: seed.slug,
      group: 'vs' as const,
      title: `WatermarkRemoverPro vs ${seed.competitor}`,
      metaTitle: seed.metaTitle,
      metaDescription: `How WatermarkRemoverPro's on-device rewrite differs from ${seed.competitor}: no server upload, and a stated reduction in evidence rather than an "undetectable" promise.`,
      intro: `${seed.competitor} and WatermarkRemoverPro's own rewrite feature are the same category of tool, word-choice and style changes that reduce detectable AI-style evidence. What differs is where the processing happens and what claim is attached to the result.`,
      sections: [
        { heading: `What ${seed.competitor} typically offer`, body: seed.whatItIs },
        { heading: 'How WatermarkRemoverPro differs', body: seed.keyDifference },
        {
          heading: 'What neither of them can do',
          body: [
            `Neither WatermarkRemoverPro nor ${seed.competitor} can guarantee a result against a specific vendor's undisclosed watermark. A keyed statistical mark is designed so only the party holding the key can reliably test for it, so no outside tool can honestly promise otherwise, whatever a competitor's marketing page claims.`,
            'A rewrite that reduces measurable evidence is a real, falsifiable effect. A rewrite that is marketed as a permanent, universal escape from every detector is describing something outside what the underlying method supports.',
          ],
        },
      ],
      faq: [
        {
          question: `Is it safe to paste an unpublished draft into ${seed.competitor}?`,
          answer: `That depends on their privacy terms and where processing happens, which is worth checking directly on their site. WatermarkRemoverPro's rewrite runs entirely on your device or your own process, on every tier, so the question does not apply here: nothing about the document is ever sent to a WatermarkRemoverPro-operated server.`,
        },
        {
          question: 'Will either of these guarantee my writing is not flagged?',
          answer:
            'No, and treat any tool that claims that with suspicion. What a rewrite can do is measurably reduce detectable statistical patterns; whether a specific institution\'s specific process flags a document depends on things outside any rewrite tool\'s knowledge.',
        },
      ],
    }
  }

  return {
    slug: seed.slug,
    group: 'vs' as const,
    title: `WatermarkRemoverPro vs ${seed.competitor}`,
    metaTitle: seed.metaTitle,
    metaDescription: `How WatermarkRemoverPro differs from ${seed.competitor}: a keyed provenance-mark test you run on your own writing, versus a detector that judges whether text reads as machine-generated.`,
    intro: `These tools get compared constantly and they are not substitutes. ${seed.competitor} and WatermarkRemoverPro measure different things for different people, and the most useful thing this page can do is be precise about which.`,
    sections: [
      { heading: `What ${seed.competitor} is`, body: seed.whatItIs },
      { heading: 'How WatermarkRemoverPro differs', body: seed.keyDifference },
      {
        heading: 'What neither of them can do',
        body: [
          'Neither tool can prove who wrote a document. A detector reports a model’s confidence; a provenance-mark test reports whether a statistical signature is present. Both are evidence, and neither is authorship.',
          `Nor can either of them guarantee a result against an undisclosed watermark. ${seed.competitor} cannot guarantee its confidence score is right, and WatermarkRemoverPro's own on-device rewrite feature cannot guarantee defeating a model vendor's undisclosed watermark either, since nobody outside that vendor holds the key it was applied with.`,
        ],
      },
    ],
    faq: [
      {
        question: `Can WatermarkRemoverPro tell me what ${seed.competitor} will say about my document?`,
        answer: `No. ${seed.competitor}'s model is theirs, and nothing outside it can predict its output. WatermarkRemoverPro reports its own measurement and names its own method, which is a different and more defensible claim than guessing at somebody else's classifier.`,
      },
      {
        question: 'Which should I use if I have been accused?',
        answer:
          'If the accusation came from a classifier, understanding that tool’s false positive rate is usually more useful than running another classifier. WatermarkRemoverPro adds a different kind of evidence, a named and keyed test on your exact file with its limits stated and a hash anchoring it, plus a document you can actually submit.',
      },
    ],
  }
})

// ---------------------------------------------------------------------------
// Guides
// ---------------------------------------------------------------------------

const GUIDES: LongTailPage[] = [
  {
    slug: 'ai-detection-false-positive',
    group: 'guide',
    title: 'AI detection false positives: what they are and what to do',
    metaTitle: 'AI detector false positive: why it happens and how to respond',
    metaDescription:
      'Why AI detectors flag human writing, which kinds of writing get flagged most, and a practical sequence for responding to a false positive.',
    intro:
      'A false positive is a detector reporting AI involvement in text a person wrote. They are not rare edge cases; they are a predictable output of how these tools work, and understanding the mechanism is the fastest route to a sensible response.',
    sections: [
      {
        heading: 'Why they happen',
        body: [
          'Most detectors are classifiers scoring predictability. Text where each word follows naturally from the last scores as machine-like, because that is what fluent generation looks like.',
          'Unfortunately that is also what good editing looks like. Clear, plain, heavily revised prose converges on the same statistical territory, so the writers most likely to be flagged include careful editors, technical writers working to a house style, and people writing in an additional language.',
          'Base rates make it worse. Even a detector that is accurate most of the time, run across thousands of submissions of which few are actually AI-written, produces a large number of wrong flags relative to right ones. This is ordinary conditional probability, and it is the single most useful thing to explain to a panel.',
        ],
      },
      {
        heading: 'What to do, in order',
        body: [
          'Ask which tool produced the figure and what its published false positive rate is. Ask what the institution’s policy says a detector score is sufficient to establish. Very often, on its own, nothing.',
          'Assemble process evidence: drafts, version history, notes, search history, supervision correspondence. This is more persuasive than any detector output in either direction.',
          'Run a different kind of test. A provenance-mark check asks whether a deliberate statistical signature is present, rather than whether the writing reads a certain way, so it is not vulnerable to the same failure mode.',
          'Keep it procedural in tone. You are not accusing anyone of bad faith; you are asking what the evidence is and what the policy requires.',
        ],
      },
      {
        heading: 'What not to do',
        body: [
          'Do not rewrite the document to score better. It concedes the premise, it destroys the version the accusation was about, and tools that promise to do it for you are evasion services with a marketing department.',
          'Do not rely on a single clean result as proof. Absence of a mark is not proof of human authorship, and claiming otherwise hands the other side an easy correction.',
        ],
      },
    ],
    faq: [
      {
        question: 'How common are false positives?',
        answer:
          'Rates vary by tool and by text, and vendors publish very different figures from independent evaluations. The pattern that reproduces most consistently in published work is elevated false positive rates for non-native English writing.',
      },
      {
        question: 'Can I appeal on statistical grounds alone?',
        answer:
          'Sometimes, though it lands better combined with process evidence. The strongest version asks the institution to state what its own policy requires beyond a score, since most policies already require corroboration.',
      },
    ],
  },
  {
    slug: 'claude-ai-watermark',
    group: 'guide',
    title: 'The Claude AI watermark: what a provenance mark is',
    metaTitle: 'Claude AI watermark: what a provenance mark is and what it proves',
    metaDescription:
      'What a statistical AI provenance mark is, how green-list watermarking works, why detection needs a key, and what a mark does and does not prove about authorship.',
    intro:
      'Model vendors have begun applying statistical provenance marks to generated text, driven partly by transparency obligations such as Article 50 of the EU AI Act. This page explains what such a mark actually is, in enough detail to reason about what finding one would mean.',
    sections: [
      {
        heading: 'How green-list watermarking works',
        body: [
          'The best-documented scheme comes from Kirchenbauer et al. (2023). Before generating each token, the model uses a keyed pseudorandom function, seeded by the preceding token, to split its vocabulary into a “green” list and a “red” list. Generation is then nudged toward green tokens.',
          'The nudge is small enough that the output still reads naturally, but across hundreds of tokens the excess of green choices becomes statistically obvious. Detection is a one-proportion z test: count the green tokens, compare to what chance would give, and read off how unlikely the excess is.',
          'The elegance is that the mark lives in the choice between near-equivalent words, so it survives light editing and does not degrade quality, and it is invisible without the key.',
        ],
      },
      {
        heading: 'Why the key is the whole story',
        body: [
          'The partition is determined by a secret. Without it, you cannot tell which words were green, so you cannot count them, so there is no test to run. This is a deliberate property, not an oversight, because a publicly checkable mark would be a publicly removable one.',
          'The practical consequence is that no third-party tool, including this one, can detect a specific vendor’s mark unless that vendor publishes a detection key or grants access to one. Any tool claiming to detect “the Claude watermark” without a key is not doing what it says.',
          'WatermarkRemoverPro therefore tests the keys it holds and names them on every result. It ships a published open reference key so the machinery is auditable, and you can mark text under it yourself on our verify page and watch the detector find it, and it accepts vendor or institution keys through configuration.',
        ],
      },
      {
        heading: 'What a mark would and would not prove',
        body: [
          'A detected mark is evidence that text carrying that key’s signature is present. It is not proof of authorship: text can be quoted, translated, edited, or produced collaboratively, and a mark travels with the words regardless of how they got into the document.',
          'An absent mark proves even less. Marks are not applied by every system, they weaken under paraphrase and translation, and they are undetectable without the key. Absence is consistent with a great many histories, only one of which is “a person wrote every word”.',
        ],
      },
    ],
    faq: [
      {
        question: 'Can WatermarkRemoverPro detect the Claude mark specifically?',
        answer:
          'Not unless a detection key for it is available to the deployment, and no vendor publishes one. We say this rather than implying otherwise: the result lists exactly which keys were tested, and the engine will test a vendor key the moment one exists, without any change to the method.',
      },
      {
        question: 'Does editing remove a watermark?',
        answer:
          'It weakens it. Each edited word is one fewer scored position, so heavy paraphrase degrades the signal, which is precisely why an absent mark cannot be read as proof of human authorship. We do not offer editing to that end and will not.',
      },
      {
        question: 'Is this the same as an image watermark?',
        answer:
          'No. Visible or metadata image watermarks are attached to a file. A text provenance mark is embedded in the choice of words themselves, so it survives copying and reformatting, and cannot be stripped by removing a header.',
      },
    ],
  },
  {
    slug: 'prove-you-wrote-it',
    group: 'guide',
    title: 'How to prove you wrote something yourself',
    metaTitle: 'How to prove you wrote it: evidence that actually works',
    metaDescription:
      'What evidence actually establishes authorship when you are accused of using AI, in order of persuasiveness, and where a provenance-mark check fits.',
    intro:
      'The uncomfortable truth is that no test proves authorship. What exists is a set of evidence types with very different strengths, and most people reach for the weakest one first.',
    sections: [
      {
        heading: 'Process evidence is the strongest thing you have',
        body: [
          'Version history is close to unfakeable after the fact. A document with hundreds of incremental revisions, spread over days, with false starts and reorganisations, describes a process no one reconstructs retrospectively.',
          'Google Docs and Word both keep version history; git keeps commits; even dated email drafts to yourself help. If you are reading this before an accusation, the single most valuable habit is drafting somewhere that keeps history.',
          'Adjacent traces corroborate: library records, browser history, notes, reading lists, supervision emails, the outline you sent a colleague.',
        ],
      },
      {
        heading: 'Knowledge evidence',
        body: [
          'Being able to discuss the work, including why a source was chosen, what an argument was going to be before it changed and what was cut, is persuasive in a way a document cannot be. Many institutions resolve these cases with a conversation for exactly that reason.',
        ],
      },
      {
        heading: 'Where a provenance-mark check fits',
        body: [
          'It is corroborating evidence, not proof, and it is worth being clear-eyed about its weight. A documented test on your exact file, with its limits stated and a hash anchoring it, is a reasonable thing to attach to an appeal. It is not the appeal.',
          'What it does well is shift the conversation from an unexplained percentage to a named method both sides can examine. That change of footing is often worth more than the number itself.',
        ],
      },
    ],
    faq: [
      {
        question: 'What if I drafted in a plain text editor with no history?',
        answer:
          'Then lean on knowledge evidence and on the reliability of whatever flagged you. Going forward, draft somewhere with version history, which costs nothing and is the best insurance available.',
      },
      {
        question: 'Is a WatermarkRemoverPro report enough on its own?',
        answer:
          'No, and the report says so in its own stated limits. It documents what one specific test found on one specific file. Use it alongside process evidence, not instead of it.',
      },
    ],
  },
  {
    slug: 'eu-ai-act-article-50',
    group: 'guide',
    title: 'EU AI Act Article 50 and machine-readable AI marking',
    metaTitle: 'EU AI Act Article 50: AI content marking obligations explained',
    metaDescription:
      'What Article 50 of the EU AI Act requires for marking AI-generated content, why providers are adding statistical provenance marks, and what it means for people whose writing is checked.',
    intro:
      'Article 50 of the EU AI Act sets transparency obligations for AI systems that generate content. It is the main reason statistical provenance marks moved from research papers into shipped products.',
    sections: [
      {
        heading: 'What the obligation is',
        body: [
          'In broad terms, providers of generative AI systems must ensure their outputs are marked in a machine-readable format and detectable as artificially generated or manipulated, with the marking expected to be effective, interoperable, robust and reliable as far as technically feasible.',
          'For text this is harder than for images. There is no file header to write to, since text is copied, retyped and reformatted constantly, so the marking has to live in the words themselves. That is what pushes providers toward statistical watermarking.',
          'This page is an explanation, not legal advice. If a compliance obligation attaches to you, read the text and take advice on it.',
        ],
      },
      {
        heading: 'What it means in practice for writers',
        body: [
          'More generated text will carry a mark, which cuts both ways. It makes AI use more discoverable, and it also makes it possible for a writer to demonstrate that a specific document does not carry a specific mark.',
          'It does not make detection universal. Marks remain keyed, open models can be run without marking, and paraphrase degrades the signal. A world with marking obligations is not a world where every accusation can be settled by a test.',
        ],
      },
      {
        heading: 'Why a tool sold as reliably defeating the mechanism is a compliance problem',
        body: [
          'Once marking is a legal transparency mechanism, a tool marketed as reliably stripping it is marketed as defeating that mechanism, which is a different thing from a writer editing their own text. Article 50 obligates the provider of a generative system, not someone editing a document they wrote.',
          'WatermarkRemoverPro draws that line by what it claims, not by refusing to offer editing: the on-device rewrite reduces detectable evidence in your own writing and says exactly that, never "undetectable" and never a promised outcome against a watermark it holds no key for. See /rewrite and docs/REWRITE_PHILOSOPHY.md for the exact claim and its limit.',
        ],
      },
    ],
    faq: [
      {
        question: 'Does Article 50 mean my writing will be watermarked?',
        answer:
          'It applies to providers of generative systems, not to you. Text you write yourself carries no mark. Text produced by a covered system may carry one, and it travels with the words if they end up in your document.',
      },
      {
        question: 'Will WatermarkRemoverPro detect marks required by the Act?',
        answer:
          'Only where a detection key is available to the deployment. Machine-readable does not mean publicly readable, and the Act does not oblige providers to hand detection keys to third parties. We test the keys we hold and name them.',
      },
    ],
  },
  {
    slug: 'does-editing-remove-a-watermark',
    group: 'guide',
    title: 'Does editing remove a watermark?',
    metaTitle: 'Does editing or paraphrasing remove an AI watermark?',
    metaDescription:
      'How editing, paraphrasing and translation affect a statistical AI provenance mark, and why a weakened signal cuts against over-reading any detector result.',
    intro:
      'This question gets asked with two very different intentions, and it has one honest answer that serves the legitimate version and not the other.',
    sections: [
      {
        heading: 'The mechanism',
        body: [
          'A green-list mark lives in a large number of small choices between near-equivalent words. The statistic is an excess of “green” choices across the whole document, so the signal is spread thin and redundant rather than concentrated anywhere removable.',
          'Editing replaces some of those choices with your own. Each replaced word is one fewer scored position, so the excess shrinks. Light copy-editing typically leaves a strong signal intact; heavy rewriting degrades it; translation into another language effectively destroys it, since the word choices are entirely different ones.',
        ],
      },
      {
        heading: 'Why this matters for reading a result',
        body: [
          'This is the technical reason an absent mark cannot be treated as proof of human authorship, and it is worth stating in an appeal. Substantially edited generated text can test clean. So can text from a system that never applied a mark. So can text a person wrote.',
          'Those three histories are indistinguishable to the test, which is exactly why WatermarkRemoverPro reports what it measured rather than issuing a verdict.',
        ],
      },
      {
        heading: 'What editing can and cannot promise',
        body: [
          'WatermarkRemoverPro does now offer an on-device rewrite feature (see /rewrite), and it is bound by the same physics this page describes: it can reduce detectable evidence, and it cannot fabricate certainty about a watermark it has no key for. No tool, including this one, can honestly guarantee defeating a specific vendor\'s undisclosed watermark.',
          'If you edited generated text and want to know whether a signal remains, that is a diagnostic question and this tool answers it, directly and for free, with no account required.',
        ],
      },
    ],
    faq: [
      {
        question: 'How much editing weakens a mark?',
        answer:
          'It depends on document length and how much of the wording changes; the statistic degrades with the proportion of scored positions replaced rather than at a clean threshold. We do not publish a recipe, because a recipe is the evasion guide we decline to write.',
      },
      {
        question: 'Does translation remove it?',
        answer:
          'Effectively, yes. A translation is a different set of word choices, so a mark applied in the source language does not survive into the target. This is a known limitation of text watermarking, not a trick.',
      },
    ],
  },
  {
    slug: 'ai-humanizer-how-it-actually-works',
    group: 'guide',
    title: 'What an "AI humanizer" actually does, and cannot promise',
    metaTitle: 'AI Humanizer Tools: What They Actually Do (No "Undetectable" Claim)',
    metaDescription:
      'How AI humanizer and paraphrasing tools actually work, why "your output will always slip past every detector" is not a claim anyone can honestly make, and what an on-device rewrite can and cannot deliver instead.',
    intro:
      'Most pages selling an AI humanizer promise a permanent escape from detection. That promise is not something any tool, including this one, can honestly make. Here is what these tools actually do, and what WatermarkRemoverPro offers instead.',
    sections: [
      {
        heading: 'What "humanizing" text actually changes',
        body: [
          'A humanizer rewrites word choice, sentence rhythm and punctuation habits (the em dash used as a clause connector, stock phrases like "delve into" or "moreover") that occur more often in generated text than in ordinary prose, and that also happen to sit inside a statistical watermark\'s scored positions. Changing enough of them measurably reduces the evidence a detector or a watermark test finds.',
          'That is a real, falsifiable effect: you can measure a before-and-after delta with the same arithmetic a detector uses. What it is not is a certainty. A vendor\'s own watermark key is not published anywhere, so no outside tool can confirm it has fully cleared a specific detector\'s specific test.',
        ],
      },
      {
        heading: 'Why the "always passes" promise does not hold up',
        body: [
          'A keyed statistical mark is designed so that only the party holding the key can reliably test for it. That is the entire point of a keyed test, in the same way a locked door does not care how confidently a locksmith\'s advert reads. Anyone advertising a permanent, universal escape from every detector is describing something outside what the underlying method can support, not a feature they have built.',
          'The honest version of this claim is a reduction, not an erasure: fewer of the statistical patterns a detector keys on, measured against the same detector arithmetic doing the checking. That is what "reduce detectable evidence" means on this site, and it is the strongest claim the underlying method supports.',
        ],
      },
      {
        heading: 'What WatermarkRemoverPro\'s rewrite actually does',
        body: [
          'Two mechanisms, run together, entirely on your device: a deterministic pass over AI-tell punctuation and phrasing, and targeted candidate rewrites of the specific passages a real per-passage check flags, gated so a candidate that changes a number, a name or a negation is rejected outright rather than used. See /rewrite.',
          'The Standard engine is unlimited on every plan, because the computation runs on your device rather than metering server compute. The Pro engine adds a real local language model, more candidates per passage and the extended AI-tell library; everyone gets a free run of it each week, and a Pro subscription removes that limit. Nothing about the document is ever sent anywhere, on any tier: see docs/REWRITE_PHILOSOPHY.md for exactly what is and is not claimed.',
        ],
      },
    ],
    faq: [
      {
        question: 'Is an "AI humanizer" the same thing as WatermarkRemoverPro\'s rewrite tool?',
        answer:
          'The mechanism (word-choice and style changes that reduce detectable statistical patterns) is the same category of technique. The difference is the claim attached to it: WatermarkRemoverPro states the reduction, not an outcome it cannot verify, and processes everything on-device rather than on a server.',
      },
      {
        question: 'Will this stop my writing from ever being flagged?',
        answer:
          'No tool can promise that, and treat any that does with suspicion. What this reduces is measurable statistical evidence; whether a specific institution\'s specific process flags a document depends on things outside any rewrite tool\'s knowledge, including detectors this product has never tested against.',
      },
    ],
  },
  {
    slug: 'does-an-ai-humanizer-help-with-turnitin',
    group: 'guide',
    title: 'Does an "AI humanizer" help with Turnitin?',
    metaTitle: 'AI Humanizer and Turnitin: What Actually Changes, Honestly',
    metaDescription:
      'What an AI humanizer or rewrite tool actually changes about a Turnitin AI-writing score, why that is not the same question as academic-integrity compliance, and where WatermarkRemoverPro draws the line.',
    intro:
      'This question gets asked with two different situations behind it, and they deserve two different answers. One is a student worried their own honestly-written work will be misread as AI. The other is asking how to make AI-generated coursework pass a check it was written to fail. This page answers the first and is explicit about why it will not help with the second.',
    sections: [
      {
        heading: 'What Turnitin\'s AI indicator actually measures',
        body: [
          'Turnitin\'s AI writing indicator is a classifier: it was trained to separate human-written from machine-written text and reports a confidence score, not a deliberate statistical mark placed at generation time. See /vs/turnitin-ai-detector for the fuller comparison.',
          'A rewrite tool that changes word choice, sentence rhythm and punctuation habits can measurably shift the statistical patterns a classifier keys on. That is a real, falsifiable effect. It is also not something any tool, WatermarkRemoverPro included, can turn into a guaranteed outcome against a specific institution\'s specific classifier, which is trained on its own data and never disclosed in detail.',
        ],
      },
      {
        heading: 'Why this is not the same question as academic integrity',
        body: [
          'Reducing detectable evidence and being allowed to submit the work are separate questions, and only one of them is answerable by a rewrite tool. If AI-generated content was used somewhere your institution\'s policy required disclosure or prohibited it outright, running it through a humanizer changes whether a specific tool flags it; it does not change what happened, and it does not make an undisclosed use compliant.',
          'WatermarkRemoverPro\'s rewrite is built and described as a final-pass editing tool for writing you produced yourself, the same framing used throughout /for/university-students. It is not marketed, and should not be used, as a way to make disclosure-worthy AI use invisible.',
        ],
      },
      {
        heading: 'The legitimate use this page is actually for',
        body: [
          'Second-language phrasing, an unusually formal register, or just an editing pass that happens to read as "smooth" can trigger a classifier\'s false positives on writing a person genuinely wrote themselves. That is the well-documented failure mode /guide/ai-detection-false-positive covers, and it is where a rewrite of your own honest draft is a reasonable, defensible thing to do before submitting.',
          'If that is your situation: check first (/check, free, no account, nothing uploaded), see what is actually flagged, and use /rewrite\'s "preserve" strength, which only touches passages a real check would flag, rather than rewriting the whole document.',
        ],
      },
    ],
    faq: [
      {
        question: 'Will this guarantee Turnitin doesn\'t flag my work?',
        answer:
          'No, and treat any tool that promises that with suspicion. Turnitin\'s classifier is not published, so no outside tool can guarantee a specific score against it. What a rewrite can do is measurably reduce the statistical patterns classifiers generally key on.',
      },
      {
        question: 'I used AI for parts of this and need it to pass. Can this help?',
        answer:
          'This tool will not help you conceal an undisclosed use your institution\'s policy prohibits, and using it that way does not make the underlying use compliant. If assisted writing is permitted with disclosure, disclose it; see /for/university-students for the honest version of this answer.',
      },
    ],
  },
  {
    slug: 'what-a-confidence-band-means',
    group: 'guide',
    title: 'What a confidence band means on a detector result',
    metaTitle: 'Confidence bands, z scores and p values on AI detection results',
    metaDescription:
      'How to read a z score, a p value and a confidence interval on a provenance-mark check, and why a single percentage with no band is a warning sign.',
    intro:
      'WatermarkRemoverPro reports bands rather than single numbers, which is less punchy and considerably more honest. Here is how to read what it gives you.',
    sections: [
      {
        heading: 'The green-list rate and its interval',
        body: [
          'The headline figure is the proportion of scored word pairs that fell in the green list. Under no watermark, that proportion should sit near the key’s expected fraction, typically half.',
          'The interval beside it is a Wilson score interval: the range of true rates consistent with what was observed, given how many pairs were scored. A short document produces a wide interval because a short document genuinely carries less information. Reporting the point estimate alone would hide exactly that.',
        ],
      },
      {
        heading: 'z and p',
        body: [
          'The z score expresses how far the observed count sits from what chance would produce, in standard deviations. Roughly: 2 is unremarkable, 4 is notable, above 6 is very hard to explain by chance.',
          'The p value converts that into a probability: how often chance alone would produce a green count at least this extreme. It is not the probability that AI wrote the document. That is a different quantity and this test does not compute it.',
        ],
      },
      {
        heading: 'Why per-passage results are corrected',
        body: [
          'Each passage gets its own test, so a long document runs dozens at once and some will look significant by luck. WatermarkRemoverPro applies a Benjamini-Hochberg false-discovery-rate correction across all passages and reports how many were tested and how many survived.',
          'A per-passage highlighter without that correction will confidently colour in sentences of any document you give it. If a tool shows you highlighted passages without saying how many tests it ran, that is the question to ask.',
        ],
      },
    ],
    faq: [
      {
        question: 'Why not just show one percentage?',
        answer:
          'Because one percentage with no band conceals how much evidence it rests on, and a 200-word check and a 5,000-word check would look identical while meaning very different things. A bare score is the format that makes over-reading easiest.',
      },
      {
        question: 'What p value counts as a detection?',
        answer:
          'WatermarkRemoverPro treats p below 0.01 as a detection for the headline statement, and shows you the underlying figures regardless so you can apply your own threshold.',
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Language pages
// ---------------------------------------------------------------------------

const LANGUAGE_NOTES: Record<LanguageCode, string> = {
  en: 'English has the largest reference corpus of the five, and is the language most institutional detectors were built and evaluated on.',
  es: 'Spanish writing checked against a Spanish reference rather than an English one, because comparing Spanish prose to an English baseline produces deviations that are artefacts of the mismatch.',
  fr: 'French writing checked against a French reference, including the elision and clitic patterns that a token-level English baseline handles badly.',
  de: 'German writing checked against a German reference, where compounding and verb-final clauses make sentence-length and vocabulary statistics differ substantially from English.',
  pt: 'Portuguese writing checked against a Portuguese reference rather than being folded in with Spanish, which is a common and consequential shortcut in multilingual tooling.',
}

const LANGUAGES: LongTailPage[] = SUPPORTED_LANGUAGES.map((code) => ({
  slug: LANGUAGE_NAMES[code].toLowerCase(),
  group: 'in' as const,
  title: `Check ${LANGUAGE_NAMES[code]} writing for an AI provenance mark`,
  metaTitle: `${LANGUAGE_NAMES[code]} AI watermark check, on your device`,
  metaDescription: `Check ${LANGUAGE_NAMES[code]} writing for a statistical AI provenance mark, with a reference baseline measured from real ${LANGUAGE_NAMES[code]} prose. Runs in your browser.`,
  intro: `WatermarkRemoverPro supports ${LANGUAGE_NAMES[code]} with its own measured reference baseline. ${LANGUAGE_NOTES[code]}`,
  sections: [
    {
      heading: 'Why a per-language baseline matters',
      body: [
        'The provenance-mark test itself is language-independent, since it counts word pairs against a keyed partition, and that arithmetic does not care what language the words are in.',
        'The style measurement is a different matter. It compares your document to a reference corpus, so the reference has to be in the same language or the comparison is meaningless. Every deviation would simply be measuring the language difference.',
        `WatermarkRemoverPro measured its ${LANGUAGE_NAMES[code]} baseline from contemporary ${LANGUAGE_NAMES[code]} prose, and every document in that corpus was verified to be ${LANGUAGE_NAMES[code]} by the engine's own language identifier before it was included.`,
      ],
    },
    {
      heading: 'If the language cannot be determined',
      body: [
        'When the engine cannot confidently identify a document’s language it stops and asks, rather than picking the closest match. Analysing against the wrong baseline produces a real-looking number that means nothing at all, and a real-looking meaningless number is worse than no number.',
        'You can also set the language explicitly before running the check.',
      ],
    },
  ],
  faq: [
    {
      question: `Is the check less accurate in ${LANGUAGE_NAMES[code]} than in English?`,
      answer:
        'The provenance-mark test behaves the same in every language, since it does not use a language model. The style measurement is as good as its corpus, and the English corpus is currently the largest. Each result reports the size and retrieval date of the corpus it was measured against, so you can judge it yourself.',
    },
    {
      question: 'What about languages that are not supported?',
      answer:
        'They are reported as unsupported rather than analysed against a substitute baseline. Adding a language means measuring a real corpus for it, not adding a name to a list.',
    },
  ],
}))

// ---------------------------------------------------------------------------

export const LONG_TAIL_PAGES: LongTailPage[] = [...AUDIENCES, ...COMPARISONS, ...GUIDES, ...LANGUAGES]

export const pagesInGroup = (group: LongTailPage['group']): LongTailPage[] =>
  LONG_TAIL_PAGES.filter((p) => p.group === group)

export const findPage = (group: LongTailPage['group'], slug: string): LongTailPage | undefined =>
  LONG_TAIL_PAGES.find((p) => p.group === group && p.slug === slug)
