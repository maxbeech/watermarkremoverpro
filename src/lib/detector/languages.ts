/**
 * Supported languages and their function-word inventories.
 *
 * Function words (articles, prepositions, pronouns, auxiliaries, conjunctions)
 * are the standard feature set for authorship and register work because their
 * rates are driven by how a text was produced rather than by what it is about.
 * A document about wetlands and a document about opera differ wildly in content
 * words and barely at all in "of", which is what makes these usable as a
 * subject-independent reference.
 *
 * The lists are the FEATURE SET only. Every rate they are compared against is
 * measured from a real corpus by scripts/build-baselines.ts; nothing here
 * carries a frequency figure, because no frequency in this product is written
 * by hand.
 */

export const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'pt'] as const
export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]

export const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
}

export const FUNCTION_WORDS: Record<LanguageCode, string[]> = {
  en: [
    'the', 'of', 'and', 'to', 'a', 'in', 'that', 'is', 'was', 'it', 'for', 'as', 'with', 'his',
    'he', 'be', 'on', 'i', 'by', 'at', 'this', 'had', 'not', 'are', 'but', 'from', 'or', 'have',
    'an', 'they', 'which', 'you', 'were', 'her', 'all', 'she', 'there', 'would', 'their', 'we',
    'him', 'been', 'has', 'when', 'who', 'will', 'no', 'more', 'if', 'out', 'so', 'said', 'what',
    'up', 'its', 'about', 'into', 'than', 'them', 'can', 'only', 'other', 'new', 'some', 'could',
    'time', 'these', 'two', 'may', 'then', 'do', 'first', 'any', 'my', 'now', 'such', 'like',
    'our', 'over', 'man', 'me', 'even', 'most', 'made', 'after', 'also', 'did', 'many', 'before',
    'must', 'through', 'back', 'years', 'where', 'much', 'your', 'way', 'well', 'down', 'should',
    'because', 'each', 'just', 'those', 'people', 'how', 'too', 'little', 'state', 'good', 'very',
    'make', 'world', 'still', 'own', 'see', 'men', 'work', 'long', 'get', 'here', 'between',
    'both', 'life', 'being', 'under', 'never', 'day', 'same', 'another', 'know', 'while', 'last',
  ],
  es: [
    'de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'por', 'un', 'para', 'con',
    'no', 'una', 'su', 'al', 'lo', 'como', 'más', 'pero', 'sus', 'le', 'ya', 'o', 'este', 'sí',
    'porque', 'esta', 'entre', 'cuando', 'muy', 'sin', 'sobre', 'también', 'me', 'hasta', 'hay',
    'donde', 'quien', 'desde', 'todo', 'nos', 'durante', 'todos', 'uno', 'les', 'ni', 'contra',
    'otros', 'ese', 'eso', 'ante', 'ellos', 'e', 'esto', 'mí', 'antes', 'algunos', 'qué', 'unos',
    'yo', 'otro', 'otras', 'otra', 'él', 'tanto', 'esa', 'estos', 'mucho', 'quienes', 'nada',
    'muchos', 'cual', 'poco', 'ella', 'estar', 'estas', 'algunas', 'algo', 'nosotros', 'mi', 'mis',
    'tú', 'te', 'ti', 'tu', 'tus', 'ellas', 'nosotras', 'vosotros', 'vosotras', 'os', 'mío', 'mía',
    'ser', 'es', 'son', 'era', 'fue', 'han', 'ha', 'había', 'tiene', 'tenía', 'puede', 'hacer',
    'todas', 'cada', 'aunque', 'mientras', 'según', 'bien', 'así', 'aquí', 'ahora', 'siempre',
  ],
  fr: [
    'de', 'la', 'le', 'et', 'les', 'des', 'en', 'un', 'du', 'une', 'que', 'est', 'pour', 'qui',
    'dans', 'a', 'par', 'plus', 'pas', 'au', 'sur', 'ne', 'se', 'ce', 'il', 'sont', 'ou', 'avec',
    'son', 'aux', 'mais', 'nous', 'comme', 'on', 'sans', 'elle', 'ses', 'lui', 'leur', 'y', 'été',
    'être', 'avoir', 'faire', 'cette', 'ces', 'tout', 'tous', 'toute', 'toutes', 'même', 'aussi',
    'entre', 'encore', 'quand', 'très', 'bien', 'où', 'peut', 'sous', 'après', 'avant', 'depuis',
    'contre', 'vers', 'chez', 'donc', 'car', 'si', 'ainsi', 'alors', 'ici', 'là', 'cela', 'celui',
    'celle', 'ceux', 'dont', 'quel', 'quelle', 'leurs', 'notre', 'votre', 'nos', 'vos', 'mon',
    'ma', 'mes', 'ton', 'ta', 'tes', 'je', 'tu', 'vous', 'ils', 'elles', 'me', 'te', 'moi', 'toi',
    'était', 'ont', 'avait', 'fait', 'peu', 'jamais', 'toujours', 'déjà', 'pendant', 'selon',
  ],
  de: [
    'der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich', 'des', 'auf', 'für',
    'ist', 'im', 'dem', 'nicht', 'ein', 'eine', 'als', 'auch', 'es', 'an', 'werden', 'aus', 'er',
    'hat', 'dass', 'sie', 'nach', 'wird', 'bei', 'einer', 'um', 'am', 'sind', 'noch', 'wie',
    'einem', 'über', 'einen', 'so', 'zum', 'war', 'haben', 'nur', 'oder', 'aber', 'vor', 'zur',
    'bis', 'mehr', 'durch', 'man', 'sein', 'wurde', 'sei', 'ich', 'wir', 'ihr', 'ihre', 'seine',
    'seiner', 'diese', 'dieser', 'dieses', 'kann', 'muss', 'soll', 'wenn', 'weil', 'doch', 'schon',
    'dann', 'da', 'wo', 'was', 'wer', 'welche', 'alle', 'allen', 'anderen', 'gegen', 'ohne',
    'unter', 'zwischen', 'während', 'seit', 'ihn', 'ihm', 'uns', 'euch', 'mein', 'dein', 'unser',
    'hatte', 'hätte', 'würde', 'könnte', 'immer', 'wieder', 'sehr', 'viel', 'gut', 'jetzt',
  ],
  pt: [
    'de', 'a', 'o', 'que', 'e', 'do', 'da', 'em', 'um', 'para', 'com', 'não', 'uma', 'os', 'no',
    'se', 'na', 'por', 'mais', 'as', 'dos', 'como', 'mas', 'ao', 'ele', 'das', 'à', 'seu', 'sua',
    'ou', 'quando', 'muito', 'nos', 'já', 'eu', 'também', 'só', 'pelo', 'pela', 'até', 'isso',
    'ela', 'entre', 'depois', 'sem', 'mesmo', 'aos', 'seus', 'quem', 'nas', 'me', 'esse', 'eles',
    'você', 'essa', 'num', 'nem', 'suas', 'meu', 'às', 'minha', 'numa', 'pelos', 'elas', 'qual',
    'nós', 'lhe', 'deles', 'essas', 'esses', 'pelas', 'este', 'dele', 'tu', 'te', 'vocês', 'vos',
    'lhes', 'meus', 'minhas', 'teu', 'tua', 'nosso', 'nossa', 'dela', 'delas', 'esta', 'estes',
    'é', 'são', 'era', 'foi', 'ser', 'ter', 'tem', 'está', 'estão', 'havia', 'pode', 'fazer',
    'todos', 'toda', 'cada', 'embora', 'enquanto', 'segundo', 'bem', 'assim', 'aqui', 'agora',
  ],
}

