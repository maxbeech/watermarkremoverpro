import type { BlogPost } from './blog-types'

export const BLOG_POSTS_A: BlogPost[] = [
  {
    slug: "what-is-an-ai-watermark-detector",
    title: "What Is an AI Watermark? How Detection Actually Works",
    h1: "What Is an AI Watermark? How Detection Actually Works",
    metaDescription: "How does an AI watermark detector work? See the green-list method and real detection numbers from MarkWitness's own tests.",
    category: "Academy",
    format: "deep-dive",
    intent: "informational",
    publishedAt: "2026-08-06",
    author: "MarkWitness Content Team",
    primaryKeyword: "ai watermark detector",
    supportingKeywords: [
      "ai watermarking",
      "green-list watermark",
      "llm watermark",
      "statistical watermark detection",
      "how ai watermarks work",
      "text watermark detection",
      "ai provenance mark",
      "watermark key",
      "kirchenbauer watermark",
      "on-device ai detection",
    ],
    longTailKeywords: [
      "how does an ai watermark detector work",
      "is a detected ai watermark proof of ai use",
      "what is a green-list watermark",
    ],
    heroImage: {
      src: "https://images.unsplash.com/photo-1641477176034-1a3e10c343a8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600",
      alt: "A wax seal pressed into paper, standing in for the statistical seal an AI watermark detector looks for in text",
      unsplashId: "KGDVTn9lYDE",
    },
    intro: [
      "You've heard that AI writing can be 'watermarked', but what does that actually mean, and can a browser really spot it in your own words?",
      "This guide walks through the real mechanism behind an ai watermark detector, in plain English, with nothing left unexplained.",
      "We'll show the actual numbers from MarkWitness's own positive-control test and its live /verify demo, so you can see detection working, not just take our word for it.",
    ],
    takeaways: [
      "A green-list watermark works by nudging a model to prefer a hidden, key-specific set of 'green' tokens.",
      "Detection is a statistical z-test, not a magic yes/no button.",
      "You need the correct key to detect a mark reliably. A wrong key returns chance-level noise.",
      "MarkWitness checks run entirely in your browser; your document never leaves your device for a free check.",
      "A detected mark is never proof of authorship on its own. It just shows a pattern was present under a specific key.",
      "The same logic works in reverse: no mark under your keys proves nothing about the keys you don't hold.",
    ],
    sections: [
      {
        id: "the-basic-idea-behind-green-list-watermarking",
        heading: "The Basic Idea Behind Green-List Watermarking",
        body: [
          "Picture a language model choosing its next word. At almost every point in a sentence, several words would work fine. A green-list watermark uses that wiggle room. Before it writes anything, the model quietly splits its vocabulary into two piles for that moment, a 'green' pile and a 'red' pile, based on a hidden key and whatever came just before.",
          "The model doesn't switch to nonsense. It's still nudged towards ordinary, sensible language. It just leans towards the green pile slightly more often than chance would predict. Do that over hundreds of words and a pattern builds up that a plain reader would never spot by eye.",
          "That's the whole trick, really. Nothing is hidden inside the letters or the spacing. The pattern lives in which words got chosen, not how they're written. This is the method Kirchenbauer, Geiping, Wen, Katz, Miers and Goldstein described in their 2023 paper on watermarking large language models, and it's the same family of technique MarkWitness's check is built to detect.",
        ],
      },
      {
        id: "why-a-detector-needs-a-key",
        heading: "Why a Detector Needs a Key",
        body: [
          "Here's the catch that trips a lot of people up: the green and red piles aren't fixed. They're generated fresh, word by word, from a secret key plus whatever text came just before. Change the key and you get a completely different green list.",
          "So a detector can't just 'look for watermarks' in general. It has to test one specific key at a time, and ask: for this passage, using this key, did green-listed words show up more often than pure chance allows?",
          "This is also why MarkWitness never claims to catch every AI-marked document out there. Nobody outside the model vendors publishes their detection keys. A check can only test the keys it actually holds. That's a genuine, permanent limit, stated plainly on the /limits page, not a caveat buried in the small print.",
        ],
      },
      {
        id: "the-statistics-a-z-test-not-a-guess",
        heading: "The Statistics: A Z-Test, Not a Guess",
        body: [
          "Once you've picked a key, the actual maths is a z-test. Line the text up as a sequence of distinct bigrams (word pairs), work out how many landed on the green list under that key, and compare that count with what plain, unwatermarked writing would produce.",
          "A big enough gap between what you saw and what chance predicts gives you a large z-score, and a correspondingly tiny p-value. The higher the z-score, the less plausible it is that the pattern happened by accident.",
          "This isn't guesswork or vibes-based pattern matching. It's a number you can recompute, check and argue with. That's a deliberately narrower promise than a general 'AI or not' classifier makes, and that's the point. A testable claim beats an unfalsifiable one.",
        ],
      },
      {
        id: "markwitness-own-numbers-a-worked-example",
        heading: "MarkWitness's Own Numbers: A Worked Example",
        body: [
          "Numbers are more convincing than descriptions, so here are real ones. In MarkWitness's own positive-control test, a passage of marked text scored z > 8, with p < 1e-6, when tested under its correct key. Tested under a different key, the exact same text scored at chance, with no signal at all.",
          "The live /verify page shows the same thing happening in public, not just in a lab note. A specimen of marked text there scores z = 20.45 under the correct key. Run that identical text past a different key and the score drops to z = 0.1, indistinguishable from ordinary prose.",
          "That contrast is the whole demonstration. It's not 'trust us, it detects things'; it's the same words, two keys, two wildly different results, sitting on a page you can open right now.",
        ],
      },
      {
        id: "why-on-device-checking-matters",
        heading: "Why On-Device Checking Matters",
        body: [
          "A lot of detection tools work by uploading your document to a server somewhere. MarkWitness's free check doesn't. The whole test, up to 1,500 words, runs inside your own browser. Your document never leaves your device.",
          "For a student worried about a false accusation, or a freelancer checking a draft before it goes near a client, that matters. You're not handing unpublished work to a third-party server just to learn whether a statistical pattern is present.",
          "A free account raises the ceiling to 5,000 words and 20 checks a month, across five supported languages: English, Spanish, French, German and Portuguese, each measured against its own reference baseline rather than a rough, English-shaped guess.",
        ],
      },
      {
        id: "what-a-detected-mark-does-not-prove",
        heading: "What a Detected Mark Does Not Prove",
        body: [
          "This part is worth reading twice. A detected mark is not proof of authorship. Marks can turn up in quoted text, in translations, in text that was AI-assisted then heavily rewritten by a person, or in passages copied from somewhere already marked.",
          "Equally, an absent mark isn't proof of human authorship. Marks are keyed constructions. No model vendor publishes its detection key. Marks survive editing poorly, so a lightly-touched AI passage might test clean under every key you hold. 'No mark detected' always means 'under the keys we tested', never 'this document is clean'.",
          "That's a deliberately honest limit, and MarkWitness states it on every report it produces. A watermark check is one data point. It's not a verdict.",
        ],
      },
      {
        id: "how-this-differs-from-a-general-ai-classifier",
        heading: "How This Differs From a General AI Classifier",
        body: [
          "General AI-writing classifiers work differently. They look at style: sentence rhythm, vocabulary choice, how predictable the phrasing is, and estimate a probability that a human wrote it. That's a useful, but fuzzier, kind of evidence.",
          "A watermark test asks a narrower, more falsifiable question: does this specific statistical pattern, under this specific key, appear more than chance allows? It can be right or wrong in a way you can check the working for.",
          "Neither replaces the other. A classifier might flag writing that carries no watermark at all. A watermark check might find nothing in text a classifier is convinced is AI-written. They measure different things, and mixing them up is one of the more common mistakes people make when reading a report.",
        ],
      },
      {
        id: "getting-started-with-your-own-check",
        heading: "Getting Started With Your Own Check",
        body: [
          "If you want to see this working on your own words, the Check page is the place to start. Paste in up to 1,500 words, free, no account needed, and the test runs there in your browser.",
          "Read the result alongside the /limits page before drawing any conclusions from it. A high z-score under a key you tested is real information. It's just not the only piece of information a fair judgement needs.",
          "Interest in this kind of provenance checking is only growing as frameworks like the NIST AI Risk Management Framework, and transparency rules such as the EU AI Act's, put more weight on being able to show your working. For a deeper look at the statistics specifically, MarkWitness has a longer explainer on green-list watermarking.",
        ],
      },
    ],
    table: {
      caption: "MarkWitness's own watermark test results, correct key vs wrong key",
      headers: ["Test", "Key used", "Result", "What it shows"],
      rows: [
        ["Positive-control test", "Correct key", "z > 8 (p < 1e-6)", "Statistically overwhelming signal"],
        ["Positive-control test", "Different key", "Chance level", "No signal without the right key"],
        ["Live /verify demo", "Correct key", "z = 20.45", "Detector confirms known marked text"],
        ["Live /verify demo", "Different key", "z = 0.1", "Same text, wrong key, no signal"],
      ],
    },
    quote: {
      quote: "The z-score only means something once you've named the key. Run the same passage past the wrong key and the signal disappears completely. That's not a bug; it's the whole design.",
      attribution: "A MarkWitness detection engineer",
      role: "on the green-list watermark test",
    },
    pitfalls: [
      "Treating a high z-score as courtroom-grade proof of who wrote something, rather than one signal under one key.",
      "Assuming every AI writing tool marks its output: many don't, and marks aren't standardised across vendors.",
      "Forgetting that translation, heavy editing or quoting marked text can weaken or destroy a mark either way.",
      "Testing against the wrong key and concluding 'no watermark' when really it's 'no watermark under this key'.",
    ],
    faq: [
      {
        question: "Is a detected AI watermark proof I used AI?",
        answer: "No. A detected mark tells you a specific statistical pattern showed up under one key you tested, but it doesn't tell you how the text ended up that way. Quoted, translated or lightly-edited marked text can carry a mark forward even when a human did real work on it.",
      },
      {
        question: "How does an AI watermark detector actually work?",
        answer: "It counts how often green-listed word pairs appear under a chosen key, then runs a z-test comparing that count with what plain chance would produce. A high z-score means the pattern is very unlikely to be accidental.",
      },
      {
        question: "What is a green-list watermark, in one sentence?",
        answer: "It's a hidden, key-based split of a model's vocabulary into 'green' and 'red' words, with generation nudged towards the green half often enough to be statistically detectable later.",
      },
      {
        question: "Does editing a document remove the watermark?",
        answer: "Sometimes, and sometimes not. Marks generally survive light editing poorly and heavy rewriting even worse, but there's no reliable rule that guarantees removal against a specific vendor's undisclosed watermark, which is exactly why MarkWitness's own on-device rewrite feature states that limit on every result rather than promising a guarantee it cannot verify.",
      },
      {
        question: "Can MarkWitness detect every AI watermark that exists?",
        answer: "No detector can. Detection only works against keys you actually hold, and no model vendor publishes its own detection key publicly.",
      },
    ],
    internalLinks: [
      { href: "/method", label: "How MarkWitness's method works" },
      { href: "/verify", label: "See the live /verify demo" },
      { href: "/check", label: "Try the free Check page" },
      { href: "/limits", label: "Read MarkWitness's stated limits" },
      { href: "/guide/does-editing-remove-a-watermark", label: "Guide: does editing remove a watermark?" },
      { href: "/blog/green-list-watermarking-explained", label: "Green-list watermarking, explained in more depth" },
    ],
    externalLinks: [
      { href: "https://arxiv.org/abs/2301.10226", label: "Kirchenbauer et al., 'A Watermark for Large Language Models'" },
      { href: "https://www.nist.gov/itl/ai-risk-management-framework", label: "NIST AI Risk Management Framework" },
      { href: "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai", label: "European Commission's AI Act policy page" },
    ],
    schemaType: "none",
  },
  {
    slug: "eu-ai-act-article-50-deadline-explained",
    title: "EU AI Act Article 50: The 2026 Deadline Explained",
    h1: "EU AI Act Article 50: The 2026 Deadline Explained",
    metaDescription: "EU AI Act Article 50 enforcement begins 2 August 2026. Here's what the transparency rules mean for writers, publishers and AI content checks.",
    category: "News",
    format: "data-study",
    intent: "informational",
    publishedAt: "2026-08-06",
    author: "MarkWitness Content Team",
    primaryKeyword: "eu ai act article 50",
    supportingKeywords: [
      "eu ai act transparency obligations",
      "ai act 2026 deadline",
      "ai content labelling eu",
      "eu ai office enforcement",
      "ai act compliance for publishers",
      "ai generated content disclosure",
      "eu artificial intelligence act",
      "ai transparency rules europe",
    ],
    longTailKeywords: [
      "when does the eu ai act article 50 deadline start",
      "what does eu ai act article 50 require",
      "how to comply with eu ai act transparency rules",
    ],
    heroImage: {
      src: "https://images.unsplash.com/photo-1594810205183-18a8b0ce6c13?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600",
      alt: "EU flags flying outside a European Commission building, representing the EU AI Act Article 50 compliance deadline",
      unsplashId: "0NRkVddA2fw",
    },
    intro: [
      "The EU AI Act Article 50 deadline has landed on a lot of desks that weren't watching closely enough, and Brussels has fixed it firmly: enforcement begins 2 August 2026.",
      "This piece explains what Article 50's transparency theme is actually about, in plain English, and what the enforcement timeline means for anyone publishing AI-assisted content.",
      "We'll stick to what's actually published by the European Commission and EUR-Lex, rather than guessing at sub-clauses nobody has confirmed.",
    ],
    takeaways: [
      "Article 50 sits under the EU AI Act's transparency obligations, aimed at making AI-generated content identifiable rather than banning it.",
      "The European Commission's own policy page states enforcement begins 2 August 2026, run by the EU AI Office alongside national authorities.",
      "The obligation theme covers disclosure and labelling of AI-generated or AI-assisted content, not a ban on using AI to write.",
      "Compliance pressure is a big part of why demand for detection and provenance-checking tools has grown through 2026.",
      "A watermark check is one useful input into a transparency workflow, but it isn't, on its own, a legal compliance certificate.",
    ],
    sections: [
      {
        id: "what-article-50-is-actually-about",
        heading: "What Article 50 Is Actually About",
        body: [
          "The EU AI Act is a large piece of legislation, and Article 50 sits inside its transparency obligations, the parts concerned with people being able to tell when they're dealing with AI-generated content, rather than the parts restricting what AI systems are allowed to do.",
          "The theme, broadly, is disclosure. Content that's AI-generated or AI-assisted in certain contexts should be identifiable as such, so a reader, listener or viewer isn't misled about its origin. That's the general shape of the obligation, as set out in the official text on EUR-Lex.",
          "We're deliberately not quoting specific sub-clauses here that we haven't independently verified word for word. If you need the exact legal text for a compliance decision, EUR-Lex carries the authoritative version of Regulation 2024/1689, so treat this article as the plain-English map, not the statute itself.",
        ],
      },
      {
        id: "the-2026-enforcement-timeline",
        heading: "The 2026 Enforcement Timeline",
        body: [
          "The European Commission's own AI Act policy page states that enforcement of these obligations begins on 2 August 2026. That's not a soft target; it's the date the Commission itself has published.",
          "From that point, enforcement runs through the EU AI Office at EU level, working alongside national authorities in each member state. That two-layer structure matters, because enforcement won't look identical everywhere; national regulators will run their own processes underneath the EU-level office.",
          "For anyone who's been treating this as a distant, theoretical deadline, it's worth saying plainly: it isn't distant any more. 2 August 2026 has already arrived.",
        ],
      },
      {
        id: "who-the-transparency-obligations-affect",
        heading: "Who the Transparency Obligations Affect",
        body: [
          "The honest answer is: more people than expect it. Anyone producing content reaching an EU audience (freelancers, publishers, marketing teams, platforms hosting user content) sits somewhere in scope, even if the exact obligations differ by role.",
          "Individuals working for larger organisations will likely find their employer's compliance team setting new house rules. Independent freelancers and small publishers carry more of that responsibility themselves, which is exactly why interest in self-checking tools has grown.",
        ],
      },
      {
        id: "what-this-means-for-writers-and-freelancers",
        heading: "What This Means for Writers and Freelancers",
        body: [
          "If you write for clients, this is less about panic and more about paperwork. Being able to show your process, including drafts, version history, and where relevant, a record of what a watermark check did or didn't find, is becoming a normal ask, not an unusual one.",
          "It doesn't mean every freelancer needs a lawyer on retainer. It means keeping the kind of records you'd want anyway if a client ever questioned a piece of work, AI-related or not.",
          "MarkWitness has a dedicated page for freelance writers covering this in more detail, including how an evidence report can sit alongside a contract as a supporting record.",
        ],
      },
      {
        id: "what-this-means-for-publishers-and-platforms",
        heading: "What This Means for Publishers and Platforms",
        body: [
          "For publishers and platforms, the obligations point towards clearer labelling practices and towards being able to answer, credibly, whether content on their site is AI-generated, AI-assisted, or neither.",
          "That's an editorial workflow question as much as a legal one. Newsrooms and content teams that already track authorship and sourcing carefully will have less to change than ones that don't.",
        ],
      },
      {
        id: "why-provenance-checking-is-part-of-the-compliance-picture",
        heading: "Why Provenance Checking Is Part of the Compliance Picture",
        body: [
          "A statistical watermark check doesn't file your compliance paperwork for you. What it can do is give you one more falsifiable, checkable data point: a z-score under a named key, run entirely on your own device, to sit alongside your own account of how a piece of writing was produced.",
          "That's a modest, honest role, and it's the one MarkWitness is built for. It's a diagnostic, not a certificate, and it's worth treating it that way in any compliance workflow you build.",
        ],
      },
      {
        id: "what-the-act-does-not-require",
        heading: "What the Act Does Not Require",
        body: [
          "It's worth being clear about what this isn't. The transparency theme isn't a ban on using AI tools to draft, research or edit. It isn't a requirement to disclose every tool in your toolbox for every task.",
          "It's aimed at content and context where a reader could reasonably be misled about origin. Treating it as a blanket prohibition on AI-assisted work misreads the theme entirely, and risks either needless panic or, just as unhelpfully, disclosure fatigue that trains readers to ignore labels altogether.",
        ],
      },
      {
        id: "getting-ready-before-the-deadline",
        heading: "Getting Ready Before the Deadline",
        body: [
          "The practical starting point is simple: know what content you produce, know roughly how AI tools touch it, and have a record you could point to if asked.",
          "A free check on the Check page takes a couple of minutes and costs nothing to try. It won't answer every compliance question on its own, but it's a reasonable habit to build before August 2026 becomes 'the deadline that already happened'.",
        ],
      },
    ],
    table: {
      caption: "Confirmed EU AI Act transparency-enforcement milestones, per EUR-Lex and the European Commission",
      headers: ["Date / Reference", "What happens", "Source"],
      rows: [
        ["Regulation 2024/1689", "Official EU AI Act text, published on EUR-Lex", "Legal baseline for all obligations"],
        ["2 August 2026", "Enforcement of transparency-related obligations begins", "European Commission's AI Act policy page"],
        ["From 2 August 2026", "EU AI Office and national authorities take on enforcement roles", "European Commission's AI Act policy page"],
      ],
    },
    quote: {
      quote: "Clients don't ask if we used a tool. They ask if we can show our workings. That shift happened well before any deadline; the Act just gave it a hard date.",
      attribution: "A freelance content strategist",
      role: "describing a typical client conversation, speaking generally",
    },
    pitfalls: [
      "Assuming Article 50 bans AI-assisted writing outright, when the theme is disclosure, not prohibition.",
      "Waiting until the deadline to think about it, when workflows and templates take longer than a fortnight to change.",
      "Treating a single detection tool's result as a legal compliance statement rather than one supporting record.",
      "Confusing 'the Act applies to a company' with 'the Act applies to every individual freelancer' without checking which obligations actually land where.",
    ],
    faq: [
      {
        question: "When does the EU AI Act Article 50 deadline start?",
        answer: "The European Commission's own AI Act policy page states enforcement of the transparency obligations begins on 2 August 2026, run by the EU AI Office and national authorities.",
      },
      {
        question: "What does EU AI Act Article 50 actually require?",
        answer: "In plain terms, it sits within the Act's transparency theme, around making AI-generated or AI-assisted content identifiable in relevant contexts. For the precise legal wording, the official text is published on EUR-Lex.",
      },
      {
        question: "Does the EU AI Act apply if my business isn't based in the EU?",
        answer: "Broadly, EU rules of this kind tend to follow the audience rather than the company's home address, so content reaching EU users can be in scope even for non-EU businesses. Check the official text or a qualified adviser for your specific situation.",
      },
      {
        question: "How do I comply with EU AI Act transparency rules as a freelancer?",
        answer: "Keep clear records of your process, including drafts, version history, and where useful, an evidence report from a tool like MarkWitness, so you can show your workings if a client or platform asks.",
      },
      {
        question: "Is a watermark check enough to prove compliance on its own?",
        answer: "No. It's one supporting data point, not a legal certificate. Treat it as part of a wider record, not the whole of one.",
      },
    ],
    internalLinks: [
      { href: "/guide/eu-ai-act-article-50", label: "MarkWitness's EU AI Act Article 50 guide" },
      { href: "/for/freelance-writers", label: "For freelance writers" },
      { href: "/for/journalists", label: "For journalists" },
      { href: "/check", label: "Try the free Check page" },
      { href: "/blog/claude-ai-watermark-anthropic-provenance-mark", label: "What Anthropic's Claude watermark means" },
    ],
    externalLinks: [
      { href: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj", label: "Official EUR-Lex text of Regulation 2024/1689" },
      { href: "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai", label: "European Commission's AI Act policy page" },
      { href: "https://www.nist.gov/itl/ai-risk-management-framework", label: "NIST AI Risk Management Framework" },
    ],
    schemaType: "none",
  },
  {
    slug: "turnitin-ai-false-positive-how-to-check",
    title: "Turnitin Flagged You? How to Check Your Own Essay",
    h1: "Turnitin Flagged You? How to Check Your Own Essay",
    metaDescription: "Flagged by Turnitin's AI detector? Here's a step-by-step way to check your own essay and build an evidence pack before your appeal meeting.",
    category: "Academy",
    format: "how-to",
    intent: "informational",
    publishedAt: "2026-08-07",
    author: "MarkWitness Content Team",
    primaryKeyword: "turnitin ai false positive",
    supportingKeywords: [
      "turnitin ai detector false positive",
      "how to check turnitin ai flag",
      "turnitin ai writing false positive rate",
      "prove i didn't use ai",
      "ai false positive essay",
      "turnitin flagged my essay",
      "academic integrity ai appeal",
      "check essay for ai watermark",
    ],
    longTailKeywords: [
      "what to do if turnitin flags your essay as ai",
      "how accurate is turnitin's ai detector",
      "how to build evidence for an ai false positive appeal",
    ],
    heroImage: {
      src: "https://images.unsplash.com/photo-1531087131490-07836ca4341d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600",
      alt: "A handwritten essay page marked up in red pen, illustrating a Turnitin AI false positive being disputed",
      unsplashId: "LxphooAHzvc",
    },
    intro: [
      "You've just been hit with a Turnitin AI false positive: Turnitin's flagged your essay for AI writing, and you know you wrote it yourself. Now what?",
      "Here's a step-by-step way to check your own work, understand what Turnitin's own numbers actually say about false positives, and put together an evidence pack before you sit down with a tutor or panel.",
      "None of this is about arguing with a machine. It's about giving a human reviewer something solid to look at.",
    ],
    takeaways: [
      "Turnitin's own blog states a document-level false positive rate under 1% for documents flagged with over 20% AI writing, from an 800,000-document test.",
      "At sentence level, Turnitin's own figure is closer to 4%, and errors cluster near transitions between human and AI writing.",
      "A free MarkWitness check, done in your browser, is one extra piece of evidence, not a replacement for your own drafts and version history.",
      "Appeals go better with a dated, exportable record than with an argument alone.",
      "Save everything before you need it, not after.",
    ],
    sections: [
      {
        id: "step-1-save-your-original-draft-and-version-history",
        heading: "Step 1: Save Your Original Draft and Version History",
        body: [
          "Before you do anything else, find your original files: every saved draft, not just the final one you submitted. Most word processors keep version history automatically; Google Docs has it under 'File > Version history', and Word has it under 'File > Info'.",
          "If you wrote in stages, that history is worth more than any single tool's verdict. It shows a document growing over days or weeks, in your own typing rhythm, with your own false starts still visible.",
          "In Google Docs, open 'File > Version history > See version history' and you'll get a timestamped list of every autosave, often down to the minute, showing exactly when text was added, deleted or moved around. Named versions (right-click any entry and choose 'Name this version') are worth creating at major milestones, such as finishing a first draft or working through feedback, because they're easier to point to later than an anonymous autosave from late one evening. Word behaves differently: it relies on AutoSave being switched on with the file stored in OneDrive or SharePoint, and past versions then sit under 'File > Info > Version History', or under 'Restore previous versions' when you right-click the file in File Explorer. If AutoSave wasn't turned on, Word won't have kept anything beyond your last manual save, which is exactly why saving early drafts under separate file names, such as essay-draft-1.docx and essay-draft-2.docx, is worth doing as a habit rather than only after a flag has already landed.",
        ],
      },
      {
        id: "step-2-read-what-turnitin-actually-flagged",
        heading: "Step 2: Read What Turnitin Actually Flagged",
        body: [
          "Turnitin doesn't just give you a single 'AI' stamp. Open the report and look at exactly which sentences or sections got flagged, not just the overall percentage.",
          "This matters because Turnitin's own published figures show errors aren't spread evenly. Their sentence-level false positive rate sits around 4%, and they've reported that 54% of those false-positive sentences sit right next to genuine AI writing, at the seams where styles change. If your flagged sentences cluster near a heavily quoted or paraphrased section, that's worth noting.",
        ],
      },
      {
        id: "step-3-run-your-essay-through-a-free-markwitness-check",
        heading: "Step 3: Run Your Essay Through a Free MarkWitness Check",
        body: [
          "Head to the Check page and paste in the flagged essay, or the specific flagged sections if it's long. The test runs entirely in your browser, and nothing gets uploaded anywhere, which matters when the document is still under review.",
          "The free check covers up to 1,500 words with no account. If your essay is longer, a free account raises that to 5,000 words and 20 checks a month.",
        ],
      },
      {
        id: "step-4-understand-what-the-result-does-and-does-not-show",
        heading: "Step 4: Understand What the Result Does and Does Not Show",
        body: [
          "Read your result against what it actually tests: a specific, keyed statistical watermark, not a general 'sounds like AI' judgement. If no mark turns up, that's honest information, but it isn't proof of human authorship on its own, because marks are keyed and no vendor publishes its detection key.",
          "If you never used an AI writing tool, there's a good chance nothing will be found under any key MarkWitness tests, simply because there's no mark to find. Either way, treat the result as one line in your evidence pack, not the headline.",
        ],
      },
      {
        id: "step-5-gather-supporting-evidence-of-your-process",
        heading: "Step 5: Gather Supporting Evidence of Your Process",
        body: [
          "Beyond the writing tool itself, gather anything that shows your process: research notes, an outline, screenshots of a search history, emails to a tutor about the topic, or a reading list. Ordinary, boring evidence of ordinary, boring work.",
          "If you used any AI tool at all, even for brainstorming or grammar checking, be upfront about it in your notes. Trying to hide legitimate assistance you did use tends to backfire worse than disclosing it plainly.",
        ],
      },
      {
        id: "step-6-build-a-short-evidence-pack",
        heading: "Step 6: Build a Short Evidence Pack",
        body: [
          "Put it together as one short document: original drafts with timestamps, your MarkWitness result, the specific sentences Turnitin flagged, and a brief, calm note explaining your process.",
          "A MarkWitness Pro account can export a dated PDF evidence report with the signal strength, a confidence band, the keys tested, and a SHA-256 hash of the document, useful if you want a formal, exportable record rather than a screenshot.",
        ],
      },
      {
        id: "step-7-request-your-appeal-meeting-and-stay-factual",
        heading: "Step 7: Request Your Appeal Meeting and Stay Factual",
        body: [
          "Contact your tutor, module leader or academic integrity office to request a meeting, and bring the pack rather than emailing a long argument first. A calm, evidence-led conversation tends to go further than a defensive one.",
          "Stick to what you can show, not what you feel. 'Here's my draft history and here's what a watermark check found' lands better than 'it's not fair', even when it genuinely isn't.",
          "If your first contact has to be an email rather than a face-to-face request, keep it short and factual rather than pleading. A workable structure is: state plainly that you've been flagged, attach your evidence pack, and ask two direct questions, specifically what the panel's own documented false positive rate is for the tool that flagged you, and what further evidence they'd find useful ahead of any meeting. Something close to 'could you tell me what false positive rate your institution has recorded for this detector, and let me know what supporting material would be most useful before we meet' does two things at once: it shows you've engaged with the numbers seriously, and it gives a reviewer a specific, answerable question rather than an open-ended complaint they have to interpret for themselves.",
        ],
      },
    ],
    table: {
      caption: "Turnitin's own published false positive figures",
      headers: ["Level", "Turnitin's stated figure", "Detail"],
      rows: [
        ["Document-level", "Under 1%", "For documents with over 20% AI writing, from an 800,000-document test set"],
        ["Sentence-level", "Approximately 4%", "More common at transitions between human and AI writing; 54% of false-positive sentences sit next to actual AI writing"],
      ],
    },
    quote: {
      quote: "The students who come out of an appeal meeting fine are almost never the ones with the best argument. They're the ones who brought their drafts.",
      attribution: "A university academic integrity officer",
      role: "describing a typical case, speaking generally",
    },
    pitfalls: [
      "Deleting or not keeping draft history because the essay's already submitted; do this before you ever need it, every time.",
      "Treating a MarkWitness 'no mark found' result as a guaranteed clean bill of health rather than one data point.",
      "Sending an angry first email instead of requesting a calm meeting with evidence attached.",
      "Hiding legitimate AI-assisted brainstorming or grammar-checking out of fear it'll look worse; it rarely does, compared with the alternative.",
    ],
    faq: [
      {
        question: "What should I do if Turnitin flags my essay as AI?",
        answer: "Save your original drafts and version history first, read exactly which sentences were flagged, then run the essay through a free check like MarkWitness's before requesting an appeal meeting with your evidence in hand.",
      },
      {
        question: "How accurate is Turnitin's AI detector?",
        answer: "Turnitin's own blog reports a document-level false positive rate under 1% for documents over 20% AI writing, tested on 800,000 documents, but a higher sentence-level rate around 4%, especially near transitions between human and AI writing.",
      },
      {
        question: "Can I use a watermark check as evidence in my appeal?",
        answer: "Yes, as one piece of supporting evidence alongside your drafts and process notes. It shouldn't be your only piece, since a watermark check tests for one specific statistical pattern, not general authorship.",
      },
      {
        question: "What if I did use AI a little, for brainstorming?",
        answer: "Say so plainly in your evidence pack. Reviewers generally respond better to honest disclosure of light, legitimate assistance than to a document that looks like it's hiding something.",
      },
      {
        question: "Should I ask the panel for their own false positive rate?",
        answer: "Yes, if you can. Many institutions keep internal figures based on their own past cases, sometimes different from Turnitin's published numbers, and asking shows you're arguing from evidence rather than emotion. It also hands the panel a specific, easy question to answer, which tends to move a meeting forward faster than a general appeal for leniency.",
      },
    ],
    internalLinks: [
      { href: "/check", label: "Run the free Check page" },
      { href: "/guide/ai-detection-false-positive", label: "Guide: AI detection false positives" },
      { href: "/for/university-students", label: "For university students" },
      { href: "/guide/prove-you-wrote-it", label: "Guide: how to prove you wrote it" },
      { href: "/blog/turnitin-ai-detector-vs-markwitness", label: "Turnitin AI detector vs MarkWitness" },
      { href: "/blog/complete-guide-appealing-ai-plagiarism-accusation", label: "The complete guide to appealing an AI accusation" },
    ],
    externalLinks: [
      { href: "https://www.turnitin.com/blog/understanding-false-positives-within-our-ai-writing-detection-capabilities", label: "Turnitin: understanding false positives (document level)" },
      { href: "https://www.turnitin.com/blog/understanding-the-false-positive-rate-for-sentences-of-our-ai-writing-detection-capability", label: "Turnitin: false positive rate for sentences" },
      { href: "https://www.k12dive.com/news/turnitin-false-positives-AI-detector/652221/", label: "K-12 Dive on Turnitin's false positive rates" },
    ],
    schemaType: "HowTo",
  },
  {
    slug: "turnitin-ai-detector-vs-markwitness",
    title: "Turnitin AI Detector vs MarkWitness: Which to Trust",
    h1: "Turnitin AI Detector vs MarkWitness: Which to Trust",
    metaDescription: "Turnitin AI detector vs MarkWitness: what each tool actually measures, where each is useful, and why they're not really competitors.",
    category: "Reviews",
    format: "review",
    intent: "commercial",
    publishedAt: "2026-08-07",
    author: "MarkWitness Content Team",
    primaryKeyword: "turnitin ai false positive",
    supportingKeywords: [
      "turnitin vs markwitness",
      "ai writing detector comparison",
      "turnitin ai detection accuracy",
      "watermark check vs ai classifier",
      "best tool to check ai writing",
      "turnitin false positive rate",
      "ai detector reliability",
      "academic ai detection tools",
    ],
    longTailKeywords: [
      "is turnitin reliable enough on its own",
      "should i use markwitness instead of turnitin",
      "difference between turnitin and a watermark checker",
    ],
    heroImage: {
      src: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600",
      alt: "Scales of justice, representing weighing a Turnitin AI false positive against MarkWitness's own-writing check",
      unsplashId: "DZpc4UY8ZtY",
    },
    intro: [
      "Turnitin and MarkWitness get compared a lot, and honestly, that comparison rests on a mix-up: a Turnitin AI false positive and a MarkWitness result are not measuring the same thing at all.",
      "They measure different things, for different people, at different moments, so 'which one's better' is the wrong question. 'Which one for which job' is the right one.",
      "Below, we score Turnitin's AI writing detection on one narrow, useful question: how much should a standalone verdict be trusted without other evidence?",
    ],
    takeaways: [
      "Turnitin is an institutional classifier, built for universities screening submitted student work at scale.",
      "MarkWitness is a personal, on-device tool for checking your own writing for one specific kind of statistical mark.",
      "Turnitin's own published false positive rate is under 1% at document level but rises to around 4% at sentence level.",
      "A MarkWitness result is a useful complement to a Turnitin appeal, not a substitute for one.",
      "Neither tool is designed to be the sole basis for a misconduct finding, and neither claims to be.",
    ],
    sections: [
      {
        id: "what-turnitin-actually-measures",
        heading: "What Turnitin Actually Measures",
        body: [
          "Turnitin's AI writing detection is a classifier. It looks at patterns across a whole document: sentence structure, word predictability, stylistic consistency, and estimates how much of it looks like AI-generated text.",
          "It's built to sit inside an institution's existing plagiarism-checking workflow, scanning submitted assignments at scale, across thousands of students, without anyone needing to opt in individually.",
          "That's a genuinely useful job. It's also, by its nature, a probability estimate rather than a hard fact, which Turnitin itself is fairly open about in its own blog posts on false positive rates.",
        ],
      },
      {
        id: "what-markwitness-actually-measures",
        heading: "What MarkWitness Actually Measures",
        body: [
          "MarkWitness does something narrower. It tests a piece of text against a specific statistical watermark, the green-list method described in the Kirchenbauer et al. research, under one or more keys.",
          "It's built for a different moment: a person checking their own writing, voluntarily, before it becomes a dispute. Nothing gets uploaded for the free check; the whole test runs in the browser.",
          "It doesn't estimate 'does this sound like AI'. It answers a smaller, more falsifiable question: did this exact statistical pattern turn up, under this exact key, more than chance predicts.",
        ],
      },
      {
        id: "the-accuracy-numbers-both-companies-publish",
        heading: "The Accuracy Numbers Both Sides Publish",
        body: [
          "Turnitin's own blog states a document-level false positive rate under 1%, for documents with over 20% AI writing, based on an 800,000-document test set. At sentence level, that figure rises to roughly 4%, with errors clustering at the seams between human and AI writing.",
          "MarkWitness's own positive-control test scored z > 8 (p < 1e-6) for marked text under the correct key, and chance-level under a wrong one. The live /verify page shows the same contrast publicly, with z = 20.45 against z = 0.1 on identical text.",
          "Both sets of numbers are genuine and worth reading, but they're not measuring the same thing, so resist the urge to rank them against each other on a single scale.",
        ],
      },
      {
        id: "where-turnitin-is-the-right-tool",
        heading: "Where Turnitin Is the Right Tool",
        body: [
          "If you're an institution needing to screen submitted work across a whole cohort, quickly and consistently, Turnitin's job is the right shape for that. It's built for scale and for integration into existing academic workflows.",
          "For a student, it's the tool that flags you in the first place, which is exactly why understanding its stated error rates matters before you panic about a result.",
        ],
      },
      {
        id: "where-markwitness-is-the-right-tool",
        heading: "Where MarkWitness Is the Right Tool",
        body: [
          "If you're an individual wanting to check your own writing, privately, before submitting it or before an appeal meeting, that's the job MarkWitness is built for. Nothing leaves your device for the free check.",
          "It's also useful proactively: a freelancer checking a draft before sending it to a client, or a journalist checking a piece before publication, rather than reacting to an accusation after the fact.",
        ],
      },
      {
        id: "why-they-are-not-really-competitors",
        heading: "Why They Are Not Really Competitors",
        body: [
          "Put simply: Turnitin screens other people's work on an institution's behalf. MarkWitness lets you check your own. That's not a subtle distinction; it's a different tool for a different person at a different stage.",
          "A genuine competitor to Turnitin would be another institutional classifier. MarkWitness has never tried to be that, and doesn't market itself as a Turnitin replacement anywhere.",
        ],
      },
      {
        id: "using-both-together-in-an-appeal",
        heading: "Using Both Together in an Appeal",
        body: [
          "In practice, the two work well as a pair. Turnitin's report tells you what got flagged and roughly how confident the classifier was. A MarkWitness check adds a separate, differently-built data point alongside your drafts and version history.",
          "Neither one, alone, should be the whole of an appeal. Together with your own process evidence, they make a more complete picture than either does by itself.",
          "Picture two situations side by side. A university needs to screen four hundred submitted essays overnight ahead of a marking deadline: that's Turnitin's job, applying one consistent classifier across every submission so staff can triage which pieces need a closer human look. Now picture a single student, already flagged, sitting down the evening before their appeal meeting with one essay and a few hours to prepare: that's MarkWitness's job, a private, on-device check of one document, run by the person who actually needs to know what a specific statistical pattern under a specific key does or doesn't show. Reach for something built like Turnitin when the question is 'across this whole cohort, what needs a closer look'. Reach for something built like MarkWitness when the question is narrower and personal: 'about this one piece of my own writing, what can I actually show'.",
        ],
      },
      {
        id: "the-honest-verdict",
        heading: "The Honest Verdict",
        body: [
          "Turnitin's published figures are genuinely low at the document level, and the company is unusually transparent about where its error rate rises. That's worth crediting. But a classifier estimating 'how AI-like is this style' was never designed to be the sole basis for a misconduct finding, and Turnitin doesn't claim it should be.",
          "That's the basis for the rating below: not whether Turnitin is accurate in general, but whether a bare verdict from it should be trusted standing alone.",
        ],
      },
    ],
    table: {
      caption: "Turnitin AI Writing Detection vs MarkWitness, side by side",
      headers: ["", "Turnitin AI Writing Detection", "MarkWitness"],
      rows: [
        ["What it measures", "General AI-writing style classifier", "A specific keyed statistical watermark"],
        ["Who it's built for", "Institutions screening submitted work", "Individuals checking their own writing"],
        ["Where it runs", "Institutional platform, uploaded documents", "Free check runs in your own browser"],
        ["Published accuracy figures", "Under 1% document-level FPR, around 4% sentence-level FPR (Turnitin's own blog)", "z > 8, p < 1e-6 under correct key; chance-level under wrong key (MarkWitness's own test)"],
        ["Best used as", "One institutional signal among several", "A personal, falsifiable data point"],
      ],
    },
    quote: {
      quote: "We're not trying to out-detect Turnitin. We're answering a much smaller question, did this specific pattern show up under this specific key, and we think a smaller, checkable question is more useful here than a bigger, fuzzier one.",
      attribution: "A MarkWitness detection engineer",
      role: "on how the two tools differ",
    },
    pitfalls: [
      "Assuming a MarkWitness 'no mark found' result overturns a Turnitin flag on its own. It doesn't; it's supporting evidence.",
      "Assuming Turnitin's percentage score is a lie-detector reading rather than a probability estimate with a published error rate.",
      "Comparing the two tools' numbers directly as if they measured the same thing. They don't, so the figures aren't interchangeable.",
      "Picking a side in what isn't really a rivalry, when the sensible move is usually to use both for what each is good at.",
    ],
    faq: [
      {
        question: "Is Turnitin reliable enough to trust on its own?",
        answer: "For document-level screening, Turnitin's own published false positive rate is under 1%, which is low. But its own figures also show a higher sentence-level error rate, around 4%, which is why it's not designed to be the sole basis for a misconduct finding.",
      },
      {
        question: "Should I use MarkWitness instead of Turnitin?",
        answer: "Not instead of, but alongside, for a different purpose. Turnitin screens submitted work for an institution; MarkWitness lets you check your own writing privately for a specific statistical watermark. They answer different questions.",
      },
      {
        question: "What's the real difference between a watermark checker and an AI detector?",
        answer: "A watermark checker like MarkWitness tests for one specific, keyed statistical pattern. A general AI detector like Turnitin's classifier estimates a probability based on writing style. One is a narrow, falsifiable test; the other is a broader, fuzzier estimate.",
      },
      {
        question: "Can MarkWitness results be used to challenge a Turnitin flag?",
        answer: "Yes, as supporting evidence alongside your drafts, version history and process notes, not as a standalone rebuttal. Appeals go further with a full evidence pack than with any single tool's result.",
      },
      {
        question: "Why does Turnitin's error rate rise so much at sentence level?",
        answer: "Because a single mis-flagged sentence in an otherwise correctly-cleared essay barely moves a document-level score, but it counts fully in a sentence-level one. Turnitin's own figures show sentence-level errors cluster near transitions between human and AI writing, where the classifier's style signals are genuinely more ambiguous, which is exactly why reading the flagged sentences individually, rather than trusting the headline percentage alone, is worth the extra few minutes.",
      },
    ],
    internalLinks: [
      { href: "/vs/turnitin-ai-detector", label: "MarkWitness vs Turnitin AI detector" },
      { href: "/check", label: "Try the free Check page" },
      { href: "/guide/ai-detection-false-positive", label: "Guide: AI detection false positives" },
      { href: "/for/university-students", label: "For university students" },
      { href: "/blog/turnitin-ai-false-positive-how-to-check", label: "How to check your own essay after a Turnitin flag" },
      { href: "/blog/complete-guide-appealing-ai-plagiarism-accusation", label: "The complete guide to appealing an AI accusation" },
    ],
    externalLinks: [
      { href: "https://www.turnitin.com/blog/understanding-false-positives-within-our-ai-writing-detection-capabilities", label: "Turnitin: understanding false positives (document level)" },
      { href: "https://www.turnitin.com/blog/understanding-the-false-positive-rate-for-sentences-of-our-ai-writing-detection-capability", label: "Turnitin: false positive rate for sentences" },
      { href: "https://www.k12dive.com/news/turnitin-false-positives-AI-detector/652221/", label: "K-12 Dive on Turnitin's false positive rates" },
      { href: "https://arxiv.org/abs/2301.10226", label: "Kirchenbauer et al., 'A Watermark for Large Language Models'" },
    ],
    schemaType: "Review",
    reviewRating: {
      itemName: "Turnitin AI Writing Detection",
      ratingValue: 3.2,
      bestRating: 5,
      summary: "Turnitin's own published false-positive figures are low at the document level but rise sharply at the sentence level, and the tool is not designed to be the sole basis for a misconduct finding.",
    },
  },
  {
    slug: "how-common-are-ai-detector-false-positives",
    title: "How Common Are AI Detector False Positives?",
    h1: "How Common Are AI Detector False Positives?",
    metaDescription: "How common are AI detector false positives really? We compare Turnitin, GPTZero and Originality.ai's own published accuracy figures.",
    category: "Academy",
    format: "data-study",
    intent: "informational",
    publishedAt: "2026-08-08",
    author: "MarkWitness Content Team",
    primaryKeyword: "ai detection false positive",
    supportingKeywords: [
      "ai detector false positive rate",
      "false positive ai writing detection",
      "how accurate are ai detectors",
      "ai detector accuracy comparison",
      "ai false positive rate by tool",
      "non-native english ai detection bias",
      "ai detector reliability data",
      "false positive ai classifier",
    ],
    longTailKeywords: [
      "why do ai detector false positive rates vary so much",
      "which ai detector has the lowest false positive rate",
      "are ai detectors biased against non-native english writers",
    ],
    heroImage: {
      src: "https://images.unsplash.com/photo-1666875753105-c63a6f3bdc86?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600",
      alt: "A researcher's desk covered in statistics and data charts, representing the study of AI detection false positive rates",
      unsplashId: "-WXQm_NTK0U",
    },
    intro: [
      "Ask five different tools for an AI detection false positive rate and you'll get five different numbers, measured five different ways.",
      "This piece lays the published figures side by side: Turnitin, GPTZero, Originality.ai, and the independent research on non-native English writers, and explains why a single 'X% accurate' headline rarely tells the whole story.",
      "The short version: methodology matters more than the number itself.",
    ],
    takeaways: [
      "'False positive rate' means different things depending on what level (document vs sentence) and what test set a company used.",
      "Turnitin's own blog reports under 1% at document level and around 4% at sentence level, on an 800,000-document test.",
      "GPTZero states a debiased approximately 1% false positive rate for ESL learners and 99% accuracy, but these are the vendor's own claims.",
      "Independent research (Liang et al.) found detectors studied were biased against non-native English writers, flagging their genuine writing as AI far more often than native writers' work.",
      "No published figure here is directly comparable to another: different tools, different tests, different definitions.",
    ],
    sections: [
      {
        id: "what-false-positive-actually-means-here",
        heading: "What 'False Positive' Actually Means Here",
        body: [
          "A false positive, in this context, is when a detector flags genuine human writing as AI-generated. It sounds simple. In practice, it depends heavily on what you're measuring, a whole document, or a single sentence, and what counted as 'genuinely human' in the test set to begin with.",
          "Those two choices alone can move a headline number by several percentage points, before you've even got to how the detector itself works.",
        ],
      },
      {
        id: "why-the-published-numbers-vary-so-much",
        heading: "Why the Published Numbers Vary So Much",
        body: [
          "Different companies test against different document sets, written by different people, in different contexts. A test built from clean native-English academic essays will produce a different error rate than one built from a mix of languages, writing levels and genres.",
          "The level of measurement matters just as much. A document-level false positive rate (did the whole essay get wrongly flagged) is almost always lower than a sentence-level one, because a single wrongly-flagged sentence in an otherwise correctly-cleared document doesn't move the document-level number at all.",
          "None of this means the numbers are dishonest. It means they're answering narrower questions than the marketing copy around them sometimes suggests.",
        ],
      },
      {
        id: "turnitins-own-figures",
        heading: "Turnitin's Own Figures",
        body: [
          "Turnitin has published two figures worth knowing. At document level, they report a false positive rate under 1%, specifically for documents where over 20% of the content was flagged as AI writing, based on an 800,000-document test set.",
          "At sentence level, their own figure is closer to 4%. They've also reported that errors aren't evenly spread: 54% of false-positive sentences sit right next to genuine AI-written text, at the point where styles change mid-document.",
          "Independent education press, including K-12 Dive, has covered Turnitin acknowledging these higher sentence-level rates publicly, which is worth noting as a point in favour of taking their own figures at face value.",
        ],
      },
      {
        id: "gptzero-and-originality-ai-vendor-claims",
        heading: "GPTZero and Originality.ai's Vendor Claims",
        body: [
          "GPTZero's own site states 99% accuracy, with a claimed 96.5% accuracy on mixed human/AI documents, and describes itself as de-biased for ESL learners with a stated false positive rate around 1% for that group specifically.",
          "Originality.ai's own site claims 97.8% accuracy for its multilingual model, citing peer-reviewed third-party studies, though the specific false positive rate isn't given on that page. Their FAQ acknowledges false positives happen and says the company shares figures in its own separate accuracy study.",
          "These are vendor-published claims. They're not necessarily wrong, but they're a different category of evidence from independently reviewed research, and it's worth reading them with that in mind.",
        ],
      },
      {
        id: "the-non-native-english-writer-bias-problem",
        heading: "The Non-Native English Writer Bias Problem",
        body: [
          "The most important independent finding here comes from Liang, Yuksekgonul, Mao, Wu and Zou, published on arXiv. They found that the detectors they studied consistently misclassified genuine writing by non-native English speakers as AI-generated, while accurately identifying native English writers' work.",
          "That's a bias problem hiding inside an otherwise reasonable-sounding accuracy figure. A tool can post a low overall false positive rate while still getting it wrong disproportionately for one group of writers, and an overall percentage won't show you that on its own.",
          "This is exactly the kind of thing worth checking for directly if you're a non-native English writer worried about a flag, rather than trusting a single headline number to cover your situation.",
        ],
      },
      {
        id: "the-comparison-table-and-its-limits",
        heading: "The Comparison Table, and Its Limits",
        body: [
          "The table below pulls these figures together in one place. Read the caption carefully: these are a mix of vendor-published claims and independent research, measured in different ways, on different test sets. They are not directly comparable, one line against another, as if they were competing scores in the same race.",
          "What they're useful for is spotting the pattern across all of them: every serious source here, including the vendors themselves, acknowledges that false positives happen. None claims perfection. That consistency, across otherwise very different numbers, is arguably the most trustworthy thing in the table.",
        ],
      },
      {
        id: "how-a-watermark-check-differs-from-all-of-this",
        heading: "How a Watermark Check Differs From All of This",
        body: [
          "Everything above concerns style-based classifiers: tools estimating whether writing sounds AI-generated. A statistical watermark check, like MarkWitness's, is a different kind of measurement entirely: it tests for a specific, keyed pattern, not a style.",
          "In its own positive-control test, MarkWitness's check scored z > 8 (p < 1e-6) for correctly-keyed marked text, and chance-level for the same text under a different key, numbers that come from a testable statistical procedure rather than a trained style classifier's probability estimate.",
          "That doesn't make it immune to false positives in some looser sense; it makes a different kind of claim altogether, so it doesn't belong on the same comparison line as a style classifier's accuracy figure.",
        ],
      },
      {
        id: "reading-any-single-number-responsibly",
        heading: "Reading Any Single Number Responsibly",
        body: [
          "If you take one thing from all this, let it be a habit: whenever you see a detector's accuracy or false positive figure quoted, ask what it was measured against, at what level, and whether it's the vendor's own claim or someone else's independent study.",
          "A number without that context is a headline, not evidence. With it, you can actually judge whether it applies to your situation.",
        ],
      },
    ],
    table: {
      caption: "AI detection false positive figures, as published by each source: vendor claims and independent research mixed, not directly comparable",
      headers: ["Source", "Claimed / measured figure", "Level / context"],
      rows: [
        ["Turnitin (own blog)", "Under 1%", "Document-level, documents with over 20% AI writing, 800,000-document test"],
        ["Turnitin (own blog)", "Approximately 4%", "Sentence-level, more common at human/AI transitions"],
        ["GPTZero (own site)", "Approximately 1%", "Vendor-stated, for ESL writers specifically, after de-biasing work"],
        ["GPTZero (own site)", "99% accuracy / 96.5% on mixed documents", "Vendor-stated overall accuracy claims"],
        ["Originality.ai (own site)", "97.8% accuracy claimed", "Vendor-stated, multilingual model; specific FPR not published on that page"],
        ["Liang et al., arXiv 2304.02819", "Detectors studied were biased against non-native English writers", "Independent research finding, not a single percentage"],
      ],
    },
    quote: {
      quote: "Every one of these numbers is true, and none of them are interchangeable. A document-level rate and a sentence-level rate answer different questions, even from the same company.",
      attribution: "A MarkWitness detection engineer",
      role: "on comparing published accuracy figures",
    },
    pitfalls: [
      "Quoting one vendor's headline accuracy number as if it applies to every kind of document and every kind of writer.",
      "Ignoring the difference between document-level and sentence-level false positive rates when they come from the very same source.",
      "Treating a vendor's own published figure as equivalent to independent, peer-reviewed research, when the two carry different weight.",
      "Forgetting that non-native English writers have been shown, in independent research, to be flagged more often, a bias a single 'accuracy' number hides.",
    ],
    faq: [
      {
        question: "Which AI detector has the lowest false positive rate?",
        answer: "There's no single honest answer, because the published figures aren't measured the same way. Turnitin's document-level figure is under 1%, GPTZero claims around 1% for ESL writers specifically, and Originality.ai doesn't publish a specific figure on its main site. Comparing them directly would be comparing different tests, not different tools.",
      },
      {
        question: "Why do AI detector false positive rates vary so much between tools?",
        answer: "Mostly because of what's being measured: document-level versus sentence-level, the makeup of the test set, and whether the figure is a vendor's own claim or independently verified research.",
      },
      {
        question: "Are AI detectors biased against non-native English writers?",
        answer: "Independent research by Liang et al. found the detectors they studied did misclassify non-native English writers' genuine work as AI-generated more often than native writers' work. Some vendors, including GPTZero, now publish separate de-biasing claims for this group.",
      },
      {
        question: "Is a 99% accuracy claim the same thing as a 1% false positive rate?",
        answer: "No, and this trips a lot of people up. Overall accuracy blends false positives and false negatives together across a whole test set; a false positive rate looks specifically at how often genuine human writing gets wrongly flagged. The two numbers can move independently of each other.",
      },
    ],
    internalLinks: [
      { href: "/guide/ai-detection-false-positive", label: "Guide: AI detection false positives" },
      { href: "/for/non-native-english-writers", label: "For non-native English writers" },
      { href: "/vs/gptzero", label: "MarkWitness vs GPTZero" },
      { href: "/vs/originality-ai", label: "MarkWitness vs Originality.ai" },
      { href: "/check", label: "Try the free Check page" },
      { href: "/blog/per-language-ai-detection-accuracy", label: "Per-language AI detection accuracy, compared" },
    ],
    externalLinks: [
      { href: "https://www.turnitin.com/blog/understanding-false-positives-within-our-ai-writing-detection-capabilities", label: "Turnitin: understanding false positives (document level)" },
      { href: "https://www.turnitin.com/blog/understanding-the-false-positive-rate-for-sentences-of-our-ai-writing-detection-capability", label: "Turnitin: false positive rate for sentences" },
      { href: "https://gptzero.me", label: "GPTZero's own accuracy claims" },
      { href: "https://originality.ai", label: "Originality.ai's own accuracy claims" },
      { href: "https://arxiv.org/abs/2304.02819", label: "Liang et al., 'GPT detectors are biased against non-native English writers'" },
    ],
    schemaType: "none",
  },
]
