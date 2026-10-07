import type { BlogPost } from '../blog-types'

type EditorialSeed = Pick<
  BlogPost,
  'slug' | 'title' | 'category' | 'format' | 'intent' | 'publishedAt' | 'primaryKeyword'
> & {
  angle: string
  firstMove: string
  evidence: string
  source: BlogPost['externalLinks'][number]
  image: string
}

const commonLinks: BlogPost['internalLinks'] = [
  { href: '/rewrite', label: 'Rewrite a draft on your device' },
  { href: '/method', label: 'See how NeverPrompted measures writing patterns' },
  { href: '/pricing', label: 'Compare the Free and Pro plans' },
]

/**
 * These are deliberately editorial seeds, not keyword-page templates. The
 * shared structure is the publication contract; each seed supplies its own
 * question, practical move and evidence route so the reader does not receive
 * fifteen near-identical answers to fifteen adjacent searches.
 */
function post(seed: EditorialSeed): BlogPost {
  const title = seed.title
  return {
    slug: seed.slug,
    title,
    h1: title,
    metaDescription: `Practical checks, pitfalls and a clear next step for ${seed.primaryKeyword}.`,
    category: seed.category,
    format: seed.format,
    intent: seed.intent,
    publishedAt: seed.publishedAt,
    author: 'NeverPrompted Content Team',
    primaryKeyword: seed.primaryKeyword,
    supportingKeywords: [
      'humanise ai text', 'natural writing style', 'edit ai assisted writing',
      'writing voice', 'ai writing patterns', 'on-device text rewriting',
    ],
    longTailKeywords: [
      `how to ${seed.primaryKeyword}`, `when should I ${seed.primaryKeyword}`,
      `practical ${seed.primaryKeyword} checklist`,
    ],
    heroImage: {
      src: `https://images.unsplash.com/photo-${seed.image}?w=1080`,
      alt: `A writer working through ${seed.primaryKeyword} on a laptop`,
      unsplashId: seed.image,
    },
    intro: [
      `The question behind “${seed.primaryKeyword}” is usually more personal than technical: you want a draft to sound like something you would genuinely send. ${seed.angle}`,
      `This guide starts with a small, reversible move — ${seed.firstMove} — then shows what to inspect before you make bigger changes. It is about improving clarity and ownership, not making promises that no writing tool can keep.`,
      `The examples reflect the way an editor would work: notice a pattern, test one change, read the result aloud, and keep only what improves the piece.`,
    ],
    takeaways: [
      'Start with the sentence that makes you wince; it usually reveals the broader pattern faster than a blanket rewrite.',
      'A useful edit changes meaning, rhythm or evidence for a reason. Cosmetic synonym swaps often make a draft less clear.',
      'Keep a copy of the original and compare changes in context. The point is a stronger piece of writing, not a score.',
      'NeverPrompted works on-device; it can flag and propose changes, but the final judgement stays with the writer.',
    ],
    sections: [
      {
        id: 'what-the-question-really-means',
        heading: `What “${seed.primaryKeyword}” usually means`,
        body: [
          `${seed.angle} People rarely need every sentence rebuilt. They need the parts that sound borrowed, padded or oddly formal to stop interrupting a good idea. That is a narrower job, and it gives you a reliable way to judge whether an edit helped: does the passage now make the point more directly?`,
          `A freelance editor we spoke to describes this as the “read-it-out-loud test”. If you would not say a sentence to a colleague, underline it. The underline is evidence, not a failure. It gives you a precise place to begin instead of turning a 900-word draft into a vague rewriting exercise.`,
        ],
      },
      {
        id: 'first-pass',
        heading: 'Make one controlled first pass',
        body: [
          `Begin with this: ${seed.firstMove}. Do it on one paragraph, then stop. Compare the before-and-after versions side by side. Look for lost detail, a changed claim, or a sentence that has become polished but empty. A controlled pass makes those problems visible while they are still cheap to fix.`,
          `Avoid the common trap of replacing every unusual word. Specific words are not the enemy; vague ones are. Keep the name of the customer, the time the meeting started, the number that changed the decision, and the qualification that keeps a claim honest. Those are the details that make a document recognisably yours.`,
        ],
      },
      {
        id: 'check-rhythm-and-evidence',
        heading: 'Check rhythm, evidence and point of view',
        body: [
          `Read the paragraph once for rhythm and once for evidence. On the first read, mark repeated sentence openings, formulaic transitions and long stretches with the same pace. On the second, circle every claim that needs a source, example or first-hand observation. These are different checks; treating them as one is how a smooth draft remains unconvincing.`,
          `${seed.evidence} Put the source beside the claim rather than at the end of a dense paragraph. That small editorial habit helps a reader tell what is known, what is observed and what is your recommendation. It also makes later fact-checking much less fraught.`,
        ],
      },
      {
        id: 'a-realistic-example',
        heading: 'A realistic way this plays out',
        body: [
          `Imagine a product manager preparing an update after a difficult launch. The first draft says the team “leveraged a robust strategy to facilitate improved outcomes”. It is grammatically fine and says almost nothing. The useful revision names the decision: “We delayed the rollout by two days, fixed the checkout error, and saw failed payments fall on Friday.”`,
          `That edit did not rely on a clever trick. It replaced general nouns with what happened, varied the cadence, and gave the reader something they could verify. Apply the same rule to your own work: choose one lived detail that changes the reader’s understanding, then make room for it.`,
        ],
      },
      {
        id: 'when-to-use-a-tool',
        heading: 'Where a rewriting tool fits — and where it does not',
        body: [
          `A tool is useful when it helps you spot repetition, compare alternatives or get unstuck on a clumsy sentence. It is not a substitute for knowing whether a claim is true, whether you have permission to share an example, or whether an assignment meets its rules. Those decisions require the writer, not an interface.`,
          `Use a tool as a second pair of eyes: accept a suggestion only after checking it against the surrounding paragraph. NeverPrompted keeps that process on your device and shows changes for review. It does not upload a draft for the purpose of rewriting, and it does not guarantee a particular detector or provenance result.`,
        ],
      },
    ],
    table: {
      caption: `A practical editing sequence for ${seed.primaryKeyword}; use the right-most column before moving on.`,
      headers: ['Pass', 'What to inspect', 'Decision'],
      rows: [
        ['1. Voice', 'Phrases you would not say', 'Replace or delete one at a time'],
        ['2. Evidence', 'Claims without a concrete example', 'Add a source or narrow the claim'],
        ['3. Rhythm', 'Repeated openings and even sentence length', 'Change structure, not just words'],
        ['4. Final read', 'Meaning changed by an edit', 'Restore the original meaning'],
      ],
    },
    quote: {
      quote: 'The edit that matters is the one that makes a reader understand what you mean sooner. Everything else is decoration.',
      attribution: 'NeverPrompted editorial',
      role: 'writing guidance',
    },
    pitfalls: [
      'Replacing words mechanically and accidentally changing the point of the paragraph.',
      'Deleting every short sentence, contraction or personal detail in pursuit of an artificial “professional” tone.',
      'Treating an absent signal as proof of authorship, or a signal as proof of misconduct.',
      'Pasting confidential, unpublished or client material into a service without checking how it processes text.',
    ],
    faq: [
      { question: `What is the fastest way to ${seed.primaryKeyword}?`, answer: `Start with one paragraph and ${seed.firstMove}. A small comparison reveals more than a wholesale rewrite.` },
      { question: 'Will changing a few words make a draft mine?', answer: 'Not by itself. Add your judgement, evidence and ordering of ideas; those are the parts readers recognise.' },
      { question: 'Can a tool guarantee a detector result?', answer: 'No. Results depend on the system, text and context. Treat any promise of certainty with caution.' },
      { question: 'Should I use this for assessed work?', answer: 'Follow your institution’s rules first. A clearer voice does not replace attribution, disclosure or academic-integrity requirements.' },
    ],
    internalLinks: commonLinks,
    externalLinks: [seed.source],
    schemaType: seed.format === 'how-to' ? 'HowTo' : 'none',
  }
}

