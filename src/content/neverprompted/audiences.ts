import type { LongTailPage } from '../pages-types'

/**
 * NeverPrompted's /for/* audience pages.
 *
 * These are written from scratch in NeverPrompted's own voice: plain-English,
 * proactive, and warm, for someone who wants their own writing to sound like
 * them before anyone flags anything. That is a different door from the
 * equivalent WatermarkRemoverPro pages, which are written for someone after
 * an accusation, in a denser, statistical register. Do not merge the two.
 */

export const AUDIENCES: LongTailPage[] = [
  {
    slug: 'content-marketers',
    group: 'for',
    title: 'For content marketers writing at brand scale',
    metaTitle: 'When AI-assisted drafts start sounding like nobody: a fix',
    metaDescription:
      'Blog posts, landing pages and email campaigns drafted with an AI assistant tend to converge on the same phrasing. Check and rewrite your own drafts on-device before they ship under your brand.',
    intro:
      "You didn't write a bad sentence. You wrote a sentence that a thousand other brands also wrote this month, because the assistant that helped you draft it reaches for the same handful of moves under time pressure: the em dash as a connector, the tricolon, \"in today's landscape\". Nobody reading your landing page can point to what's wrong, but they've read this exact rhythm before, on someone else's landing page, and it costs you the thing brand voice is supposed to buy: the sense that a specific person or company is talking to them.",
    sections: [
      {
        heading: 'The tell isn’t that it was AI-assisted, it’s that it reads like everyone else’s',
        body: [
          "Most brand style guides ban obviously robotic phrasing and call it solved. But the harder problem is subtler: a paragraph can be grammatically flawless, on-brief, factually correct, and still read as interchangeable with your competitor's paragraph, because both were smoothed by the same kind of assistant into the same safe, elevated, hedge-everything register. Readers don't consciously detect this. They just trust it less and remember it less, which shows up downstream as lower engagement and weaker recall, not as a complaint you can trace back to a sentence.",
          "The fix isn't to ban AI assistance in your workflow, most teams can't and shouldn't. It's to check what comes out the other end before it goes live: does this still sound like a person at this company wrote it, with this company's actual opinions and actual level of directness, or does it sound like the assistant's default voice wearing your logo?",
        ],
      },
      {
        heading: 'What NeverPrompted actually does with a draft',
        body: [
          "You paste in the post, the landing page copy, the email. Everything runs in your browser, nothing is uploaded anywhere, which matters when the draft is unpublished brand material. NeverPrompted checks for a statistical AI watermark if one happens to be present, and separately measures how far the draft's style sits from a reference corpus of real contemporary writing: sentence-length variance, vocabulary choices, structural patterns like uniform paragraph shapes or the same three connective phrases doing all the work.",
          "Where it finds specific AI tells, stock transitions, em dashes doing the job a period should do, hedging that adds words without adding meaning, it proposes a rewrite and shows you a diff, so you accept or reject changes rather than getting a black-box replacement. Heavier settings change more of the original wording; lighter settings leave more of your draft intact and just clean up the obvious tells. Either way it's editing your writing, not generating new writing, so your actual claims and structure stay yours.",
        ],
      },
      {
        heading: 'Where this fits in a content workflow',
        body: [
          "The natural place to run it is right before a draft leaves the writer's hands, whether the writer used AI assistance heavily, lightly, or not at all (assistant-flavoured phrasing creeps into human drafts too, from reading too much of it). Free gets you unlimited on-device checking plus a weekly budget of rewriting, which covers most individual contributors. Pro removes the weekly limit and adds a better on-device rewriting model, plus a dated PDF report if you need to show an editor or client what changed and why.",
          "One honest limit worth stating plainly: if a piece of writing carries an undisclosed AI provenance watermark from another vendor, no tool, including this one, can guarantee defeating it, because nobody outside that vendor holds the key it was applied with. NeverPrompted checks for a watermark's statistical signature and reduces detectable AI-style evidence in the wording itself; it doesn't promise to beat a system it has no access to.",
        ],
      },
    ],
    faq: [
      {
        question: 'Does this replace our style guide or editorial review?',
        answer:
          "No. It catches a specific, narrow thing: phrasing patterns that read as generic AI output regardless of whether they're accurate or on-brief. Your style guide governs tone, claims and brand rules; an editor still needs to check those. Think of this as one more automated pass, like a grammar checker, not a substitute for editorial judgement.",
      },
      {
        question: 'Will using this on every post slow the team down?',
        answer:
          "It's built to run fast enough to sit in a normal editing pass, since it's entirely on-device with no upload or server round trip. Most drafts take a few seconds to check. The rewrite step is the part to budget for since you're reviewing a diff, but you control how much of the draft it touches by adjusting the rewrite strength.",
      },
      {
        question: 'Can we use this to check a freelancer’s or contractor’s submitted copy instead of our own drafts?',
        answer:
          "That's not what NeverPrompted is built for. It's designed for checking and improving your own writing, not for screening someone else's work before you accept it. If you need to evaluate submissions from writers you don't control, that's a different problem with different stakes, and our sibling product Learnaway (learnaway.ai) is built for exactly that.",
      },
    ],
  },
  {
    slug: 'bloggers-and-seo-writers',
    group: 'for',
    title: 'For bloggers and SEO writers',
    metaTitle: 'Google rewards real experience: check your draft still shows it',
    metaDescription:
      'Google’s own guidance rewards content that demonstrates first-hand experience and a distinct voice. Check your draft against real reference prose before you publish, entirely on-device.',
    intro:
      "Google has been explicit for a while now: it wants to rank content that shows first-hand experience, a specific point of view, someone who actually did the thing. And readers, independent of any algorithm, bounce off prose that sounds like it was assembled rather than lived. If your process runs a draft through an AI assistant to speed up the first pass, the risk isn't that a detector catches you, it's that the assistant quietly sanded off the one thing that was supposed to make the post worth ranking: your voice, and your specific experience of the thing you're writing about.",
    sections: [
      {
        heading: 'Search guidance and reader trust are pointing the same direction',
        body: [
          "You don't need to guess at Google's algorithm to know this matters. Independently of ranking, a reader who lands on a \"how I fixed my sourdough starter\" post that reads like generic advice, no specific failure, no specific fix, no specific voice, leaves without reading to the end, and that behaviour is itself a ranking signal. AI-flavoured prose tends to default to the general case: safe claims, hedged advice, no opinion strong enough to be wrong about. That's the opposite of what both Google's guidance and an actual reader are looking for.",
          "This isn't an argument against using AI to draft faster. It's an argument for checking, before you publish, whether the draft that came out still sounds like someone who was actually there, or whether it's drifted toward the median voice that a lot of assistants converge on when left unedited.",
        ],
      },
      {
        heading: 'What the check actually measures',
        body: [
          "NeverPrompted runs entirely in your browser: your draft never leaves your machine. It checks for a statistical AI watermark, and separately scores how far your draft's style sits from a reference corpus of real contemporary writing, uniform sentence length, a narrow set of stock transitions (\"in today's world\", \"it's important to note\"), hedging patterns that appear regardless of whether hedging is warranted. None of that is about whether the content is accurate or well-researched. It's specifically about whether the wording reads as distinct or as interchangeable.",
          "Where it flags something, it shows you a rewrite candidate and a diff rather than just replacing the text, because you know your subject and your voice better than any tool does. You're reviewing suggested edits and deciding what to keep. Turn the rewrite strength up if you want it to touch more of the draft, or down if you just want the obvious tells cleaned up and everything else left as you wrote it.",
        ],
      },
      {
        heading: 'What this can’t promise, and what to do about the rest',
        body: [
          "Nothing here guarantees a ranking boost, and no honest tool would claim that: search algorithms weigh far more than sentence-level style, and any product promising a guaranteed rank improvement from a text checker is overselling. What NeverPrompted can do is give you a concrete, repeatable check for one specific failure mode: prose that's drifted toward generic AI phrasing without you noticing, because you read your own draft too many times to hear it fresh.",
          "It's also worth saying plainly: if a piece of text you're checking was watermarked by a vendor you have no relationship with, no tool including this one can guarantee defeating that mark, since only the vendor holds the key it was applied with. NeverPrompted's watermark check reports the statistical signature it finds; the rewrite tool separately reduces detectable AI-style evidence in your own wording. Free covers unlimited checking plus a weekly rewrite budget, which is usually enough for a regular publishing schedule; Pro removes the limit and adds a dated PDF report if you want a record of what you checked before you hit publish.",
        ],
      },
    ],
    faq: [
      {
        question: 'Does passing the check mean my post will rank better?',
        answer:
          "No, and be wary of anyone who tells you a text checker can guarantee that. Ranking depends on far more than sentence-level style: topical authority, backlinks, page experience, and plenty else. What this checks is narrower and more useful for its purpose, whether your wording still reads as a distinct voice rather than generic AI phrasing.",
      },
      {
        question: 'I edit AI drafts heavily already. Is this still useful?',
        answer:
          "Often, yes, because heavy editing tends to fix content and structure while leaving sentence-level patterns intact, the specific transitions and rhythms that make prose read as AI-smoothed are easy to miss when you're focused on facts and flow. Running a check catches what a normal edit pass tends to skip past.",
      },
      {
        question: 'Can I use this to check whether someone else’s guest post or submitted article was AI-written?',
        answer:
          "That's a different use case from what NeverPrompted is for. It's built to check and improve your own writing before you publish it, not to screen or judge someone else's submitted work. For evaluating other people's writing, our sibling product Learnaway (learnaway.ai) is the tool built for that job.",
      },
    ],
  },
  {
    slug: 'non-native-english-professionals',
    group: 'for',
    title: 'For non-native English professionals who polish with AI',
    metaTitle: 'Polishing your English with AI shouldn’t erase your own voice',
    metaDescription:
      'Using an AI assistant to clean up grammar is normal and reasonable. Check that the polish hasn’t homogenised your actual phrasing into generic AI prose, entirely on-device.',
    intro:
      "You write fluently, in your second, third, or fourth language, and you run it through an assistant to catch grammar you're less sure of. That's not a shortcut, it's what any careful writer does when writing outside their first language. The problem is what tends to happen next: the assistant doesn't just fix your grammar, it also flattens your actual phrasing, the word order and idiom choices that mark your writing as yours, into the generic register it defaults to. You end up correct and unrecognisable in the same paragraph.",
    sections: [
      {
        heading: 'This isn’t about hiding that you used help',
        body: [
          "Let's be clear about what this page is and isn't. Using an assistant to check grammar, catch awkward constructions, or confirm a phrase sounds natural is a completely reasonable thing to do, and nobody honest would tell you to stop. The issue is a side effect: heavy AI polishing doesn't stop at grammar, it tends to overwrite your actual sentence rhythm and word choices with the assistant's own preferred phrasing, which is often blander and more uniform than what you'd have written with just the grammar fixed.",
          "That matters for two separate reasons. First, your writing stops sounding like you, which is a loss on its own terms if you've spent years developing a professional voice in a second language. Second, ironically, heavily-smoothed AI phrasing is exactly the pattern that trips AI-detection systems, meaning the polish you used to sound more careful can end up making careful, genuine writing look machine-generated.",
        ],
      },
      {
        heading: 'Checking what changed, and why',
        body: [
          "NeverPrompted runs entirely on your device, nothing you paste is ever uploaded. It checks for a statistical AI watermark and, separately, measures how far your text's style has drifted from a reference corpus of real contemporary prose, catching things like uniform sentence length, stock transitional phrases, and hedging patterns that read as generic rather than as your idiom.",
          "Where the assistant's polish went further than grammar and started overwriting your actual phrasing, the rewrite tool can push back the other way: targeting the specific AI tells (stock phrases, em dashes used as connectors, unnaturally even sentence rhythm) while preserving your meaning and, as much as the settings allow, your original word choices. It shows a diff before anything is applied, so you're deciding, sentence by sentence, whether a change is a genuine grammar fix worth keeping or a flattening you'd rather undo.",
        ],
      },
      {
        heading: 'What honest limits look like here',
        body: [
          "No tool, this one included, can promise that your writing will never be misjudged by someone else's detector, especially since detectors are known to flag non-native phrasing patterns more often even when nothing was AI-generated. What NeverPrompted can do is give you a concrete way to check your own draft before you send it, and a way to dial back over-polishing that erased your actual voice, which is generally the more useful problem to solve since it's the one you can actually act on.",
          "It's also worth saying directly: if a document you're checking carries a genuine watermark from an AI vendor you have no relationship with, nobody outside that vendor holds the key needed to guarantee defeating it, and no honest tool claims otherwise. Free gives you unlimited checking and a weekly rewrite budget; Pro removes the weekly limit, upgrades the on-device rewriting model, and adds a dated PDF report if you need a record of what you checked before submitting something important.",
        ],
      },
    ],
    faq: [
      {
        question: 'Is it dishonest to use an AI assistant to fix my grammar?',
        answer:
          "No. Using tools to check and correct language you're less confident in is a normal part of writing outside your first language, and no reasonable reader or institution expects otherwise. The concern this page addresses is narrower: that the same polishing step can quietly overwrite your actual phrasing, not just your grammar errors.",
      },
      {
        question: 'Will this make my writing sound less fluent or more clunky, to compensate?',
        answer:
          "No, that's not the goal. The rewrite tool targets specific AI tells (stock transitions, over-even sentence rhythm, unnecessary hedging), not fluency itself. It's editing toward your own natural phrasing where the assistant over-smoothed it, not toward incorrect or informal English.",
      },
      {
        question: 'My colleague asked me to check if their report sounds AI-written. Can I use NeverPrompted for that?',
        answer:
          "NeverPrompted is built for checking and improving your own writing, not someone else's. Using it to evaluate a colleague's or student's submitted work is a different situation with different stakes and expectations. If you need to screen writing that isn't yours, our sibling product Learnaway (learnaway.ai) is built for that purpose.",
      },
    ],
  },
  {
    slug: 'students-before-submitting',
    group: 'for',
    title: 'For students checking an essay before they submit it',
    metaTitle: 'Check your essay before you submit it, not after it’s flagged',
    metaDescription:
      'Check your own essay for AI-style phrasing and a statistical watermark before you hand it in, entirely on-device. Confidence before submission, not defence after an accusation.',
    intro:
      "This is for before, not after. If you're here because you've already been accused of something, that's a different situation with different urgency, and a different page exists for it. This one is for the ordinary case: you've written an essay, you used an AI assistant somewhere in the process (to brainstorm, to check a paragraph, to tidy a sentence you couldn't get right), and you want to know, before you hand it in, whether it reads like you or like a template.",
    sections: [
      {
        heading: 'Why check before, when nothing’s wrong yet',
        body: [
          "Most students who get flagged aren't cheating, they've written a genuine essay that happens to read as generic in places, often because a grammar pass or a \"make this sound better\" prompt smoothed a paragraph into the same safe, elevated register that a lot of AI writing defaults to. You can't always hear that in your own writing, you've read it too many times. A check before submission tells you, concretely, whether any part of your essay carries the statistical patterns that make markers or detection software raise an eyebrow, while there's still time to fix it and nothing is on the line yet.",
          "That's a fundamentally calmer place to be than checking after a professor has already raised a concern. You're not defending a grade, you're doing a sanity check on your own work, the same way you'd proofread for typos before you hit submit.",
        ],
      },
      {
        heading: 'What the check looks at, specifically',
        body: [
          "Everything happens in your browser: your essay is never uploaded anywhere, which matters when it's coursework you haven't submitted yet. NeverPrompted checks for a statistical AI watermark, in case a tool you used applied one, and separately measures how far your essay's prose style sits from a reference corpus of real, non-AI writing: things like unnaturally even sentence length, stock connective phrases, and hedging that shows up regardless of whether you're actually unsure.",
          "If it flags a section, you get a suggested rewrite and a diff, not an automatic replacement, so you decide what to accept. The point isn't to disguise anything, it's to catch places where your own argument got flattened into generic phrasing during editing, and put your actual voice and reasoning back into the sentence.",
        ],
      },
      {
        heading: 'Being honest about what a check can and can’t settle',
        body: [
          "A clean result here isn't a certificate and it isn't proof of anything to a third party; it's information for you, about your own draft, before you submit it. If your essay happens to carry an actual watermark from an AI system, no tool, including this one, can guarantee defeating it, because nobody outside the vendor that applied it holds the key needed to do that. What NeverPrompted can honestly tell you is whether the wording you wrote (or the wording an editing pass left you with) reads as distinct prose or as generic AI-flavoured phrasing, which is the part actually within your control.",
          "Free gives you unlimited checking, which covers the normal case of running a check before you submit each piece of coursework, plus a weekly budget for the rewrite tool if you want help fixing a flagged section. Pro removes that weekly limit and adds a dated PDF report, useful if your institution wants a record of when you checked a piece of work relative to your submission date.",
        ],
      },
    ],
    faq: [
      {
        question: 'Is it cheating to use this before I submit an essay?',
        answer:
          "No. Checking your own writing before you hand it in is no different from proofreading or running a grammar checker, you're reviewing your own work, not generating new content or getting someone else to do the thinking. The rewrite tool edits toward clearer, more natural phrasing of what you already wrote; it doesn't invent arguments or content for you.",
      },
      {
        question: 'What if I already used an AI assistant and I’m not sure how much I should have?',
        answer:
          "That's a question for your institution's specific policy, which varies a lot between schools and courses, and this tool can't answer it for you. What it can do is show you where your current draft reads as generic AI phrasing so you can decide, in line with your own policy, whether to revise those sections in your own words.",
      },
      {
        question: 'Can I use this to check a classmate’s essay for them, or one I’m marking?',
        answer:
          "That's not what this is for. NeverPrompted is built for checking your own writing, not for screening someone else's essay, whether as a classmate doing a favour or in any kind of marking or grading capacity. For evaluating someone else's submitted work, that's the job of our sibling product, Learnaway (learnaway.ai).",
      },
    ],
  },
  {
    slug: 'linkedin-and-social-writers',
    group: 'for',
    title: 'For people writing their voice on LinkedIn and social',
    metaTitle: 'When your AI-polished posts start sounding like everyone else’s',
    metaDescription:
      'People followed you for your specific voice. Check that AI-assisted LinkedIn and social posts haven’t smoothed it into the same generic register everyone else’s posts have, on-device.',
    intro:
      "Somebody followed you, specifically, because of how you write, not because of a topic anyone could cover. Then you started drafting posts with an assistant to save time, and a strange thing happened: the posts got more polished and less interesting, in the exact same way as everyone else's AI-polished posts. Now your feed and three other people's feeds all sound like the same slightly upbeat, slightly hedgy, bullet-point-then-em-dash voice, and it isn't your voice.",
    sections: [
      {
        heading: 'Why AI-assisted posts converge on the same voice',
        body: [
          "This isn't a coincidence, it's what happens when a lot of people use the same kind of assistant with the same kind of prompt (\"make this sound more professional\", \"tighten this up\") without checking what came out. Assistants have a default register: confident but hedged, structured in short punchy lines, fond of a particular kind of dash and a particular kind of \"here's the thing\" opener. Apply that to a hundred different people's raw thoughts and you get a hundred posts that read as roughly the same person.",
          "The people who built a following on LinkedIn or elsewhere usually did it with a specific, sometimes odd, recognisably theirs way of putting things: a particular kind of bluntness, a particular sense of humour, sentences that don't all land the same length. That's exactly what gets sanded off first when a post goes through a heavy AI polish pass, because it's also the part that reads as \"unpolished\" to an assistant optimising for smoothness.",
        ],
      },
      {
        heading: 'Checking a draft before you post it',
        body: [
          "NeverPrompted runs entirely in your browser, nothing you paste gets uploaded, which is worth knowing if you're drafting something you haven't posted yet. It checks for a statistical AI watermark, and separately measures how far a draft's style sits from a reference corpus of real, varied contemporary writing, catching the specific patterns that mark a post as generically AI-polished: uniform sentence rhythm, the same handful of stock openers and transitions, an em dash doing a comma's job.",
          "Where it finds those patterns, it proposes a rewrite and shows you the diff rather than just handing back a replacement post, since the whole point is that you know your own voice better than any model does. You accept or reject each change. Turn the rewrite strength down if you want it to only fix the obvious tells and leave your phrasing otherwise untouched, or up if a draft needs more work to sound like you again.",
        ],
      },
      {
        heading: 'The honest version of what this buys you',
        body: [
          "This won't make a post go viral, and any tool that promised that would be lying to you, engagement depends on far more than sentence-level style. What it can do is give you a fast, private way to catch when a draft has drifted from your actual voice toward the generic AI-assisted register, before you post it and someone in your replies notices before you do.",
          "It's also worth being direct: if a platform or a third party is checking your post against an undisclosed AI watermark from some other vendor, no tool, this one included, can guarantee getting past that check, since only the vendor that applied the mark holds the key to it. NeverPrompted's watermark check reports what it can detect about that; separately, the rewrite tool reduces detectable AI-style evidence in your actual wording, which is the part you can control directly. Free covers unlimited checking and a weekly rewrite budget, which is plenty for a normal posting rhythm; Pro removes the limit and adds a better rewriting model for when you're publishing more often.",
        ],
      },
    ],
    faq: [
      {
        question: 'Doesn’t everyone use AI to help write LinkedIn posts now?',
        answer:
          "Plenty of people do, and there's nothing wrong with using an assistant to draft faster. The issue this addresses is specific: heavy AI polishing tends to converge toward the same generic register regardless of who's using it, which works against the entire reason people build a following around a specific voice in the first place.",
      },
      {
        question: 'Will fixing the AI tells make my post sound less put-together?',
        answer:
          "It should do the opposite, since \"put-together\" and \"generic\" aren't the same thing. The tool targets specific patterns (stock phrases, an em dash used as a connector, uniform sentence length), not polish itself. A post can be clean and specific at once; that combination is usually what made your writing worth following.",
      },
      {
        question: 'Can I run other people’s posts through this to see if they used AI?',
        answer:
          "That's not what NeverPrompted is designed for. It checks and improves your own writing; using it to judge someone else's posts is a different use case with different expectations attached. If you need to evaluate content that isn't yours, that's the kind of task our sibling product Learnaway (learnaway.ai) is built for.",
      },
    ],
  },
  {
    slug: 'freelance-copywriters',
    group: 'for',
    title: 'For freelance copywriters protecting their own voice',
    metaTitle: 'Clients want AI-detection-clean copy. Your craft can still show',
    metaDescription:
      'More clients ask for copy that won’t trip an AI detector, and generic-sounding copy is bad for your reputation regardless. Check and rewrite your own drafts, entirely on-device.',
    intro:
      "Two things are happening to freelance copywriters at once: more clients are now writing \"no AI-detectable content\" into briefs, sometimes before they've even read your draft, and separately, copy that reads as generic hurts your reputation on its own terms, no detector required, because a client who's paying for a distinct voice can tell when they got the median voice instead. Both problems have the same fix, and it isn't writing everything from scratch by hand out of principle.",
    sections: [
      {
        heading: 'Two different pressures, one shared cause',
        body: [
          "The detection-clause pressure is new and getting more common: clients have been burned by contractors handing back lightly-edited AI output, so some now write explicit AI-detection requirements into contracts, sometimes with vague or unrealistic standards attached (see below). The reputational pressure is older and more fundamental: a copywriter's actual product is a distinct voice applied to a client's problem, and if your drafts read as interchangeable with what any assistant would produce unedited, you're competing on price against that assistant, which is a fight you'll lose.",
          "Both problems trace back to the same habit: using AI assistance to speed up drafting (reasonable, common, not something to feel bad about) without a deliberate check afterward for whether the output still sounds like you, with your actual sentence rhythm and phrasing choices, rather than the assistant's default register.",
        ],
      },
      {
        heading: 'Building the check into delivery',
        body: [
          "NeverPrompted runs entirely in your browser, nothing you paste ever leaves your machine, which matters for client work under NDA. It checks for a statistical AI watermark, in case a drafting tool you used applied one, and separately scores how far the draft's style sits from a reference corpus of real, varied prose: the specific tells, uniform sentence length, stock transitions, an em dash standing in for a comma, that make copy read as assistant-smoothed rather than crafted.",
          "Where something's flagged, you get a proposed rewrite and a diff, so you're editing your own copy with the tool's help, not handing the client something the tool wrote on its own. That distinction matters for your invoice as much as your conscience: you can genuinely say you reviewed and approved every change. Set the rewrite strength lighter for a client's brand voice that's already close to what you want, or heavier for a rushed first draft that needs more work.",
        ],
      },
      {
        heading: 'What to tell a client who wants a guarantee',
        body: [
          "Some briefs now ask for copy that's \"guaranteed\" against a named AI detector, and it's worth knowing why no honest freelancer, or honest tool, can promise that outright: detectors vary, some check for statistical watermarks applied by a specific AI vendor at generation time, which nobody outside that vendor holds the key to defeating, and others make style-based guesses that can misfire on genuinely human writing too. What you can promise, honestly, is that you checked the copy yourself, reduced the specific AI-style tells you have control over, and can show the client a dated record of that check.",
          "That's what the Pro plan's PDF report is for: a dated record you can attach to a delivery, showing you ran a specific check before handing work over. Free gives you unlimited checking plus a weekly rewrite budget, workable for occasional projects; Pro removes the weekly limit, upgrades the rewriting model, and adds that report, which is the more useful tier once detection-clean delivery is a standing part of your client contracts rather than an occasional request.",
        ],
      },
    ],
    faq: [
      {
        question: 'A client’s brief demands copy “guaranteed” to pass their AI detector. What do I tell them?',
        answer:
          "Be upfront that no honest tool or writer can guarantee passing an undisclosed detector, especially one checking for a statistical watermark applied by a specific AI vendor, since only that vendor holds the key needed to defeat it reliably. What you can offer instead is a documented process: you checked the copy yourself, addressed the specific AI-style patterns within your control, and can show a dated record of that check.",
      },
      {
        question: 'Does this replace my own editing pass, or add to it?',
        answer:
          "It adds a specific, narrow check that a normal editing pass often misses, sentence-level patterns like uniform rhythm or stock transitions, because when you're editing for the client's message and structure, those small tells are easy to read past. Your editing judgement on voice, tone and client fit still does the rest.",
      },
      {
        question: 'A client asked me to run their old copy from another writer through this. Should I?',
        answer:
          "That's outside what NeverPrompted is built for. It's designed to check and improve your own writing, not to evaluate or screen work someone else wrote. If a client needs another writer's submitted work assessed, that's a different job, and our sibling product Learnaway (learnaway.ai) is built to do it.",
      },
    ],
  },
]
