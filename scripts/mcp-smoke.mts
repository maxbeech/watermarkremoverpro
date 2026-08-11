/**
 * MCP smoke test.
 *
 * Starts the real server over stdio, speaks the real protocol to it, and checks
 * that both tools answer. A claim that a product "has an MCP server" is worth
 * exactly as much as the last time someone actually connected to it.
 *
 * Run: npx tsx scripts/mcp-smoke.mts
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

/**
 * Long enough to clear the 120-word floor the style channel requires. That
 * floor is real and deliberate — below it the variance estimates are noise — so
 * the sample has to clear it for this test to exercise the channel rather than
 * exercise the refusal. SHORT_SAMPLE below checks the refusal on purpose.
 */
const SAMPLE = `
The committee met on Tuesday evening to consider the revised drainage proposal for the eastern
site. Several members asked whether the survey had been completed in full, and the chair noted
that the report had been circulated only two days beforehand. A decision was deferred until the
next meeting, when the surveyor is expected to attend in person and answer questions directly.
The clerk agreed to write to the applicant setting out the outstanding points, including access
arrangements and the likely effect on the neighbouring lane. Members were broadly sympathetic to
the scheme but felt that the drawings submitted so far did not show enough detail to judge it
properly. One member observed that a similar application had been refused three years ago on
grounds that appeared to still apply, and asked the clerk to retrieve the earlier file before
the next meeting. The meeting closed at half past eight after a short discussion of other
business, including the budget for the coming financial year and the condition of the footpath
along the river. Nothing further was decided, and the matter will return in its current form
unless the applicant chooses to withdraw it in the meantime. The chair thanked those present
and reminded members that the deadline for written comments falls at the end of the month.
`.trim()

const SHORT_SAMPLE = 'The committee met on Tuesday to consider the revised proposal for the site.'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`FAILED: ${message}`)
  console.log(`  ok: ${message}`)
}

const transport = new StdioClientTransport({
  command: 'npx',
  args: ['tsx', 'mcp/server.ts'],
  // Force local mode so the smoke test never depends on a deployed endpoint.
  env: { ...process.env, MARKWITNESS_API_KEY: '' } as Record<string, string>,
})

const client = new Client({ name: 'markwitness-smoke', version: '1.0.0' }, { capabilities: {} })

try {
  await client.connect(transport)
  console.log('MCP smoke test')

  const { tools } = await client.listTools()
  const names = tools.map((t) => t.name).sort()
  assert(names.includes('check_document'), 'check_document is advertised')
  assert(names.includes('describe_method'), 'describe_method is advertised')

  // The one tool that must NOT exist, asserted rather than assumed.
  assert(
    !names.some((n) => /remove|strip|reduce|paraphrase|humanis|humaniz|rewrite/i.test(n)),
    'no mark-removal tool is exposed',
  )

  const described = await client.callTool({ name: 'describe_method', arguments: {} })
  const describedText = (described.content as Array<{ text: string }>)[0].text
  const method = JSON.parse(describedText)
  assert(method.mode === 'local', 'describe_method reports local mode with no API key')
  assert(Array.isArray(method.languages) && method.languages.length === 5, 'five languages are reported')
  assert(
    typeof method.removalCapability === 'string' && /none/i.test(method.removalCapability),
    'describe_method states the no-removal policy',
  )

  const checked = await client.callTool({ name: 'check_document', arguments: { text: SAMPLE } })
  assert(checked.isError !== true, 'check_document returned without error')
  const payload = JSON.parse((checked.content as Array<{ text: string }>)[0].text)
  assert(payload.result.status === 'ok', 'the analysis completed')
  assert(payload.result.language.code === 'en', 'the language was identified as English')
  assert(typeof payload.result.documentHash === 'string' && payload.result.documentHash.length === 64,
    'a SHA-256 document hash was returned')
  assert(payload.result.watermark.results.length > 0, 'the watermark channel ran')
  assert(payload.result.distribution.status === 'computed', 'the style channel ran against a real baseline')
  assert(Array.isArray(payload.result.limits) && payload.result.limits.length >= 4, 'stated limits travel with the result')
  assert(/no vendor publishes one/.test(payload.result.watermark.coverageNotice), 'the coverage notice is attached')

  const empty = await client.callTool({ name: 'check_document', arguments: { text: '   ' } })
  assert(empty.isError === true, 'an empty document is an explicit error, not a silent empty result')

  // A document below the measurement floor must say so rather than return a
  // figure computed from too little text.
  const short = await client.callTool({ name: 'check_document', arguments: { text: SHORT_SAMPLE } })
  const shortPayload = JSON.parse((short.content as Array<{ text: string }>)[0].text)
  assert(
    shortPayload.result.distribution.status === 'insufficient_data',
    'a too-short document reports insufficient_data rather than a figure',
  )
  assert(
    typeof shortPayload.result.distribution.detail === 'string' &&
      shortPayload.result.distribution.detail.length > 0,
    'the refusal explains itself',
  )
  assert(
    shortPayload.result.distribution.compositeDeviation === null,
    'the uncomputed statistic is null, not zero',
  )

  console.log('\nMCP smoke test passed.')
  await client.close()
  process.exit(0)
} catch (err) {
  console.error(`\n${(err as Error).message}`)
  await client.close().catch(() => {})
  process.exit(1)
}