export function isSupportedLanguage(code: string): code is LanguageCode {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(code)
}

export interface LanguageIdentification {
  /** Best-scoring language, or null when no candidate is clearly ahead. */
  language: LanguageCode | null
  /** Share of tokens matching each language's function-word inventory. */
  scores: Record<LanguageCode, number>
  /** Gap between the best and second-best score. */
  margin: number
  /** True when the identification is clear enough to analyse without asking. */
  confident: boolean
}

/**
 * Identify the language from function-word coverage.
 *
 * This is a measurement, not a guess: it counts how many of the document's own
 * tokens belong to each inventory. When two languages score within
 * MIN_MARGIN of each other the answer is `null` and the caller must ask the
 * user which language to use, because the engine will not pick a baseline it cannot
 * justify, because analysing against the wrong baseline produces a real-looking
 * number that means nothing.
 */
const MIN_MARGIN = 0.02
const MIN_COVERAGE = 0.05

export function identifyLanguage(tokens: { norm: string }[]): LanguageIdentification {
  const scores = {} as Record<LanguageCode, number>
  const sets = new Map<LanguageCode, Set<string>>()
  for (const lang of SUPPORTED_LANGUAGES) sets.set(lang, new Set(FUNCTION_WORDS[lang]))

  for (const lang of SUPPORTED_LANGUAGES) {
    const set = sets.get(lang)!
    let hits = 0
    for (const t of tokens) if (set.has(t.norm)) hits++
    scores[lang] = tokens.length > 0 ? hits / tokens.length : 0
  }

  const ranked = [...SUPPORTED_LANGUAGES].sort((a, b) => scores[b] - scores[a])
  const best = ranked[0]
  const margin = scores[best] - scores[ranked[1]]
  const confident = scores[best] >= MIN_COVERAGE && margin >= MIN_MARGIN

  return { language: confident ? best : null, scores, margin, confident }
}
