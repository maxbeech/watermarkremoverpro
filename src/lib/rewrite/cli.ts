#!/usr/bin/env node
/**
 * The `markwitness-rewrite` CLI: the same rewrite engine the browser UI and
 * MCP server use, runnable directly in a caller's own process. This is what
 * "API access" means for the rewrite feature (see docs/REWRITE_PHILOSOPHY.md
 * and README.md): there is no REST endpoint for it, on any tier, because
 * that would mean sending document text to a MarkWitness-operated server,
 * which this feature never does. Install and run in your own process
 * instead:
 *
 *   npx @markwitness/rewrite-engine --strength balanced input.txt
 *   cat input.txt | npx @markwitness/rewrite-engine --strength aggressive --tier pro
 *   npx @markwitness/rewrite-engine --model advanced --tier pro input.txt -o output.txt
 *
 * Reads from a file argument or stdin, writes to a file (-o) or stdout.
 * Never makes a network call with your document text, on any tier, on any
 * flag combination. --model advanced downloads real model weights from the
 * Hugging Face CDN on first use (cached under ~/.cache/markwitness/models);
 * that download never carries your document.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { reduceEvidence, rewriteDocument, REWRITE_LIMITS } from './index'
import { OPEN_REFERENCE_KEY } from '../detector/keys'
import type { Strength, Tier } from './types'

interface ParsedArgs {
  inputFile?: string
  outputFile?: string
  strength: Strength
  tier: Tier
  model: 'standard' | 'advanced'
  language?: string
  json: boolean
  help: boolean
}

const STRENGTHS: Strength[] = ['preserve', 'balanced', 'aggressive', 'regenerate']
const TIERS: Tier[] = ['free', 'pro']

function parseArgs(argv: string[]): ParsedArgs {
  const result: ParsedArgs = { strength: 'balanced', tier: 'free', model: 'standard', json: false, help: false }
  const positional: string[] = []

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    switch (arg) {
      case '-h':
      case '--help':
        result.help = true
        break
      case '-o':
      case '--output':
        result.outputFile = argv[++i]
        break
      case '--strength': {
        const value = argv[++i] as Strength
        if (!STRENGTHS.includes(value)) throw new Error(`--strength must be one of: ${STRENGTHS.join(', ')}`)
        result.strength = value
        break
      }
      case '--tier': {
        const value = argv[++i] as Tier
        if (!TIERS.includes(value)) throw new Error(`--tier must be one of: ${TIERS.join(', ')}`)
        result.tier = value
        break
      }
      case '--model': {
        const value = argv[++i]
        if (value !== 'standard' && value !== 'advanced') throw new Error('--model must be "standard" or "advanced"')
        result.model = value
        break
      }
      case '--language':
        result.language = argv[++i]
        break
      case '--json':
        result.json = true
        break
      default:
        if (arg.startsWith('-')) throw new Error(`Unknown flag: ${arg}`)
        positional.push(arg)
    }
  }

  if (positional.length > 0) result.inputFile = positional[0]
  return result
}

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (chunk) => (data += chunk))
    process.stdin.on('end', () => resolve(data))
    process.stdin.on('error', reject)
  })
}

const HELP = `markwitness-rewrite: reduce detectable AI-style evidence in text, entirely on-device.

Usage:
  markwitness-rewrite [options] [input-file]
  cat input.txt | markwitness-rewrite [options]

Options:
  -o, --output <file>   Write the revised text here instead of stdout.
      --strength <s>    preserve | balanced | aggressive | regenerate (default: balanced)
      --tier <t>        free | pro (default: free). Both are unlimited-use; pro generates
                         more candidates per passage and uses the extended AI-tell library.
      --model <m>       standard | advanced (default: standard). "advanced" downloads and
                         runs a real local LLM (Qwen2.5) on first use; "standard" is the
                         instant, no-download rule-based engine. Both are 100% on-device.
      --language <code> Force a language instead of auto-detecting (en, es, fr, de, pt).
      --json             Print the full RewriteResult as JSON instead of just the revised text.
  -h, --help             Show this help.

Never sends your document anywhere, on any tier, on any flag combination. See
${'https://markwitness.helm7.com/docs/mcp'} and docs/REWRITE_PHILOSOPHY.md.
`

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    process.stdout.write(HELP)
    return
  }

  const text = args.inputFile ? readFileSync(args.inputFile, 'utf8') : await readStdin()
  if (text.trim().length === 0) {
    process.stderr.write('No input text provided (empty file/stdin).\n')
    process.exit(1)
  }

  const request = { text, language: args.language, strength: args.strength, tier: args.tier }

  const result =
    args.model === 'advanced'
      ? await (async () => {
          const { createTransformersNodeBackend } = await import('./backend/node')
          const backend = createTransformersNodeBackend(args.tier)
          process.stderr.write(`Using advanced engine: ${backend.id} (downloads/caches on first use)...\n`)
          return rewriteDocument(request, backend, [OPEN_REFERENCE_KEY])
        })()
      : await reduceEvidence(request, [OPEN_REFERENCE_KEY])

  if (result.status !== 'ok') {
    process.stderr.write(`Rewrite failed: ${result.error}\n`)
    process.exit(1)
  }

  const output = args.json ? JSON.stringify(result, null, 2) : result.revisedText

  if (args.outputFile) {
    writeFileSync(args.outputFile, output)
  } else {
    process.stdout.write(output + (args.json ? '' : '\n'))
  }

  if (!args.json) {
    process.stderr.write(`\n${result.passages.filter((p) => p.chosen !== null).length}/${result.passages.length} passages rewritten, ${result.tellChangeCount} AI-tell swaps, ${result.roundsUsed} round(s).\n`)
    for (const limit of REWRITE_LIMITS) process.stderr.write(`- ${limit}\n`)
  }
}

main().catch((err) => {
  process.stderr.write(`${(err as Error).message}\n`)
  process.exit(1)
})
