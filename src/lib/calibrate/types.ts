/**
 * Core types for the calibration engine.
 */

/** Configuration options for calibration */
export interface CalibrationConfig {
  /** Synonym confidence threshold (0.0-1.0). Default: 0.7 */
  confidenceThreshold?: number
  /** Skip substitution if token appears again within N tokens. Default: 3 */
  maxRepeats?: number
  /** Optional target lexical diversity (TTR). Engine tries to approach this. */
  targetDiversity?: number
  /**
   * Words or phrases that must never be substituted, e.g. SEO terms the caller
   * is trying to rank for. Matched case-insensitively against the normalized
   * token. A single-word entry blocks that word; a multi-word entry is matched
   * against the passage text before any phrase-level swap runs (see
   * ai-tells.ts), since word-level substitution alone can't see multi-word
   * phrases.
   */
  excludedWords?: string[]
  /**
   * The document's own detected British/American spelling (see
   * src/lib/detector/english-variant.ts), or undefined/null to leave a
   * replacement's spelling exactly as the dictionary wrote it. A candidate
   * synonym must never introduce the other variant's spelling into a
   * document that already committed to one.
   */
  englishVariant?: 'en-GB' | 'en-US' | null
}

/** A single token from the text */
export interface Token {
  /** Surface form as it appeared in the document */
  raw: string
  /** Lowercased, normalized form for dictionary lookup */
  norm: string
  /** Character offset in source text */
  start: number
  end: number
}

/** Frequency analysis results */
export interface FrequencyAnalysis {
  tokens: Token[]
  tokenCounts: Map<string, number>
  uniqueTokens: number
  totalTokens: number
  /** Tokens identified as high-frequency "signature" patterns */
  signatureTokens: Set<string>
  /** Tokens that appear multiple times within proximity threshold */
  repetitionMap: Map<string, number[]>
}

/** A suggested substitution for a token */
export interface Substitution {
  index: number
  original: string
  replacement: string
  confidence: number
  reason: 'synonym' | 'skipped_repetition' | 'below_threshold' | 'not_in_dictionary' | 'excluded'
  alternatives?: string[]
}

/** Text metrics before and after */
export interface TextMetrics {
  tokens: number
  uniqueTokens: number
  typeTokenRatio: number
  averageTokenFrequency: number
  lexicalDiversity: number
}

/** Main calibration request */
export interface CalibrationRequest {
  text: string
  language?: string
  mode: 'preview' | 'apply'
  config?: CalibrationConfig
}

/** Main calibration result */
export interface CalibrationResult {
  status: 'ok' | 'error'
  error?: string
  original: {
    text: string
    tokens: number
    metrics: TextMetrics
  }
  substitutions: Substitution[]
  revised: {
    text: string
    tokens: number
    metrics: TextMetrics
  }
  comparison: {
    lexicalChangePercent: number
    tokensChanged: number
    metricsShift: {
      typeTokenRatio: number
      averageFrequency: number
      lexicalDiversity: number
    }
  }
  appliedAt?: string
  processingTimeMs: number
  language?: string
}

/** A synonym group from the dictionary */
export interface SynonymGroup {
  id: number
  canonical: string
  variants: {
    id: number
    term: string
    confidence: number
  }[]
  partOfSpeech?: string
}

/** Loaded dictionary */
export interface SynonymDictionary {
  language: string
  version: string
  builtAt: string
  index: Map<string, SynonymGroup>
  getVariants(word: string): string[] | null
}

/** Language adapter interface for extensibility */
export interface LanguageAdapter {
  languageCode: string
  tokenize(text: string): Token[]
  getSynonyms(word: string): string[] | null
  isSignatureToken(word: string): boolean
  normalizeToken(raw: string): string
}
