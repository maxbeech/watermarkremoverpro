import type { BlogPost } from './blog-types'

export const BLOG_POSTS_B: BlogPost[] = [
  {
    slug: '5-things-ai-detector-report-should-tell-you',
    title: '5 Things an AI Detector Report Should Tell You',
    h1: '5 Things an AI Detector Report Should Tell You',
    metaDescription: 'What separates a trustworthy AI detector report from a bare score? Five things to check before you decide whether to trust or fear any result.',
    category: 'Reviews',
    format: 'listicle',
    intent: 'commercial',
    publishedAt: '2026-08-08',
    author: 'MarkWitness Content Team',
    primaryKeyword: 'ai detection false positive',
    supportingKeywords: [
      'AI detector report',
      'false positive rate',
      'confidence interval AI detection',
      'AI detection evidence report',
      'per-passage AI detection',
      'document hash AI detection',
      'AI detection limitations',
      'trustworthy AI detector',
    ],
    longTailKeywords: [
      'what should an AI detection report include',
      'how to read an AI detector confidence score',
      'AI detector report false positive rate disclosure',
    ],
    heroImage: {
      src: 'https://images.unsplash.com/photo-1743796055664-3473eedab36e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600',
      alt: 'A magnifying glass held over a printed report, illustrating how to scrutinise an AI detection false positive report',
      unsplashId: 'P_5mirRrg0k',
    },
    intro: [
      'A lot of AI detector reports are just one number. A percentage, a verdict, a colour. That is not enough when a grade, a job or a client contract rides on the outcome.',
      'A trustworthy report lets you check its own working, not just read its conclusion.',
      'Here are five things worth looking for before you trust any AI detection false positive result, with MarkWitness\'s own evidence report serving as one honest example of what "good" can look like.',
    ],
    takeaways: [
      'A single percentage score tells you almost nothing about how reliable it is.',
      'Look for a confidence band around the result, not just a headline figure.',
      'A trustworthy report states its own false positive rate, with a source behind it.',
      'Whole-document scores hide passage-level nuance, so ask for a breakdown.',
      'Stated limits matter as much as the result itself.',
      'A document hash proves the report matches the exact file you checked.',
    ],
    sections: [
      {
        id: 'why-a-bare-score-isnt-enough',
        heading: 'Why a bare score isn\'t enough',
        body: [
          'Paste a paragraph into most free detectors and you get a single figure back. Eighty-seven per cent AI. Twelve per cent human. It looks precise, but precision is not the same thing as reliability.',
          'An AI detection false positive does not announce itself. It looks exactly like every other result: a number sitting on a page. Without more context around that number, you cannot tell whether it is solid ground or a coin toss dressed up in decimal points.',
        ],
      },
      {
        id: 'one-a-confidence-band-not-a-bare-score',
        heading: '1. A confidence band, not a bare score',
        body: [
          'Every statistical test carries uncertainty. A responsible report shows that uncertainty rather than hiding it behind a tidy percentage.',
          'MarkWitness\'s own check runs a keyed z-test over distinct bigrams, the same family of method behind Kirchenbauer et al.\'s original watermarking research, and reports a signal strength alongside a confidence band, never just a flat verdict.',
          'If a tool only ever hands you one number with no range either side of it, treat that as a gap worth asking about, not reassurance.',
          'Picture two reports on the same 800-word passage. A weak one simply says "87% AI" and stops there, giving you no way to judge whether 87% is a strong, well-supported signal or a coin toss dressed up in decimal points. A stronger one says something closer to "signal strength z=18.2, tested against the keyed reference for this document\'s language, confidence band stated alongside the result." The second version tells you not just the direction of the finding but how much weight it can actually bear, and gives you something concrete to question if the number still looks wrong.',
        ],
      },
      {
        id: 'two-a-stated-false-positive-rate-with-its-source',
        heading: '2. A stated false positive rate, with its source',
        body: [
          'Ask the tool a simple question: how often are you wrong, and how do you know? A trustworthy provider publishes this, ideally alongside the study behind it.',
          'Turnitin, for instance, states a document-level false positive rate under one per cent for documents containing over 20% AI writing, tested against an 800,000-document set, but a sentence-level rate closer to 4%, concentrated at the boundary between human and AI text. Those are two very different claims. A report worth trusting tells you which one applies to your result.',
          'Take a worked case: a 3,000-word essay where one sentence out of ninety trips a detector. A weak report stops at a single whole-document verdict, "AI-generated", with no context for that one flagged sentence. A strong report states plainly that the flag happened at the sentence level, notes that sentence-level false positive rates run higher than document-level ones, roughly 4% against under 1% in Turnitin\'s own published figures, and lets the reader judge for themselves whether one flagged sentence in ninety looks like a genuine issue or the kind of statistical noise you would expect at that finer level of granularity.',
        ],
      },
      {
        id: 'three-per-passage-attribution',
        heading: '3. Per-passage attribution, not one whole-document number',
        body: [
          'A single flagged sentence in paragraph four should not sink an entire essay\'s verdict, and a whole-document score cannot show you where the questionable passage actually sits.',
          'A report worth trusting breaks the text down passage by passage, so you, or whoever is reading it after you, can see exactly which section triggered a result and which did not.',
        ],
      },
      {
        id: 'four-explicit-stated-limits',
        heading: '4. Explicit stated limits: what this does NOT prove',
        body: [
          'This is the line most reports skip, because it is less flattering to the product selling the result. It is arguably the most important line on the page.',
          'MarkWitness states its limits plainly on the /limits page: a detected mark is not proof of authorship, because marks can turn up in quoted, translated, edited or assisted text. And an absent mark is not proof of human authorship either, since no model vendor publishes its detection key, marks survive heavy editing poorly, and "no mark detected" only ever means "under the keys we hold".',
          'A report that will not say what it cannot prove is asking for more trust than the statistics behind it actually support.',
        ],
      },
      {
        id: 'five-a-hash-tying-the-report-to-the-exact-file',
        heading: '5. A hash or fingerprint tying the report to the exact file',
        body: [
          'If a report cannot prove which document it was run against, it is not much use as evidence in a dispute. A SHA-256 hash of the checked document, printed on the report itself, closes that gap.',
          'It means anyone reading the PDF later can confirm it matches the exact file in question: not a similar one, not an earlier draft, but the actual document that was submitted or sent.',
        ],
      },
      {
        id: 'what-good-looks-like-in-practice',
        heading: 'What good looks like in practice',
        body: [
          'No single competitor ticks every one of these boxes on its marketing page, and it is worth saying that plainly rather than pretending otherwise. Turnitin publishes solid false positive research. GPTZero states a headline accuracy figure and adds the caveat that no detector is 100% accurate. Originality.ai points to third-party studies without printing a false positive percentage on the same page.',
          'MarkWitness\'s evidence report, available on the Pro plan at £19 a month, was built around all five points at once: a confidence band, a per-passage breakdown, the keys tested, the stated method limits, and a SHA-256 hash of the document, dated and exportable as a PDF. The free Check page gives you the headline result; the evidence report is for when you need to show your working to someone else.',
        ],
      },
    ],
    table: {
      caption: 'What a trustworthy AI detection report should disclose, and where MarkWitness\'s evidence report stands on each point',
      headers: ['Report feature', 'Why it matters', 'In MarkWitness\'s evidence report'],
      rows: [
        ['Confidence band', 'Shows the uncertainty behind the score, not just the score', 'Included alongside the signal strength'],
        ['Stated false positive rate, sourced', 'Lets you judge how much weight the result deserves', 'Method limits stated with the result'],
        ['Per-passage attribution', 'Shows exactly which text triggered a result', 'Included as a per-passage breakdown'],
        ['Explicit stated limits', 'Tells you what the result does NOT prove', 'Stated on every report and on the /limits page'],
        ['Document hash', 'Ties the report to the exact file checked', 'SHA-256 hash printed on every PDF'],
      ],
    },
    quote: {
      quote: 'The number people fixate on is the headline score. The number that actually matters is the confidence band around it, because that is where the honest answer to "how sure are we?" lives.',
      attribution: 'A MarkWitness detection engineer',
      role: 'on what a trustworthy report discloses',
    },
    pitfalls: [
      'Treating a single percentage as a verdict rather than a starting point for further checking.',
      'Assuming "no mark detected" means "definitely human-written": it only means "not detected under the keys tested".',
      'Sharing a screenshot of a score without the underlying report, so nobody can verify which document or method produced it.',
      'Ignoring the difference between document-level and sentence-level false positive rates when reading a competitor\'s claims.',
    ],
    faq: [
      {
        question: 'Can an AI detector report be used as proof in a formal dispute?',
        answer: 'It is stronger evidence when it includes a confidence band, stated limits and a document hash, but no single report is absolute proof on its own. It works best alongside other evidence, such as drafts or version history.',
      },
      {
        question: 'Why does MarkWitness show a confidence band instead of a single percentage?',
        answer: 'The underlying test is statistical, so a bare number would hide the uncertainty around it. Showing the band is more honest about how confident the result actually is.',
      },
      {
        question: 'What does "per-passage attribution" actually mean in practice?',
        answer: 'It means the report breaks a document down section by section rather than giving one score for the whole thing, so you can see exactly which passage triggered a result.',
      },
      {
        question: 'Is a document hash really necessary for an everyday check?',
        answer: 'For a quick personal check, probably not. For anything you might need to show someone else later, such as a client, a tutor or an editor, it is worth having, since it ties the report to the exact file.',
      },
      {
        question: 'What is the quickest way to spot a weak AI detector report?',
        answer: 'Look at what is missing rather than what is shown. If there is a single number and nothing else, no stated limits, no source for a false positive rate and no way to check which passage triggered the result, treat that absence as the warning sign, not the score itself. A tool confident enough in its own method usually shows its working without being asked.',
      },
    ],
    internalLinks: [
      { href: '/pricing', label: 'MarkWitness Pro pricing' },
      { href: '/method', label: 'How the MarkWitness method works' },
      { href: '/limits', label: 'Stated limits of the check' },
      { href: '/blog/how-common-are-ai-detector-false-positives', label: 'How common are AI detector false positives?' },
      { href: '/blog/turnitin-ai-detector-vs-markwitness', label: 'Turnitin AI detector vs MarkWitness' },
    ],
    externalLinks: [
      { href: 'https://www.turnitin.com/blog/understanding-false-positives-within-our-ai-writing-detection-capabilities', label: 'Turnitin on document-level false positive rates' },
      { href: 'https://www.turnitin.com/blog/understanding-the-false-positive-rate-for-sentences-of-our-ai-writing-detection-capability', label: 'Turnitin on sentence-level false positive rates' },
      { href: 'https://gptzero.me', label: 'GPTZero\'s stated accuracy claims' },
      { href: 'https://originality.ai', label: 'Originality.ai\'s stated accuracy claims' },
    ],
    schemaType: 'none',
  },
  {
    slug: 'per-language-ai-detection-accuracy',
    title: 'Per-Language AI Detection Accuracy, Compared',
    h1: 'Per-Language AI Detection Accuracy, Compared',
    metaDescription: 'AI detector accuracy by language is not one number. Here is why it varies, and how MarkWitness measures real per-language baselines.',
    category: 'Academy',
    format: 'deep-dive',
    intent: 'informational',
    publishedAt: '2026-08-08',
    author: 'MarkWitness Content Team',
    primaryKeyword: 'ai detector accuracy by language',
    supportingKeywords: [
      'AI detection by language',
      'multilingual AI detector',
      'language baseline AI detection',
      'AI watermark language support',
      'non-native English AI detection bias',
      'reference corpus AI detection',
      'language-specific AI checker',
      'AI detector accuracy comparison',
    ],
    longTailKeywords: [
      'does AI detection accuracy change by language',
      'which languages does MarkWitness support',
      'why AI detectors are less accurate in some languages',
    ],
    heroImage: {
      src: 'https://images.unsplash.com/photo-1565022536102-f7645c84354a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600',
      alt: 'A stack of dictionaries and language textbooks, representing differences in AI detector accuracy by language',
      unsplashId: 'jAebodq7oxk',
    },
    intro: [
      'Ask whether an AI detector is accurate and the honest answer is: accurate in which language?',
      'Detection tools built and tuned mostly on English text do not automatically carry that reliability into Spanish, French, German or Portuguese.',
      'This piece looks at why AI detector accuracy by language genuinely differs, what MarkWitness measured to handle it properly, and why guessing across a language boundary is worse than saying "unsupported".',
    ],
    takeaways: [
      'The keyed maths behind a watermark test does not care what language the text is in.',
      'But measuring typical writing style needs a reference sample in the SAME language.',
      'MarkWitness built its five reference baselines from real, contemporary Wikipedia prose, around 597,000 words in total.',
      'Independent research shows detectors misjudging text across language and register lines, most sharply against non-native English writers.',
      'MarkWitness reports "unsupported" rather than testing text against the wrong language\'s baseline.',
    ],
    sections: [
      {
        id: 'why-language-changes-the-accuracy-question',
        heading: 'Why language changes the accuracy question',
        body: [
          'Most AI detection tools started life trained and tested on English. That is not a criticism so much as a fact of where the early research and the largest datasets happened to sit.',
          'The trouble comes when the same tool, tuned on English patterns, gets pointed at a French essay or a German report and produces a confident-looking score anyway. Confidence and accuracy are not the same thing, and the gap between them widens fast once you cross a language boundary.',
        ],
      },
      {
        id: 'the-watermark-math-is-language-independent',
        heading: 'The watermark maths itself is language-independent',
        body: [
          'Here is the useful part. A keyed green-list watermark test, the method described in Kirchenbauer, Geiping, Wen, Katz, Miers and Goldstein\'s 2023 paper, "A Watermark for Large Language Models", works by checking whether a specific, keyed set of tokens turns up more often than chance would predict.',
          'That statistical logic does not care what language the tokens belong to. A z-test over bigrams works the same way whether the text is in English or Portuguese, provided you have the right key and the right tokenisation for that language.',
        ],
      },
      {
        id: 'but-style-based-measurement-needs-a-same-language-reference',
        heading: 'But style-based measurement needs a same-language reference',
        body: [
          'The keyed test is only half the picture. To judge whether a piece of writing looks statistically ordinary or unusual for its language, you need a baseline of real, typical writing in that exact language to compare against.',
          'Borrow a French baseline to judge an English document, or vice versa, and you are comparing apples to a completely different orchard. Sentence rhythms, common bigrams, and typical vocabulary spread all differ language by language, so a substitute-language comparison produces numbers that look plausible and mean nothing.',
        ],
      },
      {
        id: 'how-the-five-baselines-were-built',
        heading: 'How the five language baselines were built',
        body: [
          'MarkWitness measured a separate reference baseline for each of its five supported languages (English, Spanish, French, German and Portuguese), using real, contemporary Wikipedia prose rather than synthetic or translated text.',
          'Every source document was run through the engine\'s own language identifier before being kept, so a mislabelled or mixed-language page could not slip into the wrong baseline. In total that comes to roughly 597,000 words across the five languages, from 216,157 for English down to 76,142 for Portuguese, shown in the table below.',
          'Corpus size and corpus quality are not the same lever, and it is worth being precise about why both matter. A baseline built from a smaller set of genuine, contemporary, verified-by-language prose is more useful than a larger one padded out with duplicate, scraped or machine-translated text, because what actually drives an accurate comparison is how well the sample represents ordinary sentence rhythm and vocabulary spread in that language today, not the raw word count sitting in a spreadsheet. That is precisely why every one of the roughly 597,000 words behind MarkWitness\'s five baselines passed through the same per-document language check before being counted, rather than simply pooling whatever text was available and hoping sheer volume would smooth out the noise on its own.',
          'A concrete case makes the point clearer. Take a 500-word German cover letter, written formally, with the longer compound nouns and clause structures typical of that register. Checked correctly against the German baseline, those features compare against genuine German business writing, which contains plenty of the same patterns, so the letter reads as statistically unremarkable. Checked instead against the English baseline, something MarkWitness deliberately refuses to do, that same compound-noun density and clause structure would look completely alien next to typical English sentence patterns, and could produce a misleadingly unusual-looking score for writing that is, in its own language, entirely ordinary.',
        ],
      },
      {
        id: 'what-goes-wrong-when-a-detector-crosses-language-lines',
        heading: 'What goes wrong when a detector crosses language lines',
        body: [
          'The sharpest illustration of this problem is not really about language at all. It is about register instead. Liang, Yuksekgonul, Mao, Wu and Zou\'s 2023 study, "GPT detectors are biased against non-native English writers," found that the detectors they tested consistently misclassified non-native English writing as AI-generated, while accurately identifying writing from native speakers.',
          'The likely cause is that non-native writing often carries simpler sentence structure and a narrower vocabulary range, traits that some detectors had learned to associate with AI output, purely because AI text also tends to look statistically "smooth" in similar ways. It is a reminder that a detector trained mostly on one register of one language can carry hidden assumptions into every score it produces, even within a single language.',
        ],
      },
      {
        id: 'why-markwitness-refuses-to-guess-with-a-substitute-language',
        heading: 'Why MarkWitness refuses to guess with a substitute-language baseline',
        body: [
          'Given all that, MarkWitness takes a deliberately narrow position: if a document is not written in one of the five supported languages, or the language cannot be confidently identified, the check reports "unsupported" rather than quietly substituting a different language\'s baseline and producing a number anyway.',
          'A wrong-but-confident-looking result is worse than no result. Saying "unsupported" costs nothing except a slightly less satisfying screen. Saying "here\'s a score" built on the wrong reference data could cost someone their credibility.',
        ],
      },
      {
        id: 'what-this-means-if-your-language-isnt-covered',
        heading: 'What this means if your language isn\'t covered',
        body: [
          'If you write in a language outside the current five, MarkWitness will not force a result out of the wrong baseline. That is a limit worth knowing before you rely on the tool, not after.',
          'Within the five supported languages (English, Spanish, French, German and Portuguese), each one gets its own measured reference, checked on the Check page or via the language-specific landing pages, so a result in French is being judged against genuine French writing, not a translated proxy for it.',
        ],
      },
    ],
    table: {
      caption: 'MarkWitness\'s measured reference-corpus size per supported language, drawn from contemporary Wikipedia prose and verified per-document by language before inclusion',
      headers: ['Language', 'Reference corpus size (words)'],
      rows: [
        ['English', '216,157'],
        ['Spanish', '92,667'],
        ['French', '92,643'],
        ['German', '112,172'],
        ['Portuguese', '76,142'],
      ],
    },
    quote: {
      quote: 'People assume a bigger model automatically means better multilingual accuracy. What actually moves the needle is whether you measured a proper same-language reference sample, or borrowed one from somewhere else and hoped for the best.',
      attribution: 'A MarkWitness detection engineer',
      role: 'on why each supported language gets its own reference baseline',
    },
    pitfalls: [
      'Assuming a detector\'s advertised accuracy figure applies equally across every language it accepts.',
      'Running non-native English writing through a general classifier and treating a flagged result as final, without accounting for known register bias.',
      'Trusting a score for a language the tool does not clearly state it has a dedicated reference baseline for.',
      'Confusing "the maths works the same everywhere" with "the accuracy is the same everywhere": the test logic travels, but the reference data does not, unless it was measured separately.',
    ],
    faq: [
      {
        question: 'Does MarkWitness work equally well in every language it supports?',
        answer: 'Each of the five supported languages has its own measured reference baseline, built to the same standard, so none of them is treated as a fallback or an afterthought. Accuracy still depends on document length and the usual statistical factors.',
      },
      {
        question: 'What happens if I check a document in a language MarkWitness doesn\'t support?',
        answer: 'The check reports the document as unsupported rather than scoring it against the wrong language\'s baseline. That is a deliberate choice, not a bug.',
      },
      {
        question: 'Why do non-native English writers get flagged more often by some detectors?',
        answer: 'Independent research has found that some detectors associate simpler sentence structure and narrower vocabulary with AI output, which can overlap with how non-native writing naturally reads, leading to more false positives for that group.',
      },
      {
        question: 'Is a bigger reference corpus always more accurate?',
        answer: 'Size helps, but quality matters just as much. MarkWitness verifies every source document\'s language with its own identifier before including it, so the baseline is not just large but reliably in the right language.',
      },
      {
        question: 'Why use Wikipedia prose rather than a larger scraped dataset for each baseline?',
        answer: 'Contemporary Wikipedia prose is verifiably written in the stated language, edited to a reasonably consistent standard, and free of the duplication and mixed-language contamination that a large, loosely curated scrape often carries. A smaller, verified sample is more useful than a larger, noisier one for measuring what typical writing in a language actually looks like, which is exactly why each baseline was checked document by document rather than accepted in bulk.',
      },
    ],
    internalLinks: [
      { href: '/method', label: 'How the MarkWitness method works' },
      { href: '/in/en', label: 'English-language check' },
      { href: '/for/non-native-english-writers', label: 'MarkWitness for non-native English writers' },
      { href: '/blog/what-is-an-ai-watermark-detector', label: 'What is an AI watermark?' },
      { href: '/blog/green-list-watermarking-explained', label: 'Green-list watermarking explained' },
    ],
    externalLinks: [
      { href: 'https://arxiv.org/abs/2301.10226', label: 'Kirchenbauer et al., "A Watermark for Large Language Models"' },
      { href: 'https://arxiv.org/abs/2304.02819', label: 'Liang et al. on detector bias against non-native English writers' },
      { href: 'https://www.nist.gov/itl/ai-risk-management-framework', label: 'NIST AI Risk Management Framework' },
    ],
    schemaType: 'none',
  },
  {
    slug: 'gptzero-review-false-positives',
    title: 'GPTZero Review: Accuracy, Bias and False Positives',
    h1: 'GPTZero Review: Accuracy, Bias and False Positives',
    metaDescription: 'GPTZero claims 99% accuracy and ESL de-biasing. What that covers, what independent research says, and when to reach for it.',
    category: 'Reviews',
    format: 'review',
    intent: 'navigational',
    publishedAt: '2026-08-09',
    author: 'MarkWitness Content Team',
    primaryKeyword: 'gptzero false positive',
    supportingKeywords: [
      'GPTZero accuracy',
      'GPTZero ESL bias',
      'GPTZero review',
      'AI writing classifier',
      'GPTZero vs MarkWitness',
      'non-native English AI detection',
      'GPTZero mixed document accuracy',
      'AI detector bias',
    ],
    longTailKeywords: [
      'is GPTZero accurate for non-native English speakers',
      'does GPTZero have false positives',
      'GPTZero vs a watermark detector',
    ],
    heroImage: {
      src: 'https://images.unsplash.com/photo-1586769852836-bc069f19e1b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600',
      alt: 'A magnifying glass over a laptop, illustrating a review of GPTZero false positive claims',
      unsplashId: 'afW1hht0NSs',
    },
    intro: [
      'GPTZero is one of the names people reach for first when a "did AI write this" question comes up. That is fair enough, because it is widely used and it publishes some genuinely strong headline numbers.',
      'But a headline number is not the whole story. This review looks at what GPTZero actually claims, what independent research says about the class of tool it belongs to, and where a GPTZero false positive is most likely to happen.',
    ],
    takeaways: [
      'GPTZero states 99% overall accuracy and a mixed-document accuracy of 96.5%.',
      'It says it has been de-biased for ESL learners, with a stated false positive rate of around 1% for that group.',
      'Independent research on the broader class of GPT detectors found bias against non-native English writers, which is worth reading carefully for what it does and doesn\'t prove.',
      'GPTZero is a general AI-writing classifier, a different tool from a narrow keyed-watermark test like MarkWitness.',
      'Even GPTZero says plainly that no AI detector is 100% accurate.',
    ],
    sections: [
      {
        id: 'what-gptzero-actually-is',
        heading: 'What GPTZero actually is',
        body: [
          'GPTZero is a general AI-writing classifier. Feed it a document and it estimates, using patterns in sentence structure, word choice and predictability, how likely that text is to have come from a language model rather than a person.',
          'That is a genuinely useful thing to have, and it is a different job from what a keyed watermark test does. A classifier is guessing from style. A watermark test is checking for a specific, deliberately planted statistical signal. Both have their place; they just answer slightly different questions.',
        ],
      },
      {
        id: 'the-headline-numbers-gptzero-publishes',
        heading: 'The headline numbers GPTZero publishes',
        body: [
          'On its own site, GPTZero states 99% accuracy as its top-line figure. It also says it has been de-biased for ESL learners, with a false positive rate of around 1% for that group specifically, and states 96.5% accuracy on documents that mix human and AI writing together, a harder case than a document that is purely one or the other.',
          'It is worth giving GPTZero credit for one line in particular: it states plainly, in its own words, that "no AI detector is 100% accurate." That is a more honest baseline position than plenty of tools in this space take.',
        ],
      },
      {
        id: 'what-the-esl-bias-research-actually-found',
        heading: 'What the ESL bias research actually found',
        body: [
          'Liang, Yuksekgonul, Mao, Wu and Zou\'s 2023 paper, "GPT detectors are biased against non-native English writers," tested a set of GPT detectors and found they consistently misclassified non-native English writing as AI-generated, while correctly identifying writing from native speakers.',
          'That is a real and important finding about the class of tool GPTZero belongs to. It is worth being precise about what it shows: the study examined a set of detectors available at the time, not GPTZero\'s current model specifically, and predates GPTZero\'s own stated ESL de-biasing work. It is evidence of a pattern the whole category needs to take seriously, not a direct test of today\'s GPTZero.',
        ],
      },
      {
        id: 'does-that-research-still-apply-to-gptzero-today',
        heading: 'Does that research still apply to GPTZero today?',
        body: [
          'Honestly, nobody outside GPTZero can say for certain either way, and that is the point worth sitting with rather than skating past. GPTZero states it has addressed ESL bias with a roughly 1% false positive rate for that group. That is its own claim, not an independently replicated figure sitting alongside the Liang et al. paper.',
          'The sensible reading is this: the underlying risk the research identified is real for the category of tool GPTZero sits in, GPTZero says it has taken steps to reduce that specific risk, and a careful reader treats both facts as true at once rather than picking whichever one is more convenient.',
        ],
      },
      {
        id: 'how-gptzero-differs-from-a-keyed-watermark-test',
        heading: 'How GPTZero differs from a keyed watermark test',
        body: [
          'GPTZero is guessing from style, on any text, from any source, with no need for a key. That flexibility is exactly why it can misjudge unusual but entirely human writing: a very formal essay, a non-native writer\'s careful sentence structure, a technical report written in short, plain clauses.',
          'MarkWitness works differently and more narrowly. It checks your OWN writing for a keyed green-list watermark, the same family of technique described in Kirchenbauer et al.\'s research, entirely in the browser, up to 1,500 words for free with no signup. It cannot tell you whether unmarked text was written by a model with no watermark at all. It can tell you, with a stated confidence band, whether a specific keyed signal is present.',
          'Two scenarios show where each tool actually earns its keep. First: a hiring manager receives a cover letter with no idea which tool, if any, produced it, and there is no key to test against. A style-based classifier like GPTZero is the only kind of check available here, weighing sentence structure and predictability against patterns learned from many documents. Second: a student wants to check their own essay before submitting it, and knows the specific reference their check will be judged against. Here a keyed test like MarkWitness\'s is the more precise instrument, because it is not guessing from style at all, it is checking for a defined statistical signal and reporting a confidence band around that specific question. Neither tool is simply the better one; they are built for different starting points, one where the source is unknown and one where a specific mark is being tested for.',
        ],
      },
      {
        id: 'when-gptzero-is-the-right-tool-and-when-its-not',
        heading: 'When GPTZero is the right tool, and when it isn\'t',
        body: [
          'Reach for GPTZero when you want a general read on a document with no known watermark key involved, a classic classifier job.',
          'Reach for a keyed test like MarkWitness when you specifically want to check your own writing for a known, testable statistical mark, or when you want a dated evidence report with stated limits attached to it, not just a percentage.',
        ],
      },
      {
        id: 'verdict',
        heading: 'Verdict',
        body: [
          'GPTZero earns credit for publishing real figures and for its blunt admission that no detector is perfect. The open question is how those figures hold up outside GPTZero\'s own marketing pages, given what the broader research says about detector bias against non-native writers.',
          'A single tool\'s verdict, however confident it sounds, is worth corroborating rather than treating as final, whether for GPTZero or for anyone else in this category.',
        ],
      },
    ],
    table: {
      caption: 'GPTZero\'s own stated performance figures, as published on its website',
      headers: ['Metric', 'GPTZero\'s stated figure'],
      rows: [
        ['Overall accuracy claim', '99%'],
        ['ESL false positive rate (stated as de-biased)', 'Approximately 1%'],
        ['Mixed human/AI document accuracy', '96.5%'],
        ['Provider\'s own caveat', '"No AI detector is 100% accurate"'],
      ],
    },
    quote: {
      quote: 'We tell students to treat any single detector score as one data point, not a verdict. That advice would hold even if every tool on the market had a perfect track record, which none of them claim to.',
      attribution: 'A university academic integrity officer',
      role: 'describing a typical case, speaking generally',
    },
    pitfalls: [
      'Reading GPTZero\'s "de-biased for ESL learners" claim as proof the underlying category-wide bias problem has been solved everywhere.',
      'Citing the Liang et al. paper as if it tested GPTZero\'s current model specifically, rather than the broader class of detectors available at the time.',
      'Using a general classifier score as the only evidence in a formal dispute, instead of pairing it with drafts, version history or a keyed test result.',
      'Forgetting that a classifier and a watermark test answer different questions, and expecting one to do the other\'s job.',
    ],
    faq: [
      {
        question: 'Is a GPTZero false positive more likely for non-native English writers?',
        answer: 'Independent research found that class of detector generally more likely to misjudge non-native English writing. GPTZero states it has since taken steps to reduce that specific risk, though that is its own claim rather than an independently published replication.',
      },
      {
        question: 'Can I use GPTZero and MarkWitness together?',
        answer: 'Yes, and they answer different questions. GPTZero gives a style-based classifier read; MarkWitness checks your own writing for a specific keyed statistical mark, with a confidence band and stated limits.',
      },
      {
        question: 'Does GPTZero admit its own limits anywhere?',
        answer: 'Yes. GPTZero states directly that no AI detector is 100% accurate, which is a fair and useful caveat to keep in mind when reading any score it produces.',
      },
      {
        question: 'What should I do if GPTZero flags my genuinely human-written essay?',
        answer: 'Keep your drafts and version history, consider a second, differently-built check for corroboration, and read the stated limits on the report rather than treating the single score as final.',
      },
      {
        question: 'Should I pick GPTZero or MarkWitness if I only have time for one check?',
        answer: 'It depends what you actually know going in. If you have no idea which tool, if any, produced a piece of text, a style-based classifier like GPTZero is the only kind of check that applies. If you specifically want to know whether your own writing carries a known, testable statistical mark, a keyed test is the more precise question to ask. Where time allows, running both and reading them as two separate data points rather than a single verdict is the more careful approach.',
      },
    ],
    internalLinks: [
      { href: '/vs/gptzero', label: 'MarkWitness vs GPTZero' },
      { href: '/method', label: 'How the MarkWitness method works' },
      { href: '/verify', label: 'Live watermark detection demo' },
      { href: '/for/non-native-english-writers', label: 'MarkWitness for non-native English writers' },
      { href: '/blog/how-common-are-ai-detector-false-positives', label: 'How common are AI detector false positives?' },
    ],
    externalLinks: [
      { href: 'https://gptzero.me', label: 'GPTZero\'s stated accuracy and bias claims' },
      { href: 'https://arxiv.org/abs/2304.02819', label: 'Liang et al. on detector bias against non-native English writers' },
      { href: 'https://arxiv.org/abs/2301.10226', label: 'Kirchenbauer et al., "A Watermark for Large Language Models"' },
    ],
    schemaType: 'Review',
    reviewRating: {
      itemName: 'GPTZero',
      ratingValue: 3.6,
      bestRating: 5,
      summary: 'GPTZero publishes a strong headline accuracy figure and says it has been de-biased for ESL writers, but independent research on detector bias against non-native English writers means any single-tool verdict is worth corroborating rather than treating as final.',
    },
  },
  {
    slug: 'originality-ai-review-false-positives',
    title: 'Originality.ai Review: Reliable for High-Stakes Use?',
    h1: 'Originality.ai Review: Reliable for High-Stakes Use?',
    metaDescription: 'Originality.ai claims 97.8% accuracy but no published false-positive rate. Here\'s what that gap means if a client flags your invoice.',
    category: 'Reviews',
    format: 'review',
    intent: 'commercial',
    publishedAt: '2026-08-09',
    author: 'MarkWitness Content Team',
    primaryKeyword: 'originality ai false positive',
    supportingKeywords: [
      'Originality.ai accuracy',
      'Originality.ai review',
      'freelance writer AI detector dispute',
      'AI detector client dispute',
      'Originality.ai false positive rate',
      'content agency AI screening',
      'AI writing detector for freelancers',
      'proof of authorship freelance',
    ],
    longTailKeywords: [
      'what to do if a client\'s Originality.ai score is wrong',
      'does Originality.ai publish a false positive rate',
      'how freelancers can prove they didn\'t use AI',
    ],
    heroImage: {
      src: 'https://images.unsplash.com/photo-1516382799247-87df95d790b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600',
      alt: 'A magnifying glass inspecting a document, illustrating a review of Originality.ai false positive risk',
      unsplashId: 'd9ILr-dbEdg',
    },
    intro: [
      'An Originality AI false positive can turn a routine invoice into a week of back-and-forth before anyone agrees what actually happened. If you write for clients or agencies, there is a decent chance one of them runs your invoices through Originality.ai before paying up, since it has become a default screening step in parts of the content industry.',
      'So it is worth knowing exactly what the tool claims for itself, what it does not say on the same pages, and what a freelancer can actually do when a flagged score threatens to hold up payment.',
    ],
    takeaways: [
      'Originality.ai states a 97.8% multilingual accuracy figure and points to third-party studies.',
      'It does not publish a specific false-positive percentage on the pages you can point to.',
      'That gap makes it harder to judge exactly how much risk a single flagged score represents.',
      'If a client withholds payment over a flagged score, ask for the report itself and offer independent corroborating evidence.',
      'A MarkWitness evidence report is complementary evidence of your own process, not a rebuttal of Originality.ai\'s specific number.',
    ],
    sections: [
      {
        id: 'why-freelancers-end-up-here',
        heading: 'Why freelancers end up here',
        body: [
          'Agencies buy Originality.ai in bulk, often as one line in a wider quality-control checklist alongside plagiarism and grammar checks. A writer usually only learns it is running when a piece gets bounced back with a score attached and a request to "please explain."',
          'That is an awkward spot to be in. You are being judged against a number you had no part in generating, by a tool whose exact reliability you cannot easily verify from the outside.',
        ],
      },
      {
        id: 'what-originality-ai-claims-about-itself',
        heading: 'What Originality.ai claims about itself',
        body: [
          'On its own site, Originality.ai states 97.8% accuracy for its multilingual model, and references peer-reviewed third-party studies as backing. It is bundled with plagiarism checking, a grammar check and a fact-check feature, positioned as an all-in-one content quality gate rather than a single-purpose detector.',
          'Its FAQ does acknowledge that false positives happen, and says the company "transparently shares" false positive rates from its own accuracy study. That is a reasonable thing to say. It is just not the same as printing the number on the page in front of you.',
        ],
      },
      {
        id: 'the-gap-thats-worth-noticing',
        heading: 'The gap that\'s worth noticing',
        body: [
          'A 97.8% accuracy claim sounds precise, but accuracy and false-positive rate are not interchangeable numbers. A tool can be highly accurate overall while still producing a meaningful false-positive rate on a specific slice of documents: short pieces, technical writing, non-native English, heavily edited drafts.',
          'Without that specific figure sitting next to the accuracy claim, a freelancer facing a dispute has no easy way to gauge exactly how much weight a single Originality.ai score should carry. That is the practical problem this review is pointing at, not a claim that the tool is wrong, simply that the risk is harder to size up than it should be.',
          'Consider a short, 400-word product description, written in plain, functional language because that is what the client brief called for. Short, simple sentences are exactly the kind of text a style-based classifier can misread, whichever tool is used, because there is less room for the idiosyncratic variation that usually signals a human hand. A freelancer who mostly writes long-form, discursive copy might rarely hit this problem. One who regularly writes short technical or product copy is more exposed to it, and that is precisely the kind of risk a published false-positive rate, broken down by document length or type, would help someone gauge in advance rather than discover the hard way.',
        ],
      },
      {
        id: 'what-to-ask-for-when-a-client-flags-your-work',
        heading: 'What to ask for when a client flags your work',
        body: [
          'Ask for the actual report, not just the headline percentage: which passages triggered it, and under what settings the check was run. Ask whether the client has run other genuinely human-written samples of yours through the same tool for comparison, since a baseline reading matters.',
          'And be ready to offer your own evidence rather than only disputing theirs. Draft history in your writing tool, timestamps, research notes, even a rough outline you worked from: these build a picture of your actual process that a single score cannot capture either way.',
          'It also helps to frame the reply as fact-finding rather than confrontation. A message along the lines of "could you share the specific report and which passages were flagged, so I can look at exactly what triggered it" tends to get a more useful response than one that opens by disputing the tool\'s competence outright. Most agencies are not trying to catch anyone out; they are usually following a policy set by a client of their own further up the chain, and a specific, calm request for the underlying detail typically moves an invoice along faster than a general objection does.',
        ],
      },
      {
        id: 'how-a-markwitness-evidence-report-helps-and-what-it-doesnt-prove',
        heading: 'How a MarkWitness evidence report helps, and what it doesn\'t prove',
        body: [
          'A MarkWitness evidence report is not a rebuttal of Originality.ai\'s specific score, and it would be dishonest to sell it as one, because the two tools test for different things entirely. Originality.ai is a style-based classifier; MarkWitness checks your own writing for a specific keyed statistical mark.',
          'What the evidence report does give you is a dated, exportable PDF, with a SHA-256 hash tying it to the exact file, a stated confidence band, and the method\'s stated limits printed alongside the result. It is an "I can show what I actually did" artefact you generate yourself, on your own document, rather than something aimed at arguing a client\'s tool was wrong.',
        ],
      },
      {
        id: 'building-a-paper-trail-before-you-ever-need-it',
        heading: 'Building a paper trail before you ever need it',
        body: [
          'The freelancers who handle these disputes best usually built the habit before the dispute happened. Keeping drafts, running your own check on finished work before submitting it, and saving research notes costs a few minutes and pays off the one time a client\'s tool flags something wrongly.',
          'It is a small bit of admin against a real financial risk, worth doing routinely rather than scrambling for it after an invoice gets stuck.',
          'A simple routine works better than an elaborate one. Save each draft as a new version rather than overwriting the same file, note roughly when you started and finished a piece, and keep the client\'s original brief attached to the invoice it relates to. None of this takes long, but it means that if a dispute ever does arise, you are not reconstructing your process from memory weeks after the fact, you are handing over a paper trail that already exists.',
        ],
      },
      {
        id: 'verdict',
        heading: 'Verdict',
        body: [
          'Originality.ai has a strong bundled feature set and a headline number backed by referenced studies. What holds it back from a higher score here is simple: for a freelancer facing a real payment dispute, not being able to point to a specific published false-positive rate makes the risk harder to size up in the moment that matters most.',
        ],
      },
    ],
    table: {
      caption: 'What Originality.ai states about its own accuracy, and what it doesn\'t state on the same pages',
      headers: ['Claim', 'What\'s stated', 'What\'s not stated on the same page'],
      rows: [
        ['Multilingual model accuracy', '97.8%', 'The underlying false-positive percentage'],
        ['Evidence basis', '"Peer-reviewed third party studies" referenced', 'Specific study figures shown on that page'],
        ['False positives', 'Acknowledged as happening; rates described as "transparently" shared', 'No numeric false-positive rate printed on the FAQ page itself'],
      ],
    },
    quote: {
      quote: 'The worst part of a flagged invoice isn\'t the accusation, it\'s not knowing how much weight the number is even supposed to carry. Without a published false-positive rate, you\'re arguing in the dark.',
      attribution: 'A freelance copywriter',
      role: 'describing a typical client dispute, speaking generally',
    },
    pitfalls: [
      'Assuming a 97.8% accuracy claim tells you the false-positive rate: it does not, since they are different measurements.',
      'Disputing a client\'s flagged score with nothing but a denial, instead of drafts, timestamps or an independent check of your own.',
      'Not keeping a MarkWitness evidence report or equivalent on file until after a dispute has already started.',
      'Assuming every client runs the same settings or document type through Originality.ai, when comparison baselines can differ.',
    ],
    faq: [
      {
        question: 'What should I do if a client says Originality.ai flagged my article?',
        answer: 'Ask for the actual report and which passages triggered it, then offer your own evidence, such as drafts, timestamps, research notes, or an independent check of your own, rather than only disputing their score.',
      },
      {
        question: 'Does Originality.ai publish a false positive rate anywhere?',
        answer: 'Its FAQ says it transparently shares false-positive rates from its own accuracy study, but a specific numeric figure is not printed on the page making the accuracy claim itself.',
      },
      {
        question: 'Can a MarkWitness report overturn an Originality.ai result?',
        answer: 'No, and it is not designed to. It checks a different thing entirely, your own writing against a keyed statistical mark, and works as complementary evidence of your process, not a rebuttal of another tool\'s specific score.',
      },
      {
        question: 'Is it worth checking my own work before submitting it to a client?',
        answer: 'For anyone working with agencies known to screen invoices, yes. A quick check and a saved evidence report cost little and can save a lot of back-and-forth later.',
      },
      {
        question: 'How quickly should I respond if a client flags my work?',
        answer: 'As soon as you reasonably can. A prompt, specific reply that names exactly what you are disputing and offers supporting evidence reads far better to a client than a delayed general denial, and it keeps the invoice moving rather than letting it stall indefinitely.',
      },
    ],
    internalLinks: [
      { href: '/vs/originality-ai', label: 'MarkWitness vs Originality.ai' },
      { href: '/for/freelance-writers', label: 'MarkWitness for freelance writers' },
      { href: '/pricing', label: 'MarkWitness Pro pricing' },
      { href: '/docs/api', label: 'MarkWitness API documentation' },
      { href: '/blog/5-things-ai-detector-report-should-tell-you', label: '5 things an AI detector report should tell you' },
    ],
    externalLinks: [
      { href: 'https://originality.ai', label: 'Originality.ai\'s stated accuracy claims' },
      { href: 'https://www.turnitin.com/blog/understanding-false-positives-within-our-ai-writing-detection-capabilities', label: 'Turnitin on document-level false positive rates' },
      { href: 'https://gptzero.me', label: 'GPTZero\'s stated accuracy and bias claims' },
    ],
    schemaType: 'Review',
    reviewRating: {
      itemName: 'Originality.ai',
      ratingValue: 3.4,
      bestRating: 5,
      summary: 'Originality.ai cites a strong multilingual accuracy figure and points to third-party studies, but does not surface a specific false-positive percentage on its own marketing pages, which makes it harder for a freelancer facing a client dispute to know exactly what risk they\'re up against.',
    },
  },
  {
    slug: 'claude-ai-watermark-anthropic-provenance-mark',
    title: 'Claude\'s AI Watermark: What Anthropic\'s Mark Means',
    h1: 'Claude\'s AI Watermark: What Anthropic\'s Mark Means',
    metaDescription: 'What it means when a model maker marks its own output, and why that matters for students, freelancers and employees checking their work.',
    category: 'News',
    format: 'case-study',
    intent: 'informational',
    publishedAt: '2026-08-10',
    author: 'MarkWitness Content Team',
    primaryKeyword: 'claude ai watermark',
    supportingKeywords: [
      'Anthropic provenance mark',
      'Claude watermark detection',
      'AI provenance mark',
      'green-list watermarking',
      'AI content transparency',
      'EU AI Act Article 50',
      'model output watermark',
      'statistical AI mark',
    ],
    longTailKeywords: [
      'what does it mean if Claude watermarks its output',
      'how does an AI provenance mark work',
      'can I check for an AI watermark in my own writing',
    ],
    heroImage: {
      src: 'https://images.unsplash.com/photo-1644088379091-d574269d422f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600',
      alt: 'An abstract network of connected nodes, representing the statistical structure behind Claude\'s AI watermark',
      unsplashId: 'xuTJZ7uD7PI',
    },
    intro: [
      'Model makers are under growing pressure to mark what their systems generate. Anthropic, the company behind Claude, is one of several named in that conversation.',
      'This piece explains, in general terms, what a Claude AI watermark would actually mean for the category of technique involved, not insider details we cannot verify, and why it matters to anyone whose writing might get compared against one.',
    ],
    takeaways: [
      'A provenance mark is a statistical signal built into generated text, designed to be detectable later without needing access to the original model.',
      'The best-documented technique in this family is green-list watermarking, from Kirchenbauer et al.\'s 2023 research.',
      'The EU AI Act\'s Article 50 transparency rules are a major reason adoption of this kind of marking is accelerating, with enforcement beginning 2 August 2026.',
      'MarkWitness holds one open, testable reference key plus support for vendor or institution keys supplied via configuration, never a claim to hold every vendor\'s private key.',
      '"No mark detected" always means "under the keys we hold", never proof that a document is human-written.',
    ],
    sections: [
      {
        id: 'why-this-matters-now',
        heading: 'Why this matters now',
        body: [
          'Provenance marking used to be a research topic. It is fast becoming a compliance requirement. The EU AI Act\'s Article 50 transparency obligations, with enforcement through the EU AI Office and national authorities beginning 2 August 2026, are pushing model providers toward some form of detectable labelling on AI-generated content.',
          'Against that backdrop, any move by a major provider, Anthropic included, toward marking Claude\'s output is not an isolated story. It sits inside a wider shift the whole industry is being nudged toward at roughly the same time.',
        ],
      },
      {
        id: 'what-a-provenance-mark-actually-is-in-general-terms',
        heading: 'What a provenance mark actually is, in general terms',
        body: [
          'Strip away the branding and a provenance mark is a statistical pattern, deliberately built into generated text, that a detector holding the right key can later find using standard statistical tests. It is not a visible watermark like a logo stamped on an image. Nobody reading the text would notice anything odd.',
          'The point of building it this way is that the mark survives being copied, pasted and read normally, while staying invisible to a casual reader and requiring the correct key to test for reliably.',
        ],
      },
      {
        id: 'the-technique-family-this-sits-within',
        heading: 'The technique family this sits within',
        body: [
          'The clearest, most publicly documented method in this space is green-list watermarking, described in Kirchenbauer, Geiping, Wen, Katz, Miers and Goldstein\'s 2023 paper, "A Watermark for Large Language Models." It works by quietly favouring a randomised set of "green" tokens during text generation, in a way that is invisible to a reader but later detectable through a statistical test, without needing access to the model itself.',
          'To be precise about what we can and cannot say here: this is the general category of technique the field understands and has published research on. It is the honest, verifiable mechanism this kind of mark is built from, not a specific claim about the exact implementation any one provider, Anthropic included, uses internally. That detail is not something outsiders can verify from public information.',
        ],
      },
      {
        id: 'why-a-major-model-makers-mark-matters-for-your-own-writing',
        heading: 'Why a major model maker\'s mark matters for your own writing',
        body: [
          'If a widely-used model applies a mark of this kind to its output, the practical effect ripples outward. A student\'s genuinely human-written essay could, in theory, get compared against claims about that mark by someone who does not fully understand what the mark can and cannot prove.',
          'The same goes for freelancers submitting copy, or employees drafting reports. None of that means the mark itself is the problem. It means everyone downstream needs a clear, honest understanding of what a detected or undetected mark actually establishes, which is less than most people assume.',
          'For institutions handling this at scale, the same shift plays out at a policy level. A school or employer that previously relied on a single style-based classifier score now has to decide how a watermark-based result fits alongside that older kind of check, since the two measure genuinely different things and can validly disagree without either one being wrong. Writing that into a clear policy, rather than leaving each individual case to whoever happens to read the report that week, is the practical step a lot of institutions are still catching up on.',
        ],
      },
      {
        id: 'the-eu-ai-act-article-50-backdrop',
        heading: 'The EU AI Act Article 50 backdrop',
        body: [
          'Article 50 of the EU AI Act pushes toward machine-readable labelling of AI-generated content, part of a broader transparency push that the European Commission\'s AI Act policy page confirms is enforced from 2 August 2026 through the EU AI Office and national authorities.',
          'Watermarking of the kind described here is one of the more practical ways a provider can meet a transparency obligation like that without disrupting how the content itself reads. That regulatory pressure is a big part of why this topic has moved from an academic paper to a live policy conversation so quickly.',
        ],
      },
      {
        id: 'how-markwitness-handles-this-honestly',
        heading: 'How MarkWitness handles this honestly',
        body: [
          'MarkWitness ships one public, open reference key it can test against directly, which is why its own /verify demo can show a real, live result: a specimen of marked text scoring z=20.45 under the correct key, against z=0.1 for the identical text checked under a different key. That is not a claim made in the abstract; it is demonstrated on the page.',
          'Beyond that open key, MarkWitness supports vendor or institution keys supplied via configuration, where one has been made available. What it will not do is claim broad access to every model provider\'s private detection key, because no such access exists publicly for any independent tool. That is precisely why the product states, plainly and permanently, that "no mark detected" only ever means "under the keys we hold", never proof that a document is human-written.',
        ],
      },
      {
        id: 'what-to-actually-do-if-youre-worried',
        heading: 'What to actually do if you\'re worried',
        body: [
          'If you are concerned about your own writing being wrongly associated with AI output, the useful step is checking your own document against the keys a tool actually holds and being clear-eyed about what that result does and does not prove, rather than chasing a guarantee no honest tool can offer.',
          'Keep drafts, keep your working notes, and treat any single detection result, marked or unmarked, as one piece of evidence rather than the whole picture.',
          'What has genuinely changed for a working writer is less about any single tool and more about habits worth adopting now. Before this kind of mark existed, keeping drafts and notes was a nice-to-have, useful mostly if a plagiarism question ever came up. Now, with provenance marking becoming a normal part of the landscape, the same habit does double duty: it stands as evidence of process regardless of what any detector, watermark-based or otherwise, ends up saying about a finished piece. The mark itself is not something a human writer needs to think about while actually writing. What is worth adopting is the discipline of treating your own drafts as the primary record of your work, rather than leaning on a detector\'s after-the-fact verdict to settle a question your own working history could answer directly.',
        ],
      },
    ],
    table: {
      caption: 'What MarkWitness can and can\'t test for, by key type',
      headers: ['Key type', 'Does MarkWitness hold it?', 'What a check under this key can tell you'],
      rows: [
        ['MarkWitness\'s own open reference key', 'Yes, public and testable', 'A real, auditable positive control: the /verify demo scores z=20.45 under this key on a marked specimen, versus z=0.1 for the identical text under a different key'],
        ['Vendor or institution key supplied via configuration', 'Only where supplied', 'A check specific to that vendor\'s or institution\'s own mark, where configured'],
        ['A model vendor\'s private detection key it hasn\'t shared', 'No', 'Nothing conclusive: "no mark detected" here only ever means "under the keys we hold", never proof of human authorship'],
      ],
    },
    quote: {
      quote: 'We\'re open about exactly which keys we can test against. Claiming to see every vendor\'s private mark would be a bigger promise than any independent tool can honestly make.',
      attribution: 'A MarkWitness detection engineer',
      role: 'on the product\'s open reference key and its stated limits',
    },
    pitfalls: [
      'Assuming any independent detector can test against a specific model vendor\'s private detection key by default: none publish that publicly.',
      'Treating "no mark detected" as proof a document is human-written, rather than "not detected under the keys tested".',
      'Attributing specific implementation details to a provider\'s internal watermarking method that have not been publicly confirmed.',
      'Ignoring that heavy editing, translation or paraphrasing can degrade a mark, which cuts both ways for anyone relying on detection either way.',
    ],
    faq: [
      {
        question: 'Does MarkWitness know exactly how Claude\'s watermark works, if it has one?',
        answer: 'No, and it does not claim to. MarkWitness describes the general, publicly documented category of watermarking technique the field uses, without asserting inside knowledge of any specific provider\'s implementation.',
      },
      {
        question: 'Can I check my own writing for a Claude-specific watermark on MarkWitness?',
        answer: 'MarkWitness tests against its own open reference key, which is publicly verifiable on the /verify page, plus any vendor or institution keys supplied via configuration. It does not claim broad access to every provider\'s private key.',
      },
      {
        question: 'Why is this connected to the EU AI Act?',
        answer: 'Article 50\'s transparency rules, enforced from 2 August 2026, are pushing model providers toward some form of detectable labelling for AI-generated content, and watermarking is one practical way to meet that kind of obligation.',
      },
      {
        question: 'If a document scores no mark detected, does that prove a human wrote it?',
        answer: 'No. It only means no mark was found under the specific keys tested. Marks are keyed constructions that no vendor publishes publicly, and they survive heavy editing poorly, so an absent mark is never proof of human authorship on its own.',
      },
    ],
    internalLinks: [
      { href: '/guide/claude-ai-watermark', label: 'Guide: Claude\'s AI watermark' },
      { href: '/verify', label: 'Live watermark detection demo' },
      { href: '/limits', label: 'Stated limits of the check' },
      { href: '/blog/eu-ai-act-article-50-deadline-explained', label: 'EU AI Act Article 50: the 2026 deadline explained' },
      { href: '/blog/green-list-watermarking-explained', label: 'Green-list watermarking explained' },
    ],
    externalLinks: [
      { href: 'https://arxiv.org/abs/2301.10226', label: 'Kirchenbauer et al., "A Watermark for Large Language Models"' },
      { href: 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj', label: 'Official text of EU Regulation 2024/1689 (the EU AI Act)' },
      { href: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai', label: 'European Commission\'s AI Act policy page' },
      { href: 'https://www.nist.gov/itl/ai-risk-management-framework', label: 'NIST AI Risk Management Framework' },
    ],
    schemaType: 'none',
  },
]
