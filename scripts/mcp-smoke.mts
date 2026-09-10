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
 * floor is real and deliberate, since below it the variance estimates are noise, so
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
  // Both names are cleared: either one set in the ambient environment would
  // otherwise send this test at a live deployment.
  env: {
    ...process.env,
    WATERMARKREMOVERPRO_API_KEY: '',
    MARKWITNESS_API_KEY: '',
  } as Record<string, string>,
})

const client = new Client({ name: 'watermarkremoverpro-smoke', version: '1.0.0' }, { capabilities: {} })

try {
  await client.connect(transport)
  console.log('MCP smoke test')

  const { tools } = await client.listTools()
  const names = tools.map((t) => t.name).sort()
  assert(names.includes('check_document'), 'check_document is advertised')
  assert(names.includes('describe_method'), 'describe_method is advertised')
  assert(names.includes('reduce_ai_evidence'), 'reduce_ai_evidence is advertised')

  // Honesty constraint, asserted at runtime rather than assumed from the
  // static description string: the rewrite tool must disclose its
  // limitation, not just claim a capability.
  const rewriteTool = tools.find((t) => t.name === 'reduce_ai_evidence')
  assert(
    typeof rewriteTool?.description === 'string' && /cannot guarantee/i.test(rewriteTool.description),
    'reduce_ai_evidence discloses that it cannot guarantee defeating an undisclosed watermark',
  )
  assert(
    !tools.some((t) => /\b100%\s*(undetectable|guaranteed)\b/i.test(t.description ?? '')),
    'no tool description makes an unverifiable 100%-style guarantee',
  )

  // The three engine choices, checked at the schema. This never invokes
  // model: 'advanced' directly: that would download real weights, which this
  // fast/default smoke test must not require. See `npm run test:models`.
  // The default is 'auto', which on a machine with no cached weights resolves
  // to the deterministic engine, and the assertions further down check it
  // reports having done so.
  const rewriteInputSchema = rewriteTool?.inputSchema as
    | { properties?: Record<string, { enum?: string[] }> }
    | undefined
  assert(
    Array.isArray(rewriteInputSchema?.properties?.model?.enum) &&
      ['auto', 'standard', 'advanced'].every((choice) =>
        rewriteInputSchema!.properties!.model!.enum!.includes(choice),
      ),
    'reduce_ai_evidence advertises the auto, standard and advanced model options',
  )

  const described = await client.callTool({ name: 'describe_method', arguments: {} })
  const describedText = (described.content as Array<{ text: string }>)[0].text
  const method = JSON.parse(describedText)
  assert(method.mode === 'local', 'describe_method reports local mode with no API key')
  assert(Array.isArray(method.languages) && method.languages.length === 5, 'five languages are reported')
  assert(
    method.rewriteCapability?.tool === 'reduce_ai_evidence' && Array.isArray(method.rewriteCapability?.limits),
    'describe_method describes the rewrite capability and its stated limits',
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

  const rewritten = await client.callTool({
    name: 'reduce_ai_evidence',
    arguments: { text: SAMPLE, strength: 'balanced', tier: 'free' },
  })
  assert(rewritten.isError !== true, 'reduce_ai_evidence returned without error')
  const rewritePayload = JSON.parse((rewritten.content as Array<{ text: string }>)[0].text)
  assert(rewritePayload.result.status === 'ok', 'the rewrite completed')
  assert(typeof rewritePayload.result.revisedText === 'string' && rewritePayload.result.revisedText.length > 0,
    'a revised document was returned')
  assert(
    Array.isArray(rewritePayload.result.limits) && rewritePayload.result.limits.some((l: string) => /cannot guarantee/i.test(l)),
    'the rewrite result states its own limits, not just the tool description',
  )

  // The compact default is a contract, not an implementation detail: a tool
  // meant to run on every document in a publishing pipeline cannot spend the
  // caller's whole context per call. The full object for a 612-word document
  // measured about 40 KB, of which 31 KB was the before/after AnalysisResult
  // pair. Asserting the shape here stops that quietly coming back.
  assert(rewritePayload.detail === 'summary', 'reduce_ai_evidence returns the compact summary by default')
  assert(
    rewritePayload.result.documentBefore === undefined && rewritePayload.result.documentAfter === undefined,
    'the summary omits the full before/after AnalysisResult pair',
  )
  assert(
    rewritePayload.result.evidenceBefore !== undefined && rewritePayload.result.evidenceAfter !== undefined,
    'the summary still carries the before/after headline evidence numbers',
  )

  const full = await client.callTool({
    name: 'reduce_ai_evidence',
    arguments: { text: SAMPLE, strength: 'balanced', tier: 'free', detail: 'full' },
  })
  const fullPayload = JSON.parse((full.content as Array<{ text: string }>)[0].text)
  assert(fullPayload.detail === 'full', 'detail "full" is honoured')
  assert(
    fullPayload.result.documentBefore?.status === 'ok' && fullPayload.result.documentAfter?.status === 'ok',
    'detail "full" returns both complete analyses',
  )
  assert(
    JSON.stringify(fullPayload).length > JSON.stringify(rewritePayload).length,
    'the full response is genuinely larger than the summary, so the default saves something real',
  )
  // Which engine ran, and why, on every response. A caller must never have to
  // guess whether a result came from the local model or the deterministic
  // engine, which is exactly the ambiguity a default of 'auto' would create if
  // it were not reported.
  assert(
    typeof rewritePayload.model === 'string' && rewritePayload.model.length > 0,
    'the default call names the engine that ran in the human-readable `model` field',
  )
  const reportedEngine = rewritePayload.engine
  assert(reportedEngine?.requested === 'auto', 'a call naming no model is reported as the auto default')
  assert(
    reportedEngine?.used === 'standard' || reportedEngine?.used === 'advanced',
    'the response names the engine that actually ran',
  )
  assert(
    typeof reportedEngine?.reason === 'string' && reportedEngine.reason.length > 20,
    'the response explains why that engine ran',
  )
  assert(
    typeof reportedEngine?.modelCacheDir === 'string' &&
      reportedEngine.modelCacheDir.includes('watermarkremoverpro'),
    'the local model cache is reported at the post-rename path',
  )
  assert(
    reportedEngine?.failure === null || typeof reportedEngine?.failure?.message === 'string',
    'a local model that could not load reports why, rather than degrading in silence',
  )

  // Explicitly asking for the deterministic engine must be honoured whatever
  // is cached on the machine running this.
  const explicitStandard = await client.callTool({
    name: 'reduce_ai_evidence',
    arguments: { text: SAMPLE, strength: 'preserve', model: 'standard' },
  })
  const standardPayload = JSON.parse((explicitStandard.content as Array<{ text: string }>)[0].text)
  assert(standardPayload.engine.used === 'standard', 'model "standard" runs the deterministic engine')
  assert(standardPayload.engine.failure === null, 'the deterministic engine reports no failure')

  // An engine that does not exist is refused rather than quietly replaced.
  const badModel = await client.callTool({
    name: 'reduce_ai_evidence',
    arguments: { text: SAMPLE, model: 'turbo' },
  })
  assert(badModel.isError === true, 'an unrecognised model is an explicit error, not a silent substitution')

  console.log('\nMCP smoke test passed.')
  await client.close()
  process.exit(0)
} catch (err) {
  console.error(`\n${(err as Error).message}`)
  await client.close().catch(() => {})
  process.exit(1)
}
