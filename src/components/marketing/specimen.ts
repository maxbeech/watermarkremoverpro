import { checkDocument, type AnalysisResult } from '@/lib/detector'
import { PUBLIC_DETECTION_KEYS } from '@/lib/detector/public-keys'
import { OPEN_REFERENCE_KEY } from '@/lib/detector/keys'
import { applyGreenListMark } from '@/lib/detector/simulate'

/**
 * The specimens shown on the marketing site.
 *
 * These are NOT mockup images and they are not hand-written numbers. Each one is
 * real English prose run through the real engine at build time, and the figures
 * rendered on the page are whatever that measurement returned. If the engine
 * changes, the marketing site changes with it, which is the only version of a
 * product screenshot that cannot quietly go stale.
 *
 * The marked specimen is honest about what it is: prose rewritten by
 * `applyGreenListMark` under the OPEN REFERENCE KEY that this product publishes,
 * not text from any model vendor. Every surface that renders it says so.
 */

/** Ordinary committee-minutes prose. Nothing was applied to this one. */
export const UNMARKED_SPECIMEN = `The committee reviewed the proposal at length before reaching a decision. Several members raised concerns about the timetable, and the chair agreed to circulate a revised schedule ahead of the next meeting. A follow-up note will record the agreed actions and the people responsible for each of them, so that nothing depends on anyone's memory of the discussion. The revised schedule should reach members before the end of the week, and any further comment can be sent to the secretary in writing. Where a member cannot attend, a written submission carries the same weight as a spoken contribution and will be recorded in the same way. The chair thanked the working group for preparing the background paper, which members found clear and unusually short. A question was raised about the budget line for the second phase, and the treasurer undertook to bring exact figures to the next meeting rather than estimate them from memory in the room.`

/**
 * A modest synonym inventory. Each entry is a genuine substitution a writer
 * might make without changing the meaning of the sentence, which is what makes
 * this a fair imitation of a marked sampler choosing among plausible next words.
 */
const ALTERNATIVES: Record<string, string[]> = {
  reviewed: ['examined', 'considered', 'assessed', 'studied'],
  proposal: ['submission', 'paper', 'document', 'plan'],
  length: ['depth', 'detail'],
  reaching: ['making', 'taking', 'arriving at'],
  decision: ['determination', 'finding', 'conclusion'],
  several: ['some', 'certain', 'various', 'a number of'],
  members: ['attendees', 'participants', 'those present'],
  raised: ['noted', 'flagged', 'voiced', 'registered'],
  concerns: ['reservations', 'doubts', 'misgivings', 'questions'],
  timetable: ['schedule', 'timeline', 'programme'],
  chair: ['convenor', 'presiding member'],
  agreed: ['undertook', 'consented', 'accepted'],
  circulate: ['distribute', 'issue', 'share', 'send round'],
  revised: ['updated', 'amended', 'corrected'],
  schedule: ['timetable', 'programme', 'plan'],
  ahead: ['before', 'in advance', 'prior to'],
  next: ['following', 'subsequent', 'coming'],
  meeting: ['session', 'sitting', 'gathering'],
  note: ['memorandum', 'record', 'minute'],
  record: ['document', 'log', 'capture', 'set down'],
  actions: ['steps', 'items', 'undertakings'],
  people: ['persons', 'individuals', 'members'],
  responsible: ['accountable', 'answerable', 'tasked'],
  nothing: ['no part', 'no element'],
  depends: ['rests', 'relies', 'hangs'],
  memory: ['recollection', 'recall'],
  discussion: ['debate', 'exchange', 'conversation'],
  reach: ['arrive with', 'be sent to'],
  week: ['fortnight', 'period'],
  further: ['additional', 'other', 'more'],
  comment: ['observation', 'remark', 'feedback'],
  sent: ['forwarded', 'submitted', 'passed'],
  secretary: ['clerk', 'administrator'],
  writing: ['written form', 'text'],
  attend: ['be present', 'take part'],
  written: ['recorded', 'documented'],
  submission: ['statement', 'paper', 'contribution'],
  carries: ['holds', 'bears', 'has'],
  weight: ['standing', 'force', 'authority'],
  spoken: ['verbal', 'oral'],
  contribution: ['intervention', 'input', 'remark'],
  recorded: ['minuted', 'logged', 'noted'],
  thanked: ['commended', 'credited'],
  working: ['drafting', 'standing'],
  group: ['party', 'panel', 'body'],
  preparing: ['drafting', 'assembling', 'producing'],
  background: ['briefing', 'supporting', 'context'],
  paper: ['note', 'document', 'brief'],
  clear: ['lucid', 'plain', 'legible'],
  unusually: ['notably', 'remarkably', 'exceptionally'],
  short: ['brief', 'concise', 'compact'],
  question: ['query', 'point', 'issue'],
  budget: ['funding', 'spending', 'cost'],
  line: ['heading', 'allocation', 'item'],
  second: ['later', 'following'],
  phase: ['stage', 'tranche', 'period'],
  treasurer: ['finance officer', 'bursar'],
  undertook: ['agreed', 'promised', 'committed'],
  bring: ['present', 'supply', 'produce'],
  exact: ['precise', 'firm', 'confirmed'],
  figures: ['numbers', 'amounts', 'totals'],
  estimate: ['approximate', 'guess', 'reckon'],
  room: ['meeting', 'session', 'chamber'],
}

/** The same prose, rewritten to prefer green-list continuations under the
 *  published open reference key. Nothing here comes from a model vendor. */
export const MARKED_SPECIMEN = applyGreenListMark(
  UNMARKED_SPECIMEN,
  OPEN_REFERENCE_KEY,
  ALTERNATIVES,
  11,
).text

let markedCache: Promise<AnalysisResult> | null = null
let unmarkedCache: Promise<AnalysisResult> | null = null

/** Real analysis of the marked specimen. Computed once per process. */
export function markedSpecimenResult(): Promise<AnalysisResult> {
  markedCache ??= checkDocument(MARKED_SPECIMEN, { keys: PUBLIC_DETECTION_KEYS, language: 'en' })
  return markedCache
}

/** Real analysis of the untouched specimen. Computed once per process. */
export function unmarkedSpecimenResult(): Promise<AnalysisResult> {
  unmarkedCache ??= checkDocument(UNMARKED_SPECIMEN, { keys: PUBLIC_DETECTION_KEYS, language: 'en' })
  return unmarkedCache
}
