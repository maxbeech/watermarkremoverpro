import { NextResponse } from 'next/server'
import { API_PRICE_PENCE_PER_1K_WORDS, SITE } from '@/lib/site'
import { SUPPORTED_LANGUAGES } from '@/lib/detector/languages'

export const dynamic = 'force-static'

/** OpenAPI 3.1 description of the public API. */
export function GET() {
  return NextResponse.json(
    {
      openapi: '3.1.0',
      info: {
        title: `${SITE.name} API`,
        version: '1.0.0',
        description:
          'Check a document for a statistical AI provenance mark. Returns the signal strength with a confidence band, a per-passage breakdown corrected for multiple comparisons, and the stated limits of the method.\n\n' +
          'There is no endpoint that removes, weakens or reduces a provenance mark, and none will be added.',
        contact: { email: SITE.contactEmail },
      },
      servers: [{ url: SITE.url }],
      security: [{ bearerAuth: [] }],
      paths: {
        '/api/v1/check': {
          post: {
            summary: 'Check a document for a provenance mark',
            operationId: 'checkDocument',
            description: `Metered at ${API_PRICE_PENCE_PER_1K_WORDS}p per 1,000 words, rounded up.`,
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['text'],
                    properties: {
                      text: { type: 'string', minLength: 1, description: 'The document to check.' },
                      language: {
                        type: 'string',
                        enum: [...SUPPORTED_LANGUAGES],
                        description:
                          'Force a language. Omit to measure it; if it cannot be determined confidently the response says so rather than guessing.',
                      },
                      granularity: {
                        type: 'string',
                        enum: ['sentence', 'paragraph'],
                        default: 'sentence',
                      },
                      fdr: {
                        type: 'number',
                        exclusiveMinimum: 0,
                        exclusiveMaximum: 1,
                        default: 0.05,
                        description: 'False discovery rate for the per-passage correction.',
                      },
                    },
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'The analysis, plus what the call cost.',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        result: { $ref: '#/components/schemas/AnalysisResult' },
                        billing: {
                          type: 'object',
                          properties: {
                            words: { type: 'integer' },
                            billableUnits: { type: 'integer' },
                            unitWords: { type: 'integer' },
                            pence: { type: 'integer' },
                            currency: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                },
              },
              '400': { description: 'The body was not valid JSON, or did not validate.' },
              '401': { description: 'Missing, unknown or revoked API key.' },
              '402': { description: 'The document or the account is outside the plan allowance. The message names the limit reached.' },
              '503': { description: 'This deployment has no metering ledger configured, so metered access cannot be granted.' },
            },
          },
        },
      },
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', description: 'A MarkWitness API key, "mw_live_...".' },
        },
        schemas: {
          AnalysisResult: {
            type: 'object',
            description:
              'Every statistic is either a number or null. Null means the value was NOT computed, and the sibling status/detail field says why. Null must never be rendered as zero.',
            properties: {
              engineVersion: { type: 'string' },
              status: {
                type: 'string',
                enum: ['ok', 'language_undetermined', 'unsupported_language', 'empty_document'],
              },
              analyzedAt: { type: 'string', format: 'date-time' },
              documentHash: { type: 'string', description: 'SHA-256 of the exact text analysed.' },
              words: { type: 'integer' },
              characters: { type: 'integer' },
              language: { type: 'object' },
              watermark: {
                type: 'object',
                properties: {
                  keysTested: { type: 'array', items: { type: 'object' } },
                  results: { type: 'array', items: { $ref: '#/components/schemas/WatermarkChannelResult' } },
                  anyDetected: { type: 'boolean' },
                  coverageNotice: {
                    type: 'string',
                    description:
                      'Names the keys tested. A null result applies ONLY to these keys, and no vendor publishes a detection key, so this qualifier is load-bearing and must not be dropped when summarising.',
                  },
                },
              },
              distribution: {
                type: ['object', 'null'],
                description:
                  'Register measurement. status is computed | insufficient_data | no_baseline. This channel does NOT detect AI and is not evidence of authorship.',
              },
              passages: { type: 'array', items: { type: 'object' } },
              passageCorrection: {
                type: ['object', 'null'],
                description: 'Multiple-comparison correction applied before any passage is presented as a finding.',
              },
              limits: {
                type: 'array',
                items: { type: 'string' },
                description: 'The stated limits. Part of the result, not optional commentary.',
              },
            },
          },
          WatermarkChannelResult: {
            type: 'object',
            properties: {
              keyId: { type: 'string' },
              keyLabel: { type: 'string' },
              vendorPublished: { type: 'boolean' },
              status: { type: 'string', enum: ['computed', 'insufficient_data'] },
              trials: { type: ['integer', 'null'], description: 'Distinct word pairs scored. Repeats counted once.' },
              greenCount: { type: ['integer', 'null'] },
              greenRate: { type: ['number', 'null'] },
              greenRateInterval: { type: ['object', 'null'], description: 'Wilson interval on the green rate.' },
              expectedGreenRate: { type: 'number' },
              z: { type: ['number', 'null'] },
              pValue: { type: ['number', 'null'] },
              detail: { type: 'string', description: 'Why the test did not run, when status is not computed.' },
            },
          },
        },
      },
    },
    { headers: { 'Cache-Control': 'public, max-age=3600' } },
  )
}
