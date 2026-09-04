import type { BlogPost } from './blog-types'

export const BLOG_POSTS_C: BlogPost[] = [
  {
    slug: 'how-to-use-the-markwitness-api',
    title: 'How to Use the MarkWitness API to Check AI Marks',
    h1: 'How to Use the MarkWitness API to Check AI Marks',
    metaDescription:
      'Learn how to call the MarkWitness AI detector API: get a key, send a request, read the response, and handle errors.',
    category: 'Academy',
    format: 'how-to',
    intent: 'transactional',
    publishedAt: '2026-08-10',
    author: 'MarkWitness Content Team',
    primaryKeyword: 'ai detector api',
    supportingKeywords: [
      'markwitness api',
      'ai watermark api',
      'api key for ai detection',
      'post /api/v1/check',
      'mcp server ai detection',
      'check_document tool',
      'ai provenance api',
      'metered ai detection api',
      'json api ai watermark',
      'developer ai detector',
    ],
    longTailKeywords: [
      'how to call the markwitness api',
      'integrate ai watermark check into a pipeline',
      'check_document mcp tool example',
    ],
    heroImage: {
      src: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600',
      alt: "A developer's laptop showing code on screen, illustrating how to call the MarkWitness AI detector API",
      unsplashId: 'm_HRfLhgABo',
    },
    intro: [
      "Editorial pipelines need proof of provenance before a document goes out the door, and checking that by hand doesn't scale.",
      'The MarkWitness API lets you call the same green-list watermark check that powers the Check page, straight from your own code or an agent workflow, using an ai detector api built for that exact job.',
      'This guide walks through generating a key, sending your first request to /api/v1/check, reading the response, handling errors, and understanding the 2p-per-1,000-words metering, plus where the MCP server fits for agent callers.',
    ],
    takeaways: [
      'Generate an API key from your account dashboard before you write any code.',
      'Every check is a POST to /api/v1/check with a Bearer token in the Authorization header.',
      "The response includes signal strength, a confidence band, a per-passage breakdown, and the method's stated limits.",
      'Checks are metered at 2p per 1,000 words; a 402 response tells you exactly which limit you hit.',
      "If the usage ledger is down, the API returns 503 rather than serving a free, unbilled check.",
      "Agent-based callers can use the MCP server's check_document and describe_method tools instead of raw HTTP.",
    ],
    sections: [
      {
        id: 'step-1-create-an-account-and-generate-an-api-key',
        heading: 'Step 1: Create an account and generate an API key',
        body: [
          'Start on the Pricing page and sign up for a Pro account, because the API and MCP server sit behind that tier, metered separately at 2p per 1,000 words on top of the subscription.',
          "Once you're in, open the API keys panel in your dashboard and generate a new key. It will look something like mw_live_9f2..., so copy it once and store it somewhere safe, because MarkWitness won't show you the full string again.",
          'Treat the key like a password. If it ever ends up in a public repository or a client-side bundle, revoke it from the dashboard immediately and generate a fresh one.',
        ],
      },
      {
        id: 'step-2-send-your-first-request-to-post-api-v1-check',
        heading: 'Step 2: Send your first request to POST /api/v1/check',
        body: [
          'Every check goes through one endpoint: POST /api/v1/check. Set the Authorization header to Bearer mw_live_your_key_here, and send a JSON body with the document text and a language code: en, es, fr, de or pt.',
          "A minimal request might carry just two fields: text and language. The API doesn't care whether the call comes from a script, a CI job, or an agent, since it treats every caller the same way.",
          "Unlike the free Check page, there's no 1,500-word ceiling here. The API is metered instead, so longer documents simply cost more, billed per 1,000 words.",
        ],
      },
      {
        id: 'step-3-read-the-response-signal-strength-and-confidence-band',
        heading: 'Step 3: Read the response, covering signal strength, confidence band and passage breakdown',
        body: [
          "A successful call returns a JSON object with a headline signal strength figure and a confidence band around it, exactly as you'd see on the Check page or in the evidence report PDF.",
          'Below that sits a per-passage breakdown, an array showing how the signal varied across the document, which matters because a mark can be strong in one section and absent in another if text was mixed or edited unevenly.',
          "The response also carries a limits array: short strings stating the method's own caveats, including that a detected mark is not proof of authorship and an absent mark is not proof of human authorship. Build your integration to surface these, not just the headline number.",
          'For a concrete sense of the shape, a typical response looks roughly like a top-level object carrying a signal strength figure between 0 and 100, a confidence band object giving a lower and upper bound around that figure, a passages array where each entry carries its own local signal strength alongside the character range it covers, and the limits array of short caveat strings described above. Parsing this once, into a typed struct or interface in your own codebase, then reusing it everywhere you call the endpoint saves you from re-deriving the shape from raw JSON on every integration. Treat the top-level signal strength as a headline for humans, and treat the passages array as the thing your automation actually reasons over, because that is where uneven or mixed-origin text shows up first.',
        ],
      },
      {
        id: 'step-4-handle-401-402-400-and-405-responses',
        heading: 'Step 4: Handle the 401, 402, 400 and 405 responses',
        body: [
          "A 401 means your Authorization header is missing, malformed, or the key has been revoked. Check the header format first, since it's the most common integration mistake.",
          "A 402 means you've hit a usage or billing limit. The response names the exact limit you hit, so your error handling can tell a user precisely what to do next, rather than showing a generic failure.",
          'A 400 means the request body itself was malformed: a missing text field, an unsupported language code, or invalid JSON. A 405 means you called the endpoint with the wrong HTTP method; /api/v1/check only accepts POST.',
        ],
      },
      {
        id: 'step-5-understand-the-metering-and-the-503-refusal',
        heading: 'Step 5: Understand the 2p-per-1,000-words metering and the 503 refusal',
        body: [
          "Billing is straightforward: 2p per 1,000 words checked, tracked against a usage ledger tied to your account. There's no separate free tier on the API itself. Pro unlocks access, and metering covers usage from there.",
          "If that usage ledger is ever unavailable, the API returns 503 rather than quietly serving the check for free. That's a deliberate choice: MarkWitness refuses to give away a result it can't bill correctly, instead of guessing.",
          "Design your integration to retry a 503 with backoff, the same way you'd treat any other transient outage, because it usually clears within minutes.",
          'In practice that means treating a 503 the way you would any other transient failure: wait a second, retry, and if it fails again, double the wait before the next attempt, capping out after four or five tries rather than retrying forever. A short jitter added to each wait, a few hundred milliseconds picked at random, stops every client in a busy pipeline from hammering the endpoint at exactly the same instant once the ledger recovers. Most outages clear well inside that window, so a caller with backoff built in rarely needs to surface the failure to a human at all, while a caller without it risks turning a brief, minutes-long blip into a support ticket.',
        ],
      },
      {
        id: 'step-6-call-it-from-an-agent-the-mcp-server',
        heading: "Step 6: Call it from an agent, using the MCP server's check_document and describe_method tools",
        body: [
          'For agent-based callers, raw HTTP is not always the natural fit. The MCP server exposes the same functionality as two tools: check_document, which runs the watermark check on a passed-in document, and describe_method, which returns the method\'s description and stated limits as structured data.',
          'That second tool matters more than it sounds. An agent that needs to disclose provenance before handing off a document, whether to an editor, a client, or a downstream system, can call describe_method first to fetch the exact limits language, rather than paraphrasing it and risking a claim the method does not support.',
          'Wire check_document into any workflow where an agent produces or forwards text and needs a documented, falsifiable check attached before that handoff happens.',
        ],
      },
    ],
    table: {
      caption: 'MarkWitness API responses at a glance',
      headers: ['Status', 'Meaning', 'What to do'],
      rows: [
        ['200', 'Check completed successfully', 'Read signal strength, confidence band and the limits array'],
        ['400', 'Malformed request body', 'Validate your JSON before sending; check required fields'],
        ['401', 'Missing or invalid API key', 'Confirm the Authorization: Bearer header is set correctly'],
        ['402', 'Usage or billing limit reached', 'Read the named limit in the response and top up or wait for reset'],
        ['405', 'Wrong HTTP method used', 'Use POST for /api/v1/check, not GET'],
        ['503', 'Usage ledger unavailable', 'Retry later; the API refuses to serve an unmetered check'],
      ],
    },
    quote: {
      quote:
        "We built the API to fail loudly rather than fail cheap. If we can't bill a check correctly, we'd rather return a 503 than hand back a result nobody can account for.",
      attribution: 'A MarkWitness detection engineer',
      role: 'on why the API returns 503 instead of a free check',
    },
    pitfalls: [
      'Hard-coding the API key into client-side code where anyone can read it.',
      'Ignoring the confidence band and treating signal strength as a single yes/no verdict.',
      'Retrying a 402 immediately instead of checking which limit was actually hit.',
      'Assuming a 200 response means "definitely human" or "definitely AI." It never does.',
    ],
    faq: [
      {
        question: 'Do I need a paid plan to use the API at all?',
        answer:
          'Yes. The API and MCP server are part of the Pro plan at £19 a month, and usage is metered on top of that at 2p per 1,000 words. The free tier covers the Check page, not programmatic access.',
      },
      {
        question: 'What does the per-passage breakdown actually show?',
        answer:
          "It shows how the signal varies across the document, section by section, rather than collapsing everything into one number. That's useful when a document is a patchwork of part original, part quoted, part edited content, because the mark can behave differently in each part.",
      },
      {
        question: 'Can I use the API for languages other than English?',
        answer:
          'Yes. All five supported languages (English, Spanish, French, German and Portuguese) work the same way through the API, each scored against its own measured reference baseline rather than an English one applied elsewhere.',
      },
      {
        question: 'How do I integrate check_document into an agent pipeline?',
        answer:
          "Call it at the point where your agent is about to hand a document off, whether to a publishing step, a client delivery, or another system, and attach the result alongside the output. Pairing it with describe_method keeps the disclosed limits accurate rather than paraphrased.",
      },
      {
        question: 'What should my retry logic actually look like for a 503?',
        answer:
          "Use exponential backoff with a small jitter rather than a fixed delay: wait a second, then two, then four, adding a few hundred milliseconds of randomness each time, and give up after four or five attempts rather than retrying indefinitely. Because the ledger is the thing that's unavailable, not the check itself, a 503 almost always resolves within that window, and it never means the endpoint mis-scored your document.",
      },
    ],
    internalLinks: [
      { href: '/docs/api', label: 'Full API reference' },
      { href: '/docs/mcp', label: 'MCP server documentation' },
      { href: '/pricing', label: 'Pro plan pricing' },
      { href: '/method', label: 'How the method works' },
      { href: '/blog/what-is-an-ai-watermark-detector', label: 'What is an AI watermark? How detection works' },
      { href: '/blog/green-list-watermarking-explained', label: 'Green-list watermarking: the stats behind AI marks' },
    ],
    externalLinks: [
      { href: 'https://arxiv.org/abs/2301.10226', label: 'Kirchenbauer et al., "A Watermark for Large Language Models"' },
      { href: 'https://www.nist.gov/itl/ai-risk-management-framework', label: 'NIST AI Risk Management Framework' },
      { href: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai', label: 'European Commission: regulatory framework for AI' },
    ],
    schemaType: 'HowTo',
  },
  {
    slug: 'complete-guide-appealing-ai-plagiarism-accusation',
    title: 'The Complete Guide to Appealing an AI Accusation',
    h1: 'The Complete Guide to Appealing an AI Accusation',
    metaDescription:
      'How to appeal an AI detection false positive: the strongest evidence, how to write the letter, and what happens next.',
    category: 'Academy',
    format: 'skyscraper',
    intent: 'informational',
    publishedAt: '2026-08-11',
    author: 'MarkWitness Content Team',
    primaryKeyword: 'ai detection false positive appeal',
    supportingKeywords: [
      'appeal ai plagiarism accusation',
      'false positive ai detector appeal',
      "prove you didn't use ai",
      'ai accusation evidence',
      'academic integrity appeal ai',
      'turnitin false positive appeal',
      'how to appeal ai flag',
      'ai detector evidence report',
      'drafting history proof',
    ],
    longTailKeywords: [
      'how to appeal an ai plagiarism accusation',
      'evidence to prove you wrote an essay yourself',
      'what to say in an ai false positive appeal letter',
    ],
    heroImage: {
      src: 'https://images.unsplash.com/photo-1589994965851-a8f479c573a9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600',
      alt: 'A statue of Lady Justice holding scales, representing an appeal against an AI detection false positive',
      unsplashId: 'yCdPU73kGSc',
    },
    intro: [
      'An AI accusation lands like a punch. You know you wrote the work, but proving a negative feels impossible, and the clock is often already running.',
      'This guide sets out exactly how to build and present an ai detection false positive appeal, from the strongest evidence down to the weakest, and how to word the letter itself.',
      "It's built on what actually persuades panels, editors and clients, not on arguing about the tool in the abstract, but on producing dated, corroborating proof.",
    ],
    takeaways: [
      'The strongest evidence is timestamped and was created before the accusation, not after.',
      'Drafting history and version control beat a verbal promise every time.',
      'A MarkWitness evidence report is a corroborating artefact, not proof on its own.',
      "Ask the accuser to disclose their own tool's stated false-positive rate, since most publish one.",
      "Don't argue about AI detection in the abstract; present evidence specific to your document.",
      'Act within days, not weeks, because draft history degrades and memories fade.',
    ],
    sections: [
      {
        id: 'how-ai-accusations-actually-happen',
        heading: 'How an AI accusation actually happens',
        body: [
          'Institutions and clients are running more work through detectors than they used to, often as a routine step rather than a suspicion. Most of the time nothing comes of it.',
          "But detectors make mistakes in both directions, and the mistakes aren't evenly spread. Research on detector bias has found that tools studied consistently misclassified non-native English writing as AI-generated, while judging native writing accurately.",
          "That's the backdrop against which most accusations land: a flag from a tool with a real, published error rate, dropped onto a person who now has to prove something negative under time pressure.",
        ],
      },
      {
        id: 'the-evidence-hierarchy-what-actually-persuades',
        heading: 'The evidence hierarchy: what actually persuades a panel',
        body: [
          "Not all evidence is equal, and treating it as if it were is the single biggest mistake people make. A panel, editor or client is weighing plausibility, and plausibility rises sharply with anything independently timestamped.",
          'The table further down ranks the common types from strongest to weakest. As a rule of thumb: evidence created before the accusation existed beats evidence created after it, and evidence a third party can verify beats evidence only you can vouch for.',
          'Build your response around the top of that hierarchy first. Weaker evidence still has a place, but only as a supporting note, not the headline.',
        ],
      },
      {
        id: 'strongest-evidence-drafting-history-and-version-control',
        heading: 'Strongest evidence: drafting history and version control',
        body: [
          "Google Docs version history, Word's track changes, and Git commit logs all do the same job: they show a document forming over time, with timestamps you didn't set yourself.",
          'If you write in Docs, use File > Version history > See version history and export or screenshot the timeline showing edits spread across sessions. If you write in Git, a commit log with real timestamps tells the same story for code or long-form drafts.',
          "This evidence is strong precisely because it's hard to fake after the fact. A single pasted block with no history looks very different from a document that grew in visible stages.",
        ],
      },
      {
        id: 'timestamped-notes-outlines-and-research-trails',
        heading: 'Timestamped notes, outlines and research trails',
        body: [
          'An outline written the week before a deadline, a citation manager export, or a folder of source PDFs you annotated: all of these show your thinking developing, not just your typing.',
          'Emails or messages to a tutor, editor or collaborator discussing the piece as you wrote it add a second, independent timestamp to the same story.',
          "None of this is as strong as full version history on its own, but stacked together it builds a case that's hard to dismiss.",
        ],
      },
      {
        id: 'where-a-provenance-mark-check-fits-in',
        heading: 'Where a provenance-mark check and evidence report fit in',
        body: [
          "A MarkWitness evidence report is a dated PDF: signal strength with a confidence band, a per-passage breakdown, the method's stated limits, which keys were tested, and a SHA-256 hash of the document you checked.",
          'That last detail matters for an appeal, because it lets you prove later that the report matches the exact file in question, not a different draft.',
          "Be honest about what it shows. An absent mark under the keys MarkWitness holds is not proof of human authorship, because no vendor publishes its detection key, so 'no mark detected' always means 'under the keys we hold', never 'this document is clean'. Present it as one dated, corroborating artefact in a wider evidence pack, not as the deciding exhibit.",
        ],
      },
      {
        id: 'writing-the-appeal-letter-tone-and-structure',
        heading: 'Writing the appeal letter: tone and structure',
        body: [
          'Keep it short and factual. State the accusation as it was put to you, state your position clearly in one sentence, then attach your evidence in order of strength with a line explaining each item.',
          "Ask specific questions rather than making general objections. Which tool was used? What threshold triggered the flag? What is that tool's own published false-positive rate, at document level and at sentence level? Most detector vendors publish exactly this.",
          "Avoid emotional language, even if you're frustrated (and most people are). A calm, evidence-led letter reads as more credible than an angry one, and it's easier for the person on the other end to act on.",
        ],
      },
      {
        id: 'what-not-to-do',
        heading: 'What not to do',
        body: [
          "Don't argue about AI detection in the abstract. Debating whether detectors are reliable in general doesn't help your specific case; presenting your specific evidence does.",
          "Don't wait. Draft history in some tools ages out, memories fade, and a prompt response looks more credible than one filed weeks later.",
          "Don't delete or heavily edit your draft history after the accusation lands, even to tidy it up. It can look like you're removing evidence, and it may genuinely remove the evidence that would have helped you most.",
        ],
      },
      {
        id: 'what-happens-after-you-submit-the-appeal',
        heading: 'What happens after you submit the appeal',
        body: [
          'Outcomes vary. Some appeals are accepted outright once the evidence is reviewed. Others are partially accepted, where a grade or fee is adjusted rather than fully restored. Some are rejected.',
          "If it's rejected, ask what would have changed the outcome, and whether there's a further stage, since many universities have a formal academic integrity process beyond the first review, and the International Center for Academic Integrity publishes standards that some institutions follow.",
          "For freelance or client disputes, a rejection is often where a contract's dispute clause becomes relevant, or where small-claims or platform-mediation routes come in. Keep every piece of evidence regardless of outcome, because a rejected first appeal isn't always the end of the process.",
        ],
      },
    ],
    table: {
      caption: 'Evidence strength for an AI accusation appeal',
      headers: ['Evidence type', 'Typical strength', 'Why'],
      rows: [
        ['Version history / Git commits with timestamps', 'Strong', 'Independently timestamped and created before the accusation existed'],
        ['Timestamped outline or research notes', 'Strong', 'Shows the thinking process over time, hard to fabricate retroactively'],
        ['MarkWitness evidence report (dated, hashed)', 'Moderate, corroborating', 'Documents a specific test on a specific document, but is a diagnostic, not proof of authorship on its own'],
        ['Emails or messages discussing drafts with an editor/tutor', 'Moderate', 'Third-party corroboration, though not created for this exact purpose'],
        ['A verbal assurance alone', 'Weak', 'Not independently verifiable and easy to dismiss'],
      ],
    },
    quote: {
      quote:
        "The strongest appeals I see don't argue about detectors at all. They put a folder of dated evidence on the table and let it speak.",
      attribution: 'A university academic integrity officer',
      role: 'describing a typical case, speaking generally',
    },
    pitfalls: [
      'Treating the appeal as a debate about AI detection theory instead of a presentation of your own evidence.',
      'Editing or deleting old drafts before submitting the appeal, which removes the very evidence that helps you.',
      'Sending a long, emotional letter instead of a short, factual one with attachments.',
      'Waiting weeks to respond while draft history and memories fade.',
      'Assuming an absent watermark alone proves human authorship, when it only proves "no mark under the keys tested."',
    ],
    faq: [
      {
        question: "What's the single best piece of evidence to attach to an appeal?",
        answer:
          "Timestamped version history, such as Google Docs' version history or a Git commit log, because it's independently dated and shows the document forming over time, which is hard to fabricate after the fact.",
      },
      {
        question: 'Can a MarkWitness report win an appeal on its own?',
        answer:
          "No, and it shouldn't be presented that way. It's a dated, hashed diagnostic, useful as corroboration alongside drafting history, not a standalone verdict. The method's own stated limits say as much.",
      },
      {
        question: 'What should I ask the person who accused me?',
        answer:
          'Ask which tool was used, what threshold triggered the flag, and what that tool\'s own published false-positive rate is, at both document and sentence level. A specific answer tells you far more than a general one.',
      },
      {
        question: 'How long do I have to appeal an AI plagiarism accusation?',
        answer:
          'It varies by institution or client, so check the specific policy or contract first. As a general rule, respond as early as you reasonably can, because draft history and memory both fade with time.',
      },
    ],
    internalLinks: [
      { href: '/guide/ai-detection-false-positive', label: 'AI detection false positives, explained' },
      { href: '/guide/prove-you-wrote-it', label: 'How to prove you wrote something yourself' },
      { href: '/limits', label: "What MarkWitness can and can't tell you" },
      { href: '/check', label: 'Run a free check' },
      { href: '/blog/turnitin-ai-false-positive-how-to-check', label: 'Turnitin flagged you? How to check your own essay' },
      { href: '/blog/how-common-are-ai-detector-false-positives', label: 'How common are AI detector false positives?' },
    ],
    externalLinks: [
      { href: 'https://arxiv.org/abs/2304.02819', label: 'Liang et al., "GPT detectors are biased against non-native English writers"' },
      { href: 'https://academicintegrity.org', label: 'International Center for Academic Integrity' },
      { href: 'https://www.turnitin.com/blog/understanding-false-positives-within-our-ai-writing-detection-capabilities', label: 'Turnitin: document-level false positive rate' },
      { href: 'https://www.turnitin.com/blog/understanding-the-false-positive-rate-for-sentences-of-our-ai-writing-detection-capability', label: 'Turnitin: sentence-level false positive rate' },
    ],
    schemaType: 'none',
  },
  {
    slug: 'freelance-writers-losing-contracts-ai-detector-errors',
    title: 'Freelancers Are Losing Contracts to Detector Errors',
    h1: 'Freelancers Are Losing Contracts to Detector Errors',
    metaDescription:
      "Clients are running freelance copy through AI detectors before paying. Here's why, the real false-positive numbers, and how to protect yourself.",
    category: 'News',
    format: 'case-study',
    intent: 'informational',
    publishedAt: '2026-08-11',
    author: 'MarkWitness Content Team',
    primaryKeyword: 'turnitin ai false positive',
    supportingKeywords: [
      'freelance writer ai detector',
      'client running ai detector on freelance work',
      'ai false positive contract dispute',
      'content agency ai screening',
      'freelance writer losing contract ai flag',
      'ai detection bias freelance writers',
      'protect freelance income ai detector',
    ],
    longTailKeywords: [
      'ai detector false positive freelance writer',
      'client flagged my article as ai written',
      'contract clause for ai detection disputes',
    ],
    heroImage: {
      src: 'https://images.unsplash.com/photo-1773332585687-85beb4da71ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600',
      alt: "A freelance writer's home office desk with a laptop, representing a Turnitin AI false positive costing a freelancer their contract",
      unsplashId: '8UnGiO4yesk',
    },
    intro: [
      "Copy gets rejected. Invoices get delayed. And increasingly, the reason given is a red flag from an AI detector, not a complaint about the writing itself.",
      "A turnitin ai false positive isn't just a student's problem anymore. Content agencies and individual clients are running freelance copy through the same class of tool before they'll pay, and the errors travel with it.",
      "Here's how the practice grew, why it escalates disputes so fast, and what a freelancer can actually do about it, starting with habits, not confrontation.",
    ],
    takeaways: [
      'Clients and agencies increasingly screen freelance copy with AI detectors before releasing payment.',
      'These are the same detectors that produce a measurable false-positive rate on genuine human writing.',
      'Non-native English writers face a disproportionate share of wrongful flags, per published research.',
      'A contract clause naming an agreed detector and threshold heads off disputes before they start.',
      'Keeping drafting history as a routine habit is cheaper than reconstructing it after a dispute.',
      'A dated provenance-mark check can support your case without pretending to be a verdict.',
    ],
    sections: [
      {
        id: 'a-composite-case-the-invoice-that-didnt-get-paid',
        heading: "A composite case: the invoice that didn't get paid",
        body: [
          'Picture a freelance copywriter, call her typical of dozens of similar cases rather than any one real person, who delivered twelve blog articles to a content agency on a monthly retainer.',
          "Eleven were approved without comment. The twelfth came back with a note: the agency's AI detector had flagged three paragraphs, and payment for that piece would wait until it was 'resolved'.",
          "She hadn't used AI for any of it. But she also had no drafting history saved, no contract clause covering the situation, and a client who now wanted proof before releasing money already earned.",
        ],
      },
      {
        id: 'why-clients-are-screening-freelance-copy-now',
        heading: 'Why clients are screening freelance copy now',
        body: [
          'The volume of AI-assisted writing online has made buyers nervous: about search penalties, about brand risk, about paying for work a client themselves might later be embarrassed by.',
          'Running a detector before payment is cheap and fast compared with the cost of a bad piece slipping through, so agencies increasingly build it into their workflow as a routine gate, not a special measure reserved for suspicious cases.',
          "Growing regulatory attention to AI provenance, including the EU AI Act's disclosure expectations, is nudging some clients toward more caution generally, even where the specific rules don't yet apply directly to a given piece of freelance copy.",
        ],
      },
      {
        id: 'why-these-disputes-escalate-so-fast',
        heading: 'Why these disputes escalate so fast',
        body: [
          'When a grade is on the line, the stakes feel serious but abstract. When an invoice is on the line, the stakes are immediate and financial, and that changes the tone of the conversation fast.',
          "Most freelance contracts say nothing about AI detection at all, so there's no agreed process to fall back on when a flag appears, just a client holding the money and a writer holding an objection.",
          "Without a shared reference point, both sides end up arguing about the detector itself, rather than about the actual piece of writing in question.",
        ],
      },
      {
        id: 'the-real-false-positive-numbers-behind-the-risk',
        heading: 'The real false-positive numbers behind the risk',
        body: [
          'Turnitin, one of the most widely used AI-writing detectors, states a document-level false-positive rate of under 1% for documents with over 20% AI writing, based on an 800,000-document test set: a low rate, but not a zero one.',
          'At sentence level, Turnitin states a false-positive rate of roughly 4%, and notes these are more common right at the transitions between human- and AI-written text, exactly the kind of boundary that appears in edited freelance copy.',
          "Bias compounds the risk unevenly. Liang et al.'s research on detector bias found that tools studied consistently misclassified non-native English writing as AI-generated, while accurately judging native writing, a real finding that matters directly for the many freelance writers working in a second language.",
        ],
      },
      {
        id: 'contract-clauses-that-protect-you',
        heading: 'Contract clauses that protect you before you ever get flagged',
        body: [
          'Name the actual detection method in the contract before work starts, along with what threshold triggers a review and what happens next, rather than leaving it to be decided in the moment a flag appears.',
          'Build in a right to respond: a fixed window to provide evidence before payment can be withheld indefinitely, rather than an open-ended hold.',
          "Agree who pays for any additional verification step. If a client wants a detector run as standard practice, that's a reasonable ask, but it should be agreed up front, not sprung on an approved, delivered piece.",
          "A clause that actually holds up in a dispute tends to read something like this: the piece will be checked against a single named tool, at a stated threshold, within a fixed number of business days of delivery, and a result below that threshold closes the matter without further comment. If it's flagged, the writer gets a fixed window, five working days is common, to supply supporting evidence such as drafting history or a provenance-mark report, and the agency responds in writing rather than leaving the invoice open indefinitely. What matters most is precision: a clause that just says work must pass AI detection as a blanket condition invites exactly the kind of dispute described above, because neither side knows in advance which tool, which threshold, or which process applies.",
        ],
      },
      {
        id: 'making-drafting-history-a-habit-not-a-scramble',
        heading: 'Making drafting history a habit, not a scramble',
        body: [
          "Turn on version history in whatever tool you write in, and leave it on. It costs nothing and it's the single most persuasive piece of evidence if a dispute ever arrives.",
          "Keep research notes, outlines and source links in a dated folder per project, even for short pieces. It feels like overkill until the day it isn't.",
          'This is a habit, not a reaction. Reconstructing a drafting history after the fact is far harder than simply not deleting the one you already had.',
        ],
      },
      {
        id: 'when-to-reach-for-a-provenance-mark-check',
        heading: 'When to reach for a provenance-mark check',
        body: [
          'If a piece is flagged, running it through the free Check page costs nothing and takes a couple of minutes, checking up to 1,500 words entirely in the browser, with nothing uploaded anywhere.',
          'For a formal dispute, the Pro evidence report adds more weight: a dated PDF with signal strength, a confidence band, a per-passage breakdown, and a SHA-256 hash tying the report to the exact file in question.',
          'Treat it as one piece of a wider case, alongside drafting history, not a single document that settles the argument by itself. See our guide on proving you wrote something yourself for how to put the whole case together.',
        ],
      },
    ],
    table: {
      caption: 'What the published false-positive numbers actually say',
      headers: ['Source', 'Measurement', 'Stated figure'],
      rows: [
        ['Turnitin (document-level)', 'Documents with over 20% AI writing, 800,000-document test set', 'Under 1% false positive rate'],
        ['Turnitin (sentence-level)', 'Individual sentences, often at human/AI transitions', 'Approximately 4% false positive rate'],
        ['Liang et al. (arXiv 2304.02819)', 'Detectors tested against non-native English writing samples', 'Consistently misclassified as AI-generated'],
      ],
    },
    quote: {
      quote:
        "The clients who get this right agree the process before any work starts, not after a flag. The ones who don't end up arguing about a percentage instead of the piece.",
      attribution: 'A freelance writer advocate',
      role: 'describing a typical dispute, speaking generally',
    },
    pitfalls: [
      'Signing a contract that never mentions AI detection, then discovering a policy applied unilaterally at payment time.',
      'Turning off version history to save space, then having nothing to show when a piece is flagged.',
      'Treating a single flagged sentence as proof of the whole piece being AI-written.',
      "Escalating straight to argument instead of asking the client to name their tool and its stated false-positive rate.",
    ],
    faq: [
      {
        question: 'Can a client legally withhold payment over an AI detector flag?',
        answer:
          "It depends entirely on the contract. If nothing was agreed about AI detection, you're in genuinely disputed territory, which is exactly why naming a process in the contract up front is worth the five minutes it takes.",
      },
      {
        question: "What's a reasonable ai detector false positive freelance writer clause to ask for?",
        answer:
          "Something that names the tool and threshold if one will be used, gives you a fixed window to respond with evidence before payment is withheld, and states that a single flagged sentence isn't grounds to reject an entire piece.",
      },
      {
        question: 'Are non-native English writers really more likely to be flagged?',
        answer:
          "Published research has found exactly that pattern in the detectors studied: non-native English writing was consistently misclassified as AI-generated, while native writing was judged accurately. It's a genuine, documented bias, not a rumour.",
      },
      {
        question: 'Should I run my own check before I submit work?',
        answer:
          "It's a reasonable habit if you're working with a client known to screen submissions, and it costs nothing on the free Check page. It won't change how you wrote the piece; it just gives you an early, private read before anyone else's tool does.",
      },
    ],
    internalLinks: [
      { href: '/for/freelance-writers', label: 'MarkWitness for freelance writers' },
      { href: '/guide/prove-you-wrote-it', label: 'How to prove you wrote something yourself' },
      { href: '/check', label: 'Run a free check' },
      { href: '/blog/turnitin-ai-false-positive-how-to-check', label: 'Turnitin flagged you? How to check your own essay' },
      { href: '/blog/turnitin-ai-detector-vs-markwitness', label: 'Turnitin AI detector vs MarkWitness' },
    ],
    externalLinks: [
      { href: 'https://www.turnitin.com/blog/understanding-false-positives-within-our-ai-writing-detection-capabilities', label: 'Turnitin: document-level false positive rate' },
      { href: 'https://www.turnitin.com/blog/understanding-the-false-positive-rate-for-sentences-of-our-ai-writing-detection-capability', label: 'Turnitin: sentence-level false positive rate' },
      { href: 'https://arxiv.org/abs/2304.02819', label: 'Liang et al., "GPT detectors are biased against non-native English writers"' },
      { href: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai', label: 'European Commission: regulatory framework for AI' },
    ],
    schemaType: 'none',
  },
  {
    slug: 'green-list-watermarking-explained',
    title: 'Green-List Watermarking: The Stats Behind AI Marks',
    h1: 'Green-List Watermarking: The Stats Behind AI Marks',
    metaDescription:
      'Go deeper than the basics: the actual statistics behind green-list AI watermarking, explained in plain English with a worked z-test example.',
    category: 'Academy',
    format: 'deep-dive',
    intent: 'informational',
    publishedAt: '2026-08-12',
    author: 'MarkWitness Content Team',
    primaryKeyword: 'ai watermark detector',
    supportingKeywords: [
      'green-list watermarking',
      'kirchenbauer watermark',
      'z-test ai watermark',
      'bigram watermark detection',
      'how ai watermarks work statistically',
      'secret key ai watermark',
      'green list red list tokens',
      'watermark detection key',
    ],
    longTailKeywords: [
      'how does green-list watermarking work',
      'what is a z-score in ai watermark detection',
      'why ai watermark detectors need a secret key',
    ],
    heroImage: {
      src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600',
      alt: 'A performance analytics dashboard on a screen, representing the statistics behind green-list AI watermark detection',
      unsplashId: 'JKUTrJ4vK00',
    },
    intro: [
      "Saying a document is 'watermarked' is easy. Showing the maths behind that claim is harder, and that's the bit most explainers skip.",
      "This is the deeper companion to our beginner guide: a plain-English look at the statistics an ai watermark detector actually runs, built on the green-list method from Kirchenbauer et al.",
      "We'll walk through green and red token lists, why the test counts distinct bigrams, and a worked z-score example using MarkWitness's own live demo figures.",
    ],
    takeaways: [
      'Before each token, the model secretly splits its vocabulary into a green list and a red list, chosen by a key.',
      'The model is nudged, not forced, to prefer green tokens as it writes.',
      'Genuinely marked text ends up with far more green tokens than chance predicts.',
      'A detector holding the same key counts green hits and turns that into a z-score.',
      'The test runs over distinct bigrams, not single tokens, because repeated pairs would skew the count.',
      'MarkWitness only tests keys it actually holds, and says so; it never implies broader coverage than that.',
    ],
    sections: [
      {
        id: 'what-a-green-list-and-a-red-list-actually-are',
        heading: 'What a green list and a red list actually are',
        body: [
          'Before a language model writes its next word, it has already calculated a probability for every word in its vocabulary. A green-list watermark steps in right at that moment.',
          'Using a secret key and a hash of the words that came just before, the method splits the whole vocabulary into two piles for that single step: a green list and a red list, each roughly half the vocabulary.',
          "That split happens fresh before every single token, so the green list for word 50 of a sentence looks nothing like the green list for word 51. It's not one fixed list applied throughout, since it reshuffles constantly.",
        ],
      },
      {
        id: 'how-the-nudge-works-without-forcing-words',
        heading: 'How the nudge works, without forcing any word',
        body: [
          "The model doesn't have to pick a green word. It's simply nudged, given a small boost, toward the green list before it makes its choice.",
          "If a red word is a much stronger fit for the sentence, the model can still choose it. The nudge shifts the odds; it doesn't override the model's judgement.",
          "That's exactly why marked text still reads naturally. There's no telltale pattern of odd word choices to spot by eye, because the signal lives in the statistics, not in the prose.",
        ],
      },
      {
        id: 'why-marked-text-contains-more-green-tokens-than-chance',
        heading: 'Why marked text contains more green tokens than chance',
        body: [
          "Under the null hypothesis, meaning no watermark or the wrong key, roughly half of a document's tokens would land on the green list purely by chance, because that's how the vocabulary was split.",
          'Watermarked text pushes that proportion up. Not to 100%, because the nudge is gentle and real writing still needs plenty of red-list words to make sense, but noticeably above the chance rate.',
          'That excess, more green tokens than an unmarked document would produce, is the entire signal a detector is looking for.',
        ],
      },
      {
        id: 'the-z-test-turning-a-count-into-a-verdict',
        heading: 'The z-test: turning a token count into a verdict',
        body: [
          "A z-test compares what was actually observed against what chance alone would predict, and expresses the gap in standard deviations. A z-score of 0 means 'exactly what chance predicts'. A high z-score means the gap is very unlikely to be a coincidence.",
          "In MarkWitness's own positive-control test, marked text scored z greater than 8, a p-value below 1 in a million, under the correct key. The same text, checked under a different key, scored at chance.",
          "On the live /verify demo page, a specimen of marked text scores z = 20.45 under the correct key, and z = 0.1, essentially nothing, for the identical text under a different key. That gap is the whole point: the key is what makes the signal visible at all.",
        ],
      },
      {
        id: 'why-distinct-bigrams-not-single-tokens',
        heading: 'Why the test counts distinct bigrams, not single tokens',
        body: [
          "Kirchenbauer et al.'s original method scores over bigrams, meaning pairs of consecutive tokens, rather than single words, and specifically over distinct bigrams, not every repeated occurrence.",
          'A document that repeats one common phrase many times would otherwise skew a single-token count, making the test easier to fool or easier to accidentally trigger. Counting distinct pairs keeps repeated phrasing from dominating the score.',
          'It also better matches how the green-list split actually works, since the list for each token depends on the token before it, so a pair, not a single word, is the natural unit to test.',
        ],
      },
      {
        id: 'worked-example-a-z-score-walkthrough',
        heading: 'Worked example: a z-score walkthrough',
        body: [
          "The table below walks through what a real check looks like in practice, using MarkWitness's own measured figures alongside one illustrative case.",
          "Notice the gap between the correct-key row and the wrong-key row on the exact same underlying text: that's the whole method proven live, not just claimed in a paper.",
          "The final row is a reminder that very short passages simply don't carry enough tokens to score reliably, whichever key is used, because the test needs enough text to work with.",
        ],
      },
      {
        id: 'why-the-key-has-to-stay-secret',
        heading: 'Why the key has to stay secret, and what that means for honesty',
        body: [
          "If a watermark's key were public, anyone could counterfeit the signal in unmarked text, or strip it from marked text by targeting exactly the tokens the key favours. Secrecy isn't an accident; it's what keeps the method meaningful.",
          "That's why no model vendor publishes its own detection key, and it's also why MarkWitness only ever tests the keys it actually holds: its own public reference key, plus any key a vendor or institution has supplied to it directly.",
          "That scope is stated plainly rather than implied to be wider. A result under one key says nothing about text marked under a key MarkWitness doesn't have, which is exactly why an absent mark is never treated as proof of human authorship, only as 'no mark found under the keys tested'.",
        ],
      },
    ],
    table: {
      caption: "A worked z-test walkthrough: the first three rows are MarkWitness's own measured and live-demo figures; the fourth is an illustrative example of an under-length document.",
      headers: ['Scenario', 'Bigrams scored', 'Green-list hits', 'z-score', 'Verdict'],
      rows: [
        ['Marked text, correct key (positive-control test)', 'several hundred', 'well above the ~50% chance rate', 'z > 8 (p < 1e-6)', 'Strong statistical signal'],
        ['Same text, wrong key (/verify demo)', 'same text', 'close to the ~50% chance rate', 'z = 0.1', 'No signal, effectively chance'],
        ['Marked text, correct key (/verify demo specimen)', 'full specimen', 'well above chance', 'z = 20.45', 'Very strong statistical signal'],
        ['Short passage, illustrative example', 'too few to score reliably', 'not applicable', 'insufficient data', 'No verdict, needs more text'],
      ],
    },
    quote: {
      quote:
        "z=20.45 isn't a percentage and it isn't a vibe; it's how many standard deviations the green-token count sits from what chance alone would produce.",
      attribution: 'A MarkWitness detection engineer',
      role: "on the /verify page's z=20.45 result",
    },
    pitfalls: [
      "Treating a z-score like a percentage confidence figure, rather than what it actually is: a distance from chance.",
      'Assuming any high z-score proves a document is AI-written by a specific model, rather than marked under a specific key.',
      'Forgetting that a low z-score under one key says nothing about a different key.',
      'Expecting a very short passage to produce a reliable score at all.',
    ],
    faq: [
      {
        question: 'What is a z-score in ai watermark detection, in plain terms?',
        answer:
          "It's a measure of how far the observed green-token count sits from what pure chance would produce, counted in standard deviations. A z-score near 0 looks like chance. A z-score like 20.45 is a very large, very unlikely-to-be-coincidence gap.",
      },
      {
        question: 'Why does green-list watermarking use bigrams instead of single words?',
        answer:
          'Because scoring distinct pairs of tokens, rather than single tokens, stops a repeated word or phrase from skewing the count. It keeps the statistical test fair and matches how the green-list split is actually generated, using the token that came before.',
      },
      {
        question: 'Why do ai watermark detectors need a secret key, and what happens if it leaks?',
        answer:
          "The key controls which tokens are green at each step. If it leaked, the signal could be counterfeited into unmarked text or specifically stripped from marked text, so it's kept private, which is also why any given detector can only test the keys it's actually been given.",
      },
      {
        question: "Does a high z-score ever mean the same as '100% AI-written'?",
        answer:
          "No. It means the text is statistically very unlikely to be unmarked under that specific key, a narrower claim than 'this was written by AI'. It says nothing about text generated without a watermark at all, or marked under a different key.",
      },
    ],
    internalLinks: [
      { href: '/method', label: 'How the method works' },
      { href: '/verify', label: 'Live detector demo' },
      { href: '/limits', label: "What MarkWitness can and can't tell you" },
      { href: '/blog/what-is-an-ai-watermark-detector', label: 'What is an AI watermark? How detection works' },
      { href: '/blog/claude-ai-watermark-anthropic-provenance-mark', label: "Claude's AI watermark: what Anthropic's mark means" },
    ],
    externalLinks: [
      { href: 'https://arxiv.org/abs/2301.10226', label: 'Kirchenbauer et al., "A Watermark for Large Language Models"' },
      { href: 'https://www.nist.gov/itl/ai-risk-management-framework', label: 'NIST AI Risk Management Framework' },
      { href: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai', label: 'European Commission: regulatory framework for AI' },
    ],
    schemaType: 'none',
  },
  {
    slug: 'ai-detector-comparison-2026',
    title: 'AI Detector Comparison 2026: Turnitin vs GPTZero+',
    h1: 'AI Detector Comparison 2026: Turnitin vs GPTZero+',
    metaDescription:
      'Turnitin, GPTZero, Originality.ai and MarkWitness compared honestly: what each measures, stated accuracy, and API access.',
    category: 'Reviews',
    format: 'data-study',
    intent: 'commercial',
    publishedAt: '2026-08-12',
    author: 'MarkWitness Content Team',
    primaryKeyword: 'ai detector api',
    supportingKeywords: [
      'turnitin vs gptzero',
      'best ai detector 2026',
      'ai detector for institutions',
      'ai writing classifier comparison',
      'originality ai vs turnitin',
      'ai detector accuracy comparison',
      'which ai detector should i use',
      'ai watermark vs ai classifier',
    ],
    longTailKeywords: [
      'ai detector comparison 2026',
      'turnitin vs gptzero vs originality ai',
      'best ai detector api for developers',
    ],
    heroImage: {
      src: 'https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600',
      alt: 'A data reporting dashboard on a laptop screen, representing a 2026 comparison of AI detector tools',
      unsplashId: 'qwtCeJ5cLYs',
    },
    intro: [
      'Four tools, four different jobs, and one confusing shelf to choose from: that\'s the state of AI detection in 2026.',
      'This ai detector comparison 2026 roundup lines up Turnitin, GPTZero, Originality.ai and MarkWitness side by side, including who actually offers an ai detector api for developers.',
      "We're not picking a single winner. MarkWitness measures something narrower than the other three, and this guide says so plainly, so you can match the tool to the question you're actually asking.",
    ],
    takeaways: [
      'Turnitin, GPTZero and Originality.ai are general AI-writing classifiers; MarkWitness is a narrower, keyed watermark diagnostic.',
      'Institutions doing bulk screening want a classifier with a published false-positive rate and an appeals process.',
      'Individuals checking their own writing want a free, private, no-signup option first.',
      'Developers building disclosure into a pipeline want a documented, metered API.',
      'No tool in this comparison claims 100% accuracy, and the honest ones say so themselves.',
      "Match the tool to the question: 'does this read like AI?' is a different question from 'does this carry a specific mark?'",
    ],
    sections: [
      {
        id: 'why-comparison-is-hard-different-tools-measure-different-things',
        heading: 'Why this comparison is hard: different tools measure different things',
        body: [
          "Line four detectors up side by side and it looks like a simple accuracy contest. It isn't, and treating it as one leads to the wrong choice.",
          'Turnitin, GPTZero and Originality.ai are style classifiers. They estimate how likely a passage is to have been AI-generated based on statistical patterns in the writing itself: sentence structure, word choice, predictability.',
          "MarkWitness answers a different question entirely: does this specific text carry a specific inserted signal, under a specific key? That's a narrower, more falsifiable claim, and it's worth understanding before comparing a single 'accuracy' number across all four.",
        ],
      },
      {
        id: 'turnitin-classifier-built-for-institutions',
        heading: 'Turnitin: a classifier built for institutions',
        body: [
          "Turnitin is built into existing coursework submission systems, which makes it the default many universities already have running. It's not something an individual typically buys or accesses directly.",
          'Turnitin states a document-level false-positive rate under 1% for documents with over 20% AI writing, validated on an 800,000-document test set, and a sentence-level rate of roughly 4%, more common at the boundary between human and AI text.',
          "Independent education press has also reported on Turnitin itself acknowledging higher false-positive rates occur in some cases, a useful reminder that even a low headline figure isn't zero.",
        ],
      },
      {
        id: 'gptzero-broad-claims-esl-de-biasing',
        heading: 'GPTZero: broad accuracy claims and stated ESL de-biasing',
        body: [
          'GPTZero states 99% accuracy on its own site, along with a claim of being de-biased for ESL learners with a stated false-positive rate of around 1% for that group specifically.',
          'It also states 96.5% accuracy on mixed human/AI documents, a harder case than a purely human or purely AI document, since the boundary between the two is where most errors tend to cluster.',
          "To its credit, GPTZero says plainly on its own site that no AI detector is 100% accurate, a fair statement that's worth holding every tool in this comparison to, including itself.",
        ],
      },
      {
        id: 'originality-ai-multilingual-claims-and-transparency',
        heading: 'Originality.ai: multilingual claims and stated transparency',
        body: [
          'Originality.ai positions itself around multilingual coverage, stating 97.8% accuracy for its multilingual model and citing peer-reviewed third-party studies in support.',
          "Its own FAQ acknowledges that false positives happen, and states that it 'transparently shares false positive rates' in its own accuracy study, though the specific figure isn't given on that page itself.",
          "It's aimed squarely at content teams and agencies running volume checks across large batches of copy, rather than at an individual checking a single document.",
        ],
      },
      {
        id: 'markwitness-a-narrower-falsifiable-question',
        heading: 'MarkWitness: a narrower, falsifiable question',
        body: [
          "MarkWitness doesn't score writing style at all. It runs a keyed statistical test, the green-list watermark method, looking for a specific signal, not a general impression of 'AI-ness'.",
          'In its own positive-control test, marked text scored z greater than 8 under the correct key. On the live /verify demo, a specimen scores z = 20.45 under the correct key and z = 0.1, essentially chance, under a different key on the identical text.',
          "It's built for someone checking their own writing before it goes out, not for screening other people's work at scale, and it says so, rather than positioning itself as a drop-in replacement for a classifier.",
        ],
      },
      {
        id: 'the-comparison-table',
        heading: 'The comparison table',
        body: [
          "The table below lines up what each tool actually measures, its own stated accuracy or false-positive figures, whether an API exists, and who each one genuinely suits.",
          "Read the 'what it actually measures' column first. That's the column that explains why the other columns aren't directly comparable across all four rows.",
        ],
      },
      {
        id: 'which-tool-fits-your-situation',
        heading: 'Which tool actually fits your situation',
        body: [
          'An institution running bulk screening across hundreds of submissions wants a classifier with a published false-positive rate and an established appeals process: Turnitin, GPTZero or Originality.ai, depending on existing systems and budget.',
          'An individual who wants to check their own writing privately, before submitting it anywhere, wants something free, fast and local, which is what the Check page is built for, with no signup needed for a first look.',
          'A developer building a pipeline that needs to attach a documented, metered check to its own output, whether an editorial tool, an agent workflow, or anything that has to disclose provenance before handoff, wants an actual API. MarkWitness offers a metered JSON API and an MCP server for exactly that case.',
        ],
      },
      {
        id: 'what-none-of-these-tools-can-honestly-claim',
        heading: 'What none of these tools can honestly claim',
        body: [
          "None of the four claims 100% accuracy, and GPTZero says so about the category in general on its own site. That's a useful baseline for judging every marketing claim you read, including ours.",
          "A 'clean' result from any of these tools is not absolute proof of anything. A classifier's low score means the writing didn't look statistically AI-like to that model. A watermark detector's absent signal means no mark was found under the keys tested, not that the document is definitively human.",
          "Our own limits page states this plainly for MarkWitness specifically, and it's worth holding the same standard against any tool you're considering, whatever its marketing copy says.",
        ],
      },
    ],
    table: {
      caption: 'AI detector comparison 2026: what each tool actually measures',
      headers: ['Tool', 'What it actually measures', 'Stated accuracy / FPR (cited)', 'API available?', "Who it's for"],
      rows: [
        ['Turnitin', 'General AI-writing classifier', 'Document-level FPR under 1% (800,000-doc test set); sentence-level FPR approx. 4%', 'Institutional integration, not public self-serve', 'Schools and universities doing bulk screening'],
        ['GPTZero', 'General AI-writing classifier', 'Stated 99% accuracy; ~1% FPR claimed for de-biased ESL detection; 96.5% mixed-document accuracy', 'Yes, offered', 'Educators and content platforms wanting broad coverage'],
        ['Originality.ai', 'General AI-writing classifier, multilingual', 'Stated 97.8% accuracy on its multilingual model', 'Yes, offered', 'Agencies and content teams screening bulk copy'],
        ['MarkWitness', 'Keyed statistical watermark presence (green-list method), not general style classification', 'Positive-control z > 8 (p < 1e-6); live /verify demo z = 20.45 under correct key vs z = 0.1 under wrong key', 'Yes, with metered JSON API and MCP server', 'Individuals checking their own writing before it goes out'],
      ],
    },
    quote: {
      quote:
        "Ask what the number is actually measuring before you trust it. A style classifier and a keyed watermark test can both say 'AI' and be answering completely different questions.",
      attribution: 'A MarkWitness detection engineer',
      role: 'on comparing AI-writing classifiers with watermark detection',
    },
    pitfalls: [
      'Assuming a higher stated accuracy percentage automatically means a better fit for your situation.',
      "Comparing a style classifier's score directly against a watermark detector's z-score as if they measured the same thing.",
      'Choosing a tool with no API when the actual need is pipeline integration.',
      "Treating any single tool's 'clean' result as final proof, rather than one data point.",
    ],
    faq: [
      {
        question: 'Which AI detector has the lowest false positive rate?',
        answer:
          "On stated figures alone, Turnitin's document-level rate of under 1% is the lowest headline number among the classifiers here, though it's tested on a different definition (documents with over 20% AI writing) than GPTZero's or Originality.ai's figures, so treat direct comparisons with some caution.",
      },
      {
        question: 'Is MarkWitness a replacement for Turnitin or GPTZero?',
        answer:
          "No. It answers a narrower question, whether a specific keyed watermark is present, rather than classifying writing style generally. It's built for checking your own writing, not for screening other people's submissions at scale.",
      },
      {
        question: 'Do any of these tools offer a public API?',
        answer:
          'GPTZero, Originality.ai and MarkWitness all offer some form of API access; Turnitin is generally accessed through institutional integrations rather than a public self-serve API.',
      },
      {
        question: "What's the difference between a style classifier and a watermark detector?",
        answer:
          'A style classifier estimates the likelihood text was AI-generated from patterns in the writing itself. A watermark detector checks for a specific statistical signal that was deliberately inserted during generation, using a specific key, a much narrower and more falsifiable question.',
      },
    ],
    internalLinks: [
      { href: '/vs/turnitin-ai-detector', label: 'MarkWitness vs Turnitin AI detector' },
      { href: '/vs/gptzero', label: 'MarkWitness vs GPTZero' },
      { href: '/vs/originality-ai', label: 'MarkWitness vs Originality.ai' },
      { href: '/blog/turnitin-ai-detector-vs-markwitness', label: 'Turnitin AI detector vs MarkWitness' },
      { href: '/blog/gptzero-review-false-positives', label: 'GPTZero review: accuracy, bias and false positives' },
      { href: '/blog/originality-ai-review-false-positives', label: 'Originality.ai review: reliable for high-stakes use?' },
    ],
    externalLinks: [
      { href: 'https://gptzero.me', label: 'GPTZero' },
      { href: 'https://originality.ai', label: 'Originality.ai' },
      { href: 'https://www.turnitin.com/blog/understanding-false-positives-within-our-ai-writing-detection-capabilities', label: 'Turnitin: document-level false positive rate' },
      { href: 'https://www.turnitin.com/blog/understanding-the-false-positive-rate-for-sentences-of-our-ai-writing-detection-capability', label: 'Turnitin: sentence-level false positive rate' },
      { href: 'https://www.k12dive.com/news/turnitin-false-positives-AI-detector/652221/', label: 'K-12 Dive: Turnitin acknowledges false positives' },
    ],
    schemaType: 'none',
  },
  {
    slug: 'mcp-ai-provenance-tool-agent-disclosure',
    title: 'MCP AI Provenance Tools: Checking Before Your Agent Hands Off',
    h1: 'MCP AI Provenance Tools: Checking Before Your Agent Hands Off',
    metaDescription:
      'MCP AI provenance tools explained: how an agent checks its own output for a mark before handoff, and why that matters now. Try MarkWitness free.',
    category: 'Academy',
    format: 'deep-dive',
    intent: 'informational',
    publishedAt: '2026-08-12',
    author: 'MarkWitness Content Team',
    primaryKeyword: 'mcp ai provenance tool',
    supportingKeywords: [
      'ai agent provenance disclosure',
      'check_document mcp tool',
      'agent content provenance check',
      'ai watermark mcp server',
      'eu ai act article 50 agents',
      'agentic ai transparency',
      'mcp server ai detection',
      'ai agent output disclosure',
      'model context protocol watermark',
    ],
    longTailKeywords: [
      'how to check ai provenance before an agent sends its output',
      'does my ai agent need to disclose ai generated content',
      'mcp tool for checking an ai watermark before handoff',
    ],
    heroImage: {
      src: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600',
      alt: 'Racks of server hardware representing the MCP AI provenance tool infrastructure agents call before handing off content',
      unsplashId: 'M5tzZtFCOfs',
    },
    intro: [
      'An agent that drafts a report, a caption or a cover letter usually just hands the text over. Nobody asks it whether that text carries a provenance mark, so it never says.',
      'That gap is closing. Model makers are marking their own output, regulators are asking for disclosure, and a small cluster of MCP servers has appeared this year to let an agent check before it ships.',
      'This piece looks at what "checking before handoff" actually means for an agent pipeline, where the current MCP tools sit, and where MarkWitness\'s own check_document and describe_method tools fit into that picture.',
    ],
    takeaways: [
      'An agent handing off generated content is a new demand surface for provenance checks, distinct from a human checking their own essay.',
      'The MCP ecosystem has grown from roughly 100 servers at its November 2024 launch to over 10,000 indexed across public registries in 2026.',
      'A handful of named MCP servers now offer watermark-related capability to agents, though most focus on embedding a mark or building a compliance pack, not checking text already in hand.',
      'MarkWitness\'s MCP server exposes check_document and describe_method as agent-callable tools, sitting behind the same Pro plan and metered pricing as its JSON API.',
      'A pass from any of these tools tells an agent something narrow and specific, never a blanket guarantee of authorship either way.',
      'The EU AI Act\'s Article 50 transparency rules took effect on 2 August 2026, with a grace period to 2 December 2026 for machine-readable marking on systems already live before that date.',
    ],
    sections: [
      {
        id: 'why-this-is-now-an-agent-problem',
        heading: 'Why this is now an agent problem, not just a human one',
        body: [
          'Most of the writing about AI provenance marks so far has been aimed at people: a student checking an essay, a freelancer checking an invoice before a client does it for them. That is a real and pressing need, but it assumes a person is sitting at the keyboard deciding whether to check.',
          'An agent assembling a deliverable on someone else\'s behalf has no such moment of reflection built in, unless a developer wires one in deliberately. If that agent\'s output happens to carry a provenance mark from the model that generated a paragraph of it, and it hands that paragraph off without saying so, the disclosure obligation has quietly gone missing, not because anyone decided to skip it, but because nobody built the step.',
          'That is a structurally different problem from the human-facing one. It needs a tool an agent can call directly, mid-pipeline, without a person in the loop for every check.',
        ],
      },
      {
        id: 'what-checking-before-handoff-actually-means',
        heading: 'What "checking before handoff" actually means',
        body: [
          'Concretely, it means one more tool call before the final response goes out: pass the assembled text to a provenance check, read back a signal strength and a confidence band, and decide what to do with that information, whether that is appending a disclosure line, logging the result, or simply making the check available to whoever reviews the agent\'s output later.',
          'It is not about blocking output that scores highly, and it should not be sold as a filter. A detected mark is a signal worth surfacing, not a verdict that should silently stop a pipeline, and the tool that pretends otherwise is overstating what a statistical check can responsibly claim.',
        ],
      },
      {
        id: 'the-mcp-ecosystem-this-sits-inside',
        heading: 'The MCP ecosystem this sits inside',
        body: [
          'The Model Context Protocol itself is barely two years old, and the growth curve behind it is one reason a provenance-check tool now makes sense as an MCP server rather than a bespoke integration for every framework. The protocol launched in November 2024 with a modest handful of servers; by 2026 that had grown to more than 10,000 indexed across public registries.',
          'That scale matters here for a simple reason: an agent framework does not need a custom integration for every provenance vendor it might want to call. It needs the vendor to speak MCP, the same way it already expects a search tool or a file-reader to speak MCP, so the provenance check becomes one more entry in a tool list rather than a one-off plumbing job.',
        ],
      },
      {
        id: 'the-tools-that-already-exist-and-what-they-actually-do',
        heading: 'The tools that already exist, and what they actually do',
        body: [
          'A small cluster of MCP servers touching this space has appeared over the past year, and it is worth being precise about what each one actually does, since "watermarking MCP server" covers more than one job. ForensicMark ships an MCP server that embeds an invisible forensic watermark into an image and attaches a C2PA manifest, callable directly from an agent, but its job is images, and its job is embedding a mark, not checking text a model has already produced.',
          'MEOK\'s Watermark Attest MCP is closer in spirit: it bundles a C2PA manifest, a SynthID-style invisible watermark and a signed attestation into a single agent-callable tool, built explicitly around the EU AI Act\'s Article 50 compliance timeline. Its own documentation frames that as a 2 November 2026 target, which is worth reading as that vendor\'s own internal deadline rather than the statute\'s exact date, since the regulation\'s primary transparency obligations took effect on 2 August 2026, with a grace period to 2 December 2026 for machine-readable marking specifically on systems already on the market before that date.',
          'What neither tool does is the specific job this piece is about: taking a piece of text an agent already has in hand, text it did not itself embed a mark into, and checking whether a statistical signal is present. That is a detection job, not an embedding job, and it is the gap MarkWitness\'s MCP server sits in.',
        ],
      },
      {
        id: 'where-markwitness-fits-check-document-and-describe-method',
        heading: 'Where MarkWitness fits: check_document and describe_method',
        body: [
          'MarkWitness\'s MCP server exposes two tools an agent can call directly. check_document runs the keyed statistical watermark check against a passed-in document and returns a signal strength, a confidence band and a per-passage breakdown, the same underlying method behind the browser-based Check page, just reachable as a tool call instead of a page load. describe_method returns the check\'s own description and stated limits as structured data, so an agent (or whoever built it) can surface exactly what the check can and cannot establish, rather than guessing at how to phrase a disclosure.',
          'Both tools sit behind the same Pro plan as the JSON API, £19 a month, metered at 2p per 1,000 words on top for programmatic use. That is a deliberate design choice: the free, browser-only Check page cannot become an agent-callable tool without an account behind it, because someone has to pay for the compute a machine caller uses on demand, unlike a human checking one document by hand.',
        ],
      },
      {
        id: 'a-worked-example-wiring-the-check-into-a-pipeline',
        heading: 'A worked example: wiring the check into a pipeline',
        body: [
          'Picture an agent that drafts marketing copy on a client\'s behalf, using a mix of the client\'s own notes and generated text to fill gaps. Before the final draft goes back to the client, the agent calls check_document on the assembled text. The result comes back showing a moderate signal strength in two of eleven paragraphs, the ones the agent generated outright, and nothing detected in the paragraphs drawn straight from the client\'s notes.',
          'The agent does not need to strip those two paragraphs out, and it should not be built to. What it can do is attach that per-passage result to the deliverable, or log it against the job, so that whoever reviews the copy later, the client, an editor, a compliance step further down the chain, has the same information the agent had, rather than a document that looks uniformly authored when it was not. That is the disclosure step this whole piece has been describing, made concrete: one tool call, one structured result, attached rather than hidden.',
        ],
      },
      {
        id: 'what-the-check-can-and-cannot-tell-an-agent',
        heading: 'What the check can and cannot tell an agent',
        body: [
          'A detected mark, from any tool in this category, is a signal that the marked passage was processed by a model holding the tested key. It is not proof of authorship on its own, because marks can survive into quoted, translated or lightly edited text that a human genuinely wrote around. An agent that treats a positive result as "this paragraph is definitely AI-written" is overstating the finding.',
          'The reverse holds too, and it matters just as much for an agent as for a person: no mark detected means no mark was found under the specific keys tested, never proof the passage is human-written. MarkWitness holds one open, testable reference key plus any vendor or institution keys supplied via configuration; it does not, and cannot, claim to test against every model provider\'s private detection key, because none of those keys are published. describe_method exists precisely so an agent surfacing a result also surfaces that caveat, rather than a bare pass or fail.',
        ],
      },
    ],
    table: {
      caption: 'MCP-callable provenance and watermarking tools active in 2026, and the specific job each one does',
      headers: ['Tool', 'Core job', 'Content type', 'What it does NOT do'],
      rows: [
        ['ForensicMark', 'Embeds an invisible forensic watermark and C2PA manifest into an image', 'Images', 'Does not check text already in hand for an existing mark'],
        ['MEOK Watermark Attest MCP', 'Bundles a C2PA manifest, invisible watermark and signed attestation for Article 50 compliance', 'Images, with a compliance-pack framing', 'Does not run a keyed statistical check on text a model has already produced'],
        ['MarkWitness (check_document, reduce_ai_evidence, describe_method)', 'Checks a passed-in document for a keyed statistical watermark and returns a confidence band; separately, rewrites it on-device to reduce detectable evidence', 'Text, five supported languages', 'Cannot guarantee defeating an undisclosed vendor watermark; the rewrite tool has no hosted mode, on any tier'],
      ],
    },
    quote: {
      quote: 'A human decides to check their own writing. An agent has to be built to decide that, every single time, or it never happens at all. That is the whole reason this needs to be a tool call, not a habit.',
      attribution: 'A MarkWitness detection engineer',
      role: 'on why provenance checks belong in an agent\'s tool list',
    },
    pitfalls: [
      'Treating a detected mark as proof an agent-assembled passage is entirely AI-written, rather than a signal worth attaching to the output.',
      'Assuming an image-watermarking MCP server and a text-provenance-checking MCP server do the same job because both mention "watermark".',
      'Building a pipeline that calls a provenance check but discards the stated limits, so a downstream reviewer sees a bare score with no context.',
      'Waiting for a hard compliance deadline to wire in a disclosure step, rather than treating it as a normal part of an output pipeline now.',
    ],
    faq: [
      {
        question: 'What is an MCP AI provenance tool?',
        answer: 'It is a Model Context Protocol server that exposes an AI-content provenance check, such as detecting a statistical watermark, as a tool an AI agent can call directly during its own pipeline, rather than a human running a check by hand on a website.',
      },
      {
        question: 'Does MarkWitness have an MCP server agents can call?',
        answer: 'Yes. It exposes check_document, which runs the watermark check on a passed-in document, and describe_method, which returns the method\'s description and stated limits as structured data. Both sit behind the Pro plan, metered per 1,000 words.',
      },
      {
        question: 'Do image-watermarking MCP servers like ForensicMark do the same job as MarkWitness?',
        answer: 'No. ForensicMark embeds an invisible forensic watermark into an image at the point of creation. MarkWitness checks text an agent already has in hand for a statistical mark it did not itself embed. They solve adjacent but different problems.',
      },
      {
        question: 'Is my AI agent legally required to disclose AI-generated content?',
        answer: 'The EU AI Act\'s Article 50 transparency obligations took effect on 2 August 2026, with a grace period to 2 December 2026 for machine-readable marking on systems already on the market before that date. Whether a specific agent and its output fall within scope depends on the deployment, so this is general context, not legal advice.',
      },
      {
        question: 'Can an agent rely on "no mark detected" to say content is human-written?',
        answer: 'No. It only means no mark was found under the keys tested. No independent tool can test against every model provider\'s private detection key, since none are published, so an absent mark is never proof of human authorship.',
      },
    ],
    internalLinks: [
      { href: '/docs/mcp', label: 'MarkWitness MCP server documentation' },
      { href: '/docs/api', label: 'MarkWitness API documentation' },
      { href: '/method', label: 'How the MarkWitness method works' },
      { href: '/limits', label: 'Stated limits of the check' },
      { href: '/blog/how-to-use-the-markwitness-api', label: 'How to use the MarkWitness API to check AI marks' },
      { href: '/blog/claude-ai-watermark-anthropic-provenance-mark', label: 'Claude\'s AI watermark: what Anthropic\'s mark means' },
    ],
    externalLinks: [
      { href: 'https://artificialintelligenceact.eu/transparency-rules-article-50/', label: 'EU AI Act: Article 50 transparency rules, compliance dates' },
      { href: 'https://www.digitalapplied.com/blog/mcp-adoption-statistics-2026-model-context-protocol', label: 'MCP adoption statistics, 2026' },
      { href: 'https://glama.ai/mcp/servers/CSOAI-ORG/meok-watermark-attest-mcp', label: 'MEOK Watermark Attest MCP listing' },
      { href: 'https://forensicmark.com/', label: 'ForensicMark: invisible forensic watermarking API' },
    ],
    schemaType: 'none',
  },
]