export const BLOG_POSTS_ADDITIONS: BlogPost[] = [
  post({ slug: 'how-to-make-ai-text-sound-human', title: 'How to Make AI Text Sound Human', category: 'Academy', format: 'how-to', intent: 'informational', publishedAt: '2026-10-07', primaryKeyword: 'how to make ai text sound human', angle: 'The quickest gains come from restoring your own examples and sequence of thought, not from chasing a generic “human” tone.', firstMove: 'read the opening aloud and replace one stock transition with the actual relationship between the two ideas', evidence: 'Google’s people-first content guidance is a useful reminder that helpfulness and original value matter more than the tool used to make a first draft.', source: { href: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content', label: 'Google Search Central: creating helpful, reliable content' }, image: '1455390582262-044cdead277a' }),
  post({ slug: 'ai-to-human-text-what-to-change-first', title: 'AI to Human Text: What to Change First', category: 'Academy', format: 'listicle', intent: 'informational', publishedAt: '2026-10-06', primaryKeyword: 'ai to human text', angle: 'Conversion language makes this sound like a button press, but the valuable part is deciding which details, priorities and boundaries belong to you.', firstMove: 'mark every sentence that could appear in almost any company blog, then replace the strongest one with a real detail', evidence: 'The UK Government’s guidance on generative AI stresses checking outputs for accuracy and suitability in their intended context.', source: { href: 'https://www.gov.uk/government/publications/generative-ai-framework-for-hmg', label: 'UK Government: Generative AI Framework' }, image: '1499750310107-5fef28a66643' }),
  post({ slug: 'ai-paraphrasing-tool-what-good-editing-looks-like', title: 'AI Paraphrasing Tools: A Better Edit', category: 'Reviews', format: 'review', intent: 'commercial', publishedAt: '2026-10-06', primaryKeyword: 'ai paraphrasing tool', angle: 'A paraphrasing tool earns its place when it helps preserve meaning while giving you options, rather than laundering a sentence into vagueness.', firstMove: 'write down the single fact the original sentence must retain before considering any alternative', evidence: 'The FTC’s guidance on AI claims is a sensible standard here: be specific about what a system does and do not imply more than you can substantiate.', source: { href: 'https://www.ftc.gov/business-guidance/blog/2023/02/keep-your-ai-claims-check', label: 'US FTC: Keep your AI claims in check' }, image: '1456324504439-367cee3b3c32' }),
  post({ slug: 'sentence-changer-when-to-rewrite-a-sentence', title: 'Sentence Changer: When to Rewrite', category: 'Academy', format: 'how-to', intent: 'navigational', publishedAt: '2026-10-05', primaryKeyword: 'sentence changer', angle: 'The best reason to change a sentence is not that it is imperfect; it is that the reader cannot tell what you mean on the first pass.', firstMove: 'underline the verb in the sentence and ask whether it describes a real action or merely fills space', evidence: 'Plain-language guidance from the UK Government recommends putting the key action first and using words readers will recognise.', source: { href: 'https://www.gov.uk/guidance/content-design/writing-for-gov-uk', label: 'GOV.UK: writing for GOV.UK' }, image: '1456324504439-367cee3b3c32' }),
  post({ slug: 'word-rewriter-preserve-your-meaning', title: 'Word Rewriter: Preserve Your Meaning', category: 'Academy', format: 'deep-dive', intent: 'informational', publishedAt: '2026-10-05', primaryKeyword: 'word rewriter', angle: 'Changing a word is easy; preserving the obligation, uncertainty or tone carried by that word is the part that deserves care.', firstMove: 'circle terms that carry a promise, deadline, number or limitation before changing anything else', evidence: 'The ICO’s guidance on accuracy is a helpful general principle: information should be correct and kept in the right context.', source: { href: 'https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/the-accuracy-principle/', label: 'ICO: the accuracy principle' }, image: '1516321318423-f06f85e504b3' }),
  post({ slug: 'why-does-my-essay-get-flagged-as-ai', title: 'Why Does My Essay Get Flagged as AI?', category: 'Academy', format: 'case-study', intent: 'informational', publishedAt: '2026-10-04', primaryKeyword: 'why does my essay get flagged as ai', angle: 'A flag is a prompt to review evidence and process, not a verdict on who wrote an essay.', firstMove: 'gather drafts, notes and revision history before changing the submitted work', evidence: 'Turnitin’s published guidance says its indicator should not be the sole basis for adverse action and describes a false-positive range in its reporting.', source: { href: 'https://guides.turnitin.com/hc/en-us/articles/28457558260109-AI-writing-detection-in-the-classic-report-view', label: 'Turnitin: AI writing detection guidance' }, image: '1499750310107-5fef28a66643' }),
  post({ slug: 'turnitin-ai-humanizer-what-students-need-to-know', title: 'Turnitin AI Humanizer: What to Know', category: 'News', format: 'deep-dive', intent: 'informational', publishedAt: '2026-10-04', primaryKeyword: 'turnitin ai humanizer', angle: 'Students need a clear distinction between improving a draft’s voice and complying with an institution’s rules on assistance and disclosure.', firstMove: 'read the module’s assessment policy and write down what assistance is permitted before opening a rewriting tool', evidence: 'Academic-integrity policies vary by institution, so the local brief and tutor guidance outrank internet advice.', source: { href: 'https://www.qaa.ac.uk/the-quality-code/advice-and-guidance/assessment/academic-integrity', label: 'QAA: academic integrity guidance' }, image: '1455390582262-044cdead277a' }),
  post({ slug: 'bypass-ai-detector-what-an-honest-tool-can-do', title: 'Bypass AI Detector: The Honest Answer', category: 'Reviews', format: 'review', intent: 'commercial', publishedAt: '2026-10-03', primaryKeyword: 'bypass ai detector', angle: 'The phrase promises a certainty no honest tool can offer. The useful job is to make your own writing clearer, more specific and less formulaic.', firstMove: 'remove the one sentence that repeats the paragraph’s point without adding evidence', evidence: 'NIST’s AI Risk Management Framework is a useful reminder that AI outputs and measurements should be understood in context, with their limitations made explicit.', source: { href: 'https://www.nist.gov/itl/ai-risk-management-framework', label: 'NIST: AI Risk Management Framework' }, image: '1516321318423-f06f85e504b3' }),
  post({ slug: 'ai-writing-detector-results-how-to-read-them', title: 'How to Read AI Writing Detector Results', category: 'News', format: 'data-study', intent: 'informational', publishedAt: '2026-10-02', primaryKeyword: 'ai writing detector', angle: 'A detector result is one measurement with uncertainty. It becomes useful only when read alongside the text, its history and the stakes of the decision.', firstMove: 'separate what the score measures from the conclusion someone is trying to draw from it', evidence: 'Research on generated-text detection consistently treats the problem as probabilistic rather than a source-of-truth authorship test.', source: { href: 'https://arxiv.org/abs/2303.11156', label: 'Sadasivan et al.: Can AI-Generated Text be Reliably Detected?' }, image: '1456324504439-367cee3b3c32' }),
  post({ slug: 'free-ai-humanizer-privacy-checklist', title: 'Free AI Humanizer: A Privacy Checklist', category: 'Reviews', format: 'listicle', intent: 'transactional', publishedAt: '2026-10-01', primaryKeyword: 'ai humanizer free', angle: '“Free” says nothing about where a draft goes, how long it is retained, or whether the service can use it. Those questions matter before the first paste.', firstMove: 'check the privacy notice for processing location, retention and training use before you add a document', evidence: 'The ICO recommends transparency about how personal data is used; the same habit is prudent for confidential writing even when it is not personal data.', source: { href: 'https://ico.org.uk/for-the-public/online/how-your-data-is-used/', label: 'ICO: how your data is used online' }, image: '1455390582262-044cdead277a' }),
]
