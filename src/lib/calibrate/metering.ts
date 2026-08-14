/**
 * Metering and usage budget enforcement for calibration engine.
 *
 * Implements freemium daily word limits using local storage (IndexedDB).
 * No server-side queries; everything is local for privacy.
 *
 * Budget is reset at UTC midnight.
 */

import { getTodayUsage, recordUsage } from './storage'

/** Daily word limit for free tier users (no API key) */
const FREE_TIER_DAILY_LIMIT = 5000

/** Daily word limit for authenticated API users */
const API_TIER_DAILY_LIMIT = 100000

/**
 * Check if the user has remaining budget for today.
 *
 * @param tokensToProcess - Number of tokens to process
 * @param isApiUser - Whether the user has an API key
 * @returns Budget status
 */
export async function checkDailyBudget(
  tokensToProcess: number,
  isApiUser: boolean = false,
): Promise<{
  allowed: boolean
  reason?: string
  used: number
  limit: number
  remaining: number
  resetTime: string
}> {
  const limit = isApiUser ? API_TIER_DAILY_LIMIT : FREE_TIER_DAILY_LIMIT
  const usage = await getTodayUsage()

  const used = usage.tokens
  const remaining = Math.max(0, limit - used)

  return {
    allowed: tokensToProcess <= remaining,
    reason: tokensToProcess > remaining ? 'daily_limit_exceeded' : undefined,
    used,
    limit,
    remaining,
    resetTime: getNextResetTime(),
  }
}

/**
 * Records a calibration operation against the daily budget.
 * Should be called after a successful calibration.
 *
 * @param tokens - Total tokens processed
 * @param substitutions - Number of substitutions made
 */
export async function recordCalibration(tokens: number, substitutions: number): Promise<void> {
  await recordUsage(tokens, substitutions)
}

/**
 * Gets the current daily usage.
 */
export async function getDailyUsage(): Promise<{
  tokens: number
  substitutions: number
  calibrations: number
}> {
  const usage = await getTodayUsage()
  return {
    tokens: usage.tokens,
    substitutions: usage.substitutions,
    calibrations: usage.calibrations,
  }
}

/**
 * Gets the daily limit for a user.
 */
export function getDailyLimit(isApiUser: boolean = false): number {
  return isApiUser ? API_TIER_DAILY_LIMIT : FREE_TIER_DAILY_LIMIT
}

/**
 * Gets the time until the next daily reset (UTC midnight).
 *
 * @returns ISO timestamp of next reset
 */
export function getNextResetTime(): string {
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  // Set to UTC midnight
  tomorrow.setUTCHours(0, 0, 0, 0)
  return tomorrow.toISOString()
}

/**
 * Gets seconds until the next daily reset.
 */
export function getSecondsTilReset(): number {
  const now = Date.now()
  const resetTime = new Date(getNextResetTime()).getTime()
  return Math.max(0, Math.ceil((resetTime - now) / 1000))
}

/**
 * Calculates the percentage of daily budget used.
 */
export async function getBudgetPercentage(isApiUser: boolean = false): Promise<number> {
  const usage = await getTodayUsage()
  const limit = getDailyLimit(isApiUser)
  return Math.min(100, (usage.tokens / limit) * 100)
}

/**
 * Formats budget information for display.
 */
export async function formatBudgetStatus(
  isApiUser: boolean = false,
): Promise<{
  used: number
  limit: number
  remaining: number
  percentage: number
  resetAt: string
  timeUntilReset: string
}> {
  const limit = getDailyLimit(isApiUser)
  const usage = await getTodayUsage()
  const used = usage.tokens
  const remaining = Math.max(0, limit - used)
  const percentage = (used / limit) * 100

  const secondsTil = getSecondsTilReset()
  const hours = Math.floor(secondsTil / 3600)
  const minutes = Math.floor((secondsTil % 3600) / 60)

  return {
    used,
    limit,
    remaining,
    percentage: Math.round(percentage),
    resetAt: getNextResetTime(),
    timeUntilReset:
      hours > 0
        ? `${hours}h ${minutes}m`
        : minutes > 0
          ? `${minutes}m`
          : `${secondsTil}s`,
  }
}
