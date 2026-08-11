/**
 * MarkWitness MCP server.
 *
 * Exposes the provenance-mark check as an agent-callable capability, so an agent
 * assembling a deliverable can disclose the provenance of text BEFORE handing it
 * over, rather than the recipient discovering it afterwards.
 *
 * Run it over stdio:
 *   npx tsx mcp/server.ts
 *
 * Client configuration:
 *   { "mcpServers": { "markwitness": { "command": "npx",
 *       "args": ["-y", "tsx", "/path/to/mcp/server.ts"],
 *       "env": { "MARKWITNESS_API_KEY": "mw_live_…" } } } }
 *
 * Two modes, deliberately:
 *  - With no API key, `check_document` runs the engine LOCALLY, in this process,
 *    against the published reference key. Nothing leaves the machine and nothing
 *    is recorded or billed.
 *  - With MARKWITNESS_API_KEY set, calls go to the hosted endpoint, which adds
 *    any vendor or institution detection keys that deployment holds, records the
 *    check against the account's history, and meters it.
 *
 * WHAT THIS SERVER WILL NEVER EXPOSE: any tool that removes, weakens,
 * paraphrases around, or reduces a provenance mark. There is no such tool, no
 * parameter that approximates one, and none will be added. An agent-callable
 * mark remover would be exactly the bulk laundering surface that turns an
 * individual diagnostic into an evasion service, and it is the one thing this
 * product is defined by not doing.
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
        removalCapability:
          'None. MarkWitness does not remove, weaken, paraphrase around or reduce a provenance mark on any tier or surface, and no such tool will be added.',
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
