/**
 * MarkWitness MCP server.
 *
 * Exposes two complementary capabilities: checking a document for a
 * provenance mark, and reducing the detectable AI-style evidence in one (both
 * statistical watermark signal, where structurally possible, and human
 * perceptible "AI tells" like em dashes and stock phrasing). See
 * docs/REWRITE_PHILOSOPHY.md for what the second capability does and does not
 * claim.
 *
 * Run it over stdio:
 *   npx tsx mcp/server.ts
 *
 * Client configuration:
 *   { "mcpServers": { "markwitness": { "command": "npx",
 *       "args": ["-y", "tsx", "/path/to/mcp/server.ts"],
 *       "env": { "MARKWITNESS_API_KEY": "mw_live_…" } } } }
 *
 * check_document has two modes:
 *  - With no API key, it runs the engine LOCALLY, in this process, against the
 *    published reference key. Nothing leaves the machine and nothing is
 *    recorded or billed.
 *  - With MARKWITNESS_API_KEY set, calls go to the hosted endpoint, which adds
 *    any vendor or institution detection keys that deployment holds, records
 *    the check against the account's history, and meters it.
 *
 * reduce_ai_evidence and calibrate_text have ONE mode, always: they run
 * entirely in this process. There is no hosted branch for either, on any
 * tier, ever. Unlike check_document, they never send document text
 * anywhere, because reducing evidence is more sensitive than measuring it and
 * gets no exception to the on-device guarantee. The first call may download
 * this process's own (small) rule tables the first time; it never uploads
 * anything.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { analyzeDocument, ENGINE_VERSION, resolveLanguage } from '../src/lib/detector'
import { loadBaseline } from '../src/lib/detector/baselines'
import { OPEN_REFERENCE_KEY, describeKey } from '../src/lib/detector/keys'
import { SUPPORTED_LANGUAGES, LANGUAGE_NAMES, type LanguageCode } from '../src/lib/detector/languages'
import type { Baseline } from '../src/lib/detector/distributional'
import { countWords } from '../src/lib/detector/tokenize'
import { API_PRICE_PENCE_PER_1K_WORDS } from '../src/lib/site'
import { calibrateText } from '../src/lib/calibrate'
import { reduceEvidence, rewriteDocument, REWRITE_LIMITS } from '../src/lib/rewrite'
import type { Strength, Tier } from '../src/lib/rewrite'
// The advanced (local LLM) backend is imported lazily, inside the one branch
// that uses it. A static import pulls onnxruntime's native binaries into the
// bundled, zero-install server (about 1.3 MB of .node files nobody who never
// asks for model: "advanced" will ever execute) and slows every cold start
// for a capability most calls do not use.

const API_BASE = (process.env.MARKWITNESS_API_URL || 'https://markwitness.helm7.com').replace(/\/$/, '')
const API_KEY = process.env.MARKWITNESS_API_KEY || ''

const server = new Server({ name: 'markwitness', version: ENGINE_VERSION }, { capabilities: { tools: {} } })

const checkDocumentSchema = {
  type: 'object',
  properties: {
    text: { type: 'string', description: 'The document text to check. Sent verbatim; not stored in local mode.' },
    language: {
      type: 'string',
      enum: [...SUPPORTED_LANGUAGES],
      description:
        'Force a language instead of measuring it. Omit to let the engine identify it; if it cannot do so confidently it will say so rather than guess.',
    },
    granularity: {
      type: 'string',
      enum: ['sentence', 'paragraph'],
      description: 'Passage granularity for the per-passage breakdown. Defaults to sentence.',
    },
  },
  required: ['text'],
  additionalProperties: false,
} as const

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'check_document',
      description:
        'Check a document for a statistical AI provenance mark (green-list watermark) and report ' +
        'the signal strength with a confidence band, a per-passage breakdown, and the stated ' +
        'limits of the method.\n\n' +
        'Call this before handing text to a person or system that cares how it was produced. ' +
        'disclosing provenance up front is cheaper than being asked afterwards.\n\n' +
        'READ THE LIMITS IN THE RESPONSE BEFORE ACTING ON IT. Two of them decide how the result ' +
        'may be used: a detected mark is NOT proof of authorship, and an absent mark is NOT proof ' +
        'of human authorship. A green-list mark is keyed, and no model vendor publishes its ' +
        'detection key, so "no mark detected" always means "under the keys this deployment holds" ' +
        'which the response lists explicitly. Do not report this result as a verdict on who ' +
        'wrote something.\n\n' +
        (API_KEY
          ? `Configured with an API key: calls go to ${API_BASE}, which applies any vendor keys that deployment holds, saves the check to the account history, and meters it at ${API_PRICE_PENCE_PER_1K_WORDS}p per 1,000 words.`
          : 'No MARKWITNESS_API_KEY is set, so this runs locally in this process against the published open reference key only. Nothing leaves the machine, nothing is recorded, and nothing is billed. Set MARKWITNESS_API_KEY to use vendor keys and saved history.'),
      inputSchema: checkDocumentSchema,
    },
    {
      name: 'describe_method',
      description:
        'Describe what MarkWitness measures, which detection keys are available in the current ' +
        'mode, which languages have measured baselines, and the stated limits, without sending ' +
        'any document. Call this first if you need to decide whether a check_document result ' +
        'will answer your question.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    },
    {
      name: 'calibrate_text',
      description:
        'A lightweight, fully deterministic synonym-substitution pass over a document\'s word ' +
        'frequencies. For a fuller pass that also targets the passages a real check flags and ' +
        'removes stylistic AI tells (em dashes, stock phrasing), use reduce_ai_evidence instead. ' +
        'All processing is local to this process; no text leaves the machine.\n\n' +
        'Returns suggested substitutions with before/after metrics, so the writer can decide ' +
        'which changes to accept.',
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'The text to calibrate.' },
          language: {
            type: 'string',
            enum: [...SUPPORTED_LANGUAGES],
            description: 'Language (optional; auto-detected if omitted).',
          },
          mode: {
            type: 'string',
            enum: ['preview', 'apply'],
            description: 'Preview mode returns suggestions without commitment; apply mode applies them.',
          },
        },
        required: ['text'],
        additionalProperties: false,
      },
    },
    {
      name: 'reduce_ai_evidence',
      description:
        'Rewrite a document, on-device, to reduce detectable AI-style evidence: both the ' +
        'statistical watermark signal the checker measures (where structurally possible) and ' +
        'human-perceptible AI tells such as em dashes and stock phrasing ("delve into", ' +
        '"moreover", triadic lists). Only rewrites the passages that actually carry evidence, ' +
        'using the same per-passage findings check_document would report. A passage with no safe ' +
        'candidate (one that preserves its numbers, negations and named entities, and stays ' +
        'above the similarity floor for the requested strength) is left completely unchanged ' +
        'rather than replaced with something unsafe.\n\n' +
        'CANNOT GUARANTEE defeating a specific model vendor\'s undisclosed watermark. Nobody ' +
        'outside that vendor holds the key it was applied with, so no tool honestly can. Heavier ' +
        'strengths trade fidelity to the original wording for a larger evidence reduction, so ' +
        'review the diff before relying on the result. This always runs entirely in this process: ' +
        'there is no hosted mode, on any tier, unlike check_document. See docs/REWRITE_PHILOSOPHY.md.',
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'The document to rewrite. Processed locally; never transmitted.' },
          language: {
            type: 'string',
            enum: [...SUPPORTED_LANGUAGES],
            description: 'Language (optional; auto-detected if omitted).',
          },
          strength: {
            type: 'string',
            enum: ['preserve', 'balanced', 'aggressive', 'regenerate'],
            description:
              'How much change to allow, in exchange for a larger evidence reduction. "preserve" only ' +
              'touches passages a real check would flag as a finding; "regenerate" rewrites every ' +
              'passage regardless of measured evidence. Defaults to "balanced".',
          },
          tier: {
            type: 'string',
            enum: ['free', 'pro'],
            description:
              'Free generates fewer candidates per passage with the core AI-tell library; pro generates ' +
              'more candidates for a better result and uses the extended tell library, which is where the ' +
              'announcement and marketing register lives ("we\'re thrilled to announce", "serves as a", ' +
              'promotional vocabulary). Both run the same on-device engine, unlimited use either way. ' +
              'Defaults to "free". If a result comes back with tellChangeCount 0 and a non-zero ' +
              'additionalTellsInExtendedLibrary, that number is how many further phrases tier "pro" would ' +
              'have swapped on this exact document, and re-running with it is usually what the user wants.',
          },
          model: {
            type: 'string',
            enum: ['standard', 'advanced'],
            description:
              '"standard" (default) is the deterministic rule-based engine: instant, no download. ' +
              '"advanced" runs a real small local LLM (Qwen2.5, 0.5B for free / 1.5B for pro tier) via ' +
              'onnxruntime-node, downloaded from the Hugging Face CDN and cached under ' +
              '~/.cache/markwitness/models on first use, never from a MarkWitness-operated server, and ' +
              'still on-device only. First call with "advanced" can take a while (model download); later ' +
              'calls reuse the cache. If the model cannot be loaded (offline, unsupported platform), this ' +
              'automatically falls back to "standard" and the response says so in `model`.',
          },
        },
        required: ['text'],
        additionalProperties: false,
      },
    },
  ],
}))

const baselines: Partial<Record<LanguageCode, Baseline>> = {}

async function runLocally(text: string, language?: string, granularity?: 'sentence' | 'paragraph') {
  const resolved = resolveLanguage(text, language)
  if (resolved.language && !baselines[resolved.language]) {
    try {
      baselines[resolved.language] = await loadBaseline(resolved.language)
    } catch {
      // The style channel then reports 'no_baseline' with its reason; the
      // watermark test still runs.
    }
  }
  return analyzeDocument(text, { keys: [OPEN_REFERENCE_KEY], language, granularity, baselines })
}

async function runHosted(text: string, language?: string, granularity?: 'sentence' | 'paragraph') {
  const res = await fetch(`${API_BASE}/api/v1/check`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ text, language, granularity }),
  })

  const body = await res.json().catch(() => null)
  if (!res.ok) {
    // Surface the endpoint's own explanation. An agent that gets "402
    // allowance_exceeded, 20 of 20 checks used this month" can do something
    // about it; one that gets a generic failure cannot.
    const message =
      (body && typeof body === 'object' && 'message' in body && String((body as Record<string, unknown>).message)) ||
      `${res.status} ${res.statusText}`
    throw new Error(`MarkWitness API: ${message}`)
  }
  return body
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  try {
    if (name === 'describe_method') {
      return json({
        engineVersion: ENGINE_VERSION,
        mode: API_KEY ? 'hosted' : 'local',
        endpoint: API_KEY ? `${API_BASE}/api/v1/check` : null,
        detectionKeys: API_KEY
          ? 'Determined by the hosted deployment; returned on every check as watermark.keysTested.'
          : [describeKey(OPEN_REFERENCE_KEY)],
        languages: SUPPORTED_LANGUAGES.map((code) => ({ code, name: LANGUAGE_NAMES[code] })),
        method: {
          watermark:
            'Keyed green-list test (Kirchenbauer et al. 2023). Distinct word bigrams are scored once each; the statistic is the one-proportion z test against the key’s expected green fraction.',
          style:
            'Register measurement against a per-language reference corpus of contemporary prose. Reports distance in standard deviations. This does NOT detect AI and is not evidence of authorship.',
          passages:
            'Per-passage findings are corrected for multiple comparisons (Benjamini-Hochberg) before any is reported.',
        },
        limits: [
          'A detected mark is not proof of authorship.',
          'An absent mark is not proof of human authorship.',
          'No model vendor publishes a detection key, so results apply only to the keys listed in the response.',
          'The test operates on word pairs, not a model’s own subword vocabulary; a vendor’s own detector can reach a different conclusion.',
        ],
        rewriteCapability: {
          tool: 'reduce_ai_evidence',
          summary:
            'Reduces detectable AI-style evidence (statistical and stylistic). Always runs on-device, ' +
            'in this process, on every tier. There is no hosted mode for this tool, unlike check_document.',
          limits: REWRITE_LIMITS,
        },
        pricing:
          API_KEY
            ? `${API_PRICE_PENCE_PER_1K_WORDS}p per 1,000 words, rounded up, billed per call.`
            : 'Local mode is free and unmetered.',
      })
    }

    if (name === 'check_document') {
      const text = typeof args?.text === 'string' ? args.text : ''
      if (text.trim().length === 0) {
        throw new Error('check_document requires a non-empty "text" argument.')
      }
      const language = typeof args?.language === 'string' ? args.language : undefined
      const granularity = args?.granularity === 'paragraph' ? 'paragraph' : undefined

      if (API_KEY) return json(await runHosted(text, language, granularity))

      const result = await runLocally(text, language, granularity)
      return json({
        result,
        mode: 'local',
        note: `Run locally against the open reference key only (${countWords(text)} words). No vendor detection key was applied, nothing was recorded, and nothing was billed.`,
      })
    }

    if (name === 'calibrate_text') {
      const text = typeof args?.text === 'string' ? args.text : ''
      if (text.trim().length === 0) {
        throw new Error('calibrate_text requires a non-empty "text" argument.')
      }
      const language = typeof args?.language === 'string' ? args.language : undefined
      const mode = args?.mode === 'apply' ? 'apply' : 'preview'

      const result = await calibrateText({
        text,
        language,
        mode,
        config: {
          confidenceThreshold: 0.7,
          maxRepeats: 3,
        },
      })

      return json({
        result,
        mode: 'local',
        note: `Calibration completed locally (${countWords(text)} words). No data was sent to external servers.`,
      })
    }

    if (name === 'reduce_ai_evidence') {
      const text = typeof args?.text === 'string' ? args.text : ''
      if (text.trim().length === 0) {
        throw new Error('reduce_ai_evidence requires a non-empty "text" argument.')
      }
      const language = typeof args?.language === 'string' ? args.language : undefined
      const strength = (typeof args?.strength === 'string' ? args.strength : 'balanced') as Strength
      const tier = (typeof args?.tier === 'string' ? args.tier : 'free') as Tier
      const modelChoice = (typeof args?.model === 'string' ? args.model : 'standard') as 'standard' | 'advanced'

      let result
      let model = 'standard (rule-based, no download)'
      if (modelChoice === 'advanced') {
        try {
          const { createTransformersNodeBackend } = await import('../src/lib/rewrite/backend/node')
          const backend = createTransformersNodeBackend(tier)
          result = await rewriteDocument({ text, language, strength, tier }, backend, [OPEN_REFERENCE_KEY])
          model = `advanced (${backend.id}; cached under ~/.cache/markwitness/models)`
        } catch (err) {
          // Real failure state, not a silent downgrade: the advanced model
          // genuinely could not load (offline on first use, unsupported
          // platform, out of memory), so this falls back to the
          // always-available rule-based engine and says exactly why.
          result = await reduceEvidence({ text, language, strength, tier }, [OPEN_REFERENCE_KEY])
          model = `standard (rule-based); advanced model unavailable: ${(err as Error).message}`
        }
      } else {
        result = await reduceEvidence({ text, language, strength, tier }, [OPEN_REFERENCE_KEY])
      }

      return json({
        result,
        mode: 'local',
        model,
        note: `Rewrite completed entirely in this process (${countWords(text)} words). Nothing was transmitted. This tool has no hosted mode on any tier.`,
      })
    }

    throw new Error(`Unknown tool "${name}".`)
  } catch (err) {
    // Fail loudly and specifically. A tool that returns a plausible-looking
    // empty result on error is worse than one that errors.
    return {
      isError: true,
      content: [{ type: 'text' as const, text: (err as Error).message }],
    }
  }
})

function json(payload: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }] }
}

async function main() {
  await server.connect(new StdioServerTransport())
  process.stderr.write(
    `markwitness MCP server ready (${API_KEY ? `hosted via ${API_BASE}` : 'local mode, open reference key only'})\n`,
  )
}

main().catch((err) => {
  process.stderr.write(`markwitness MCP server failed to start: ${err}\n`)
  process.exit(1)
})
