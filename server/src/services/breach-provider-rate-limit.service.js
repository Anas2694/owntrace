import AppError from '../utils/app-error.js'

const HOURLY_CHECK_LIMIT = 20
const DAILY_CHECK_LIMIT = 90
const SECOND_CHECK_LIMIT = 1
const DAY_MS = 24 * 60 * 60 * 1_000
const HOUR_MS = 60 * 60 * 1_000
const SECOND_MS = 1_000

let hourlyWindow = { count: 0, startedAt: 0 }
let dailyWindow = { count: 0, startedAt: 0 }
let secondWindow = { count: 0, startedAt: 0 }

function rateLimitError() {
  return new AppError(
    'Too many security checks are happening right now. Please try again later.',
    429,
    'BREACH_CHECK_RATE_LIMITED',
  )
}

function reserveProviderCheck(now = Date.now()) {
  if (now - dailyWindow.startedAt >= DAY_MS) dailyWindow = { count: 0, startedAt: now }
  if (now - hourlyWindow.startedAt >= HOUR_MS) hourlyWindow = { count: 0, startedAt: now }
  if (now - secondWindow.startedAt >= SECOND_MS) secondWindow = { count: 0, startedAt: now }

  if (
    dailyWindow.count >= DAILY_CHECK_LIMIT
    || hourlyWindow.count >= HOURLY_CHECK_LIMIT
    || secondWindow.count >= SECOND_CHECK_LIMIT
  ) {
    throw rateLimitError()
  }

  dailyWindow.count += 1
  hourlyWindow.count += 1
  secondWindow.count += 1
}

function resetProviderCheckRateLimitForTests() {
  hourlyWindow = { count: 0, startedAt: 0 }
  dailyWindow = { count: 0, startedAt: 0 }
  secondWindow = { count: 0, startedAt: 0 }
}

export {
  DAILY_CHECK_LIMIT,
  HOURLY_CHECK_LIMIT,
  SECOND_CHECK_LIMIT,
  reserveProviderCheck,
  resetProviderCheckRateLimitForTests,
}
