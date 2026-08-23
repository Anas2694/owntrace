import Account from '../models/account.model.js'
import BreachReport from '../models/breach-report.model.js'
import { getAccountActionSummary } from './account-action.service.js'
import { getAccountSummary } from './account.service.js'
import { getBreachReportForUser, serializeBreachReport } from './breach-report.service.js'
import AppError from '../utils/app-error.js'
import { paginationFor, parseBoundedPagination } from '../utils/pagination.js'

const subscriptionClasses = ['SUBSCRIPTION', 'PAYMENT']
const securityClasses = ['SECURITY_ALERT', 'PASSWORD_RESET']

function safeAccountProjection(account) {
  return {
    accountId: account._id.toString(),
    confidenceLevel: account.confidenceLevel,
    dormantStatus: account.dormantStatus,
    firstSeenAt: account.firstSeenAt,
    lastSeenAt: account.lastSeenAt,
    primaryDomain: account.primaryDomain,
    serviceName: account.serviceName,
  }
}

async function findAccountSignals(userId, rawQuery, evidenceClasses) {
  const { limit, page } = parseBoundedPagination(rawQuery)
  return findAccountSignalsForPagination(userId, { limit, page }, evidenceClasses)
}

async function findAccountSignalsForPagination(userId, { limit, page }, evidenceClasses) {
  const filter = { evidenceClasses: { $in: evidenceClasses }, userId }
  const [accounts, total] = await Promise.all([
    Account.find(filter)
      .select('confidenceLevel dormantStatus evidenceClasses firstSeenAt lastSeenAt primaryDomain serviceName')
      .sort({ lastSeenAt: -1, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Account.countDocuments(filter),
  ])
  return { accounts, pagination: paginationFor({ limit, page, total }) }
}

function parseBreachPagination(rawQuery = {}) {
  const supportedKeys = new Set([
    'breachLimit',
    'breachPage',
    'limit',
    'page',
    'signalLimit',
    'signalPage',
  ])
  if (Object.keys(rawQuery).some((key) => !supportedKeys.has(key))) {
    throw new AppError('Choose supported query controls.', 400, 'INVALID_PAGINATION')
  }

  const legacyLimit = rawQuery.limit
  const legacyPage = rawQuery.page
  return {
    breach: parseBoundedPagination({
      limit: rawQuery.breachLimit ?? legacyLimit,
      page: rawQuery.breachPage ?? legacyPage,
    }),
    signal: parseBoundedPagination({
      limit: rawQuery.signalLimit ?? legacyLimit,
      page: rawQuery.signalPage ?? legacyPage,
    }),
  }
}

async function listSubscriptions(userId, rawQuery = {}) {
  const { accounts, pagination } = await findAccountSignals(
    userId,
    rawQuery,
    subscriptionClasses,
  )
  return {
    pagination,
    subscriptions: accounts.map((account) => ({
      ...safeAccountProjection(account),
      basis: account.evidenceClasses.filter((value) => subscriptionClasses.includes(value)),
      detection: 'GMAIL_METADATA_SIGNAL',
      price: null,
      renewalDate: null,
    })),
  }
}

async function listBreachInsights(userId, rawQuery = {}) {
  const controls = parseBreachPagination(rawQuery)
  const [{ accounts, pagination: signalPagination }, report] = await Promise.all([
    findAccountSignalsForPagination(userId, controls.signal, securityClasses),
    getBreachReportForUser(userId),
  ])
  const { breaches, provider } = serializeBreachReport(report)
  const breachTotal = breaches.length
  return {
    breaches: breaches.slice(
      (controls.breach.page - 1) * controls.breach.limit,
      controls.breach.page * controls.breach.limit,
    ),
    breachPagination: paginationFor({ ...controls.breach, total: breachTotal }),
    pagination: signalPagination,
    provider,
    securitySignals: accounts.map((account) => ({
      ...safeAccountProjection(account),
      basis: account.evidenceClasses.filter((value) => securityClasses.includes(value)),
      verifiedBreach: false,
    })),
  }
}

function exposureLevel(account) {
  if (account.evidenceClasses.includes('SECURITY_ALERT')) return 'HIGH'
  if (['DORMANT', 'POSSIBLY_DORMANT'].includes(account.dormantStatus)) return 'MEDIUM'
  return 'LOW'
}

async function listExposureInsights(userId, rawQuery = {}) {
  const { limit, page } = parseBoundedPagination(rawQuery)
  await getAccountSummary(userId)
  const filter = { userId }
  const [accounts, total] = await Promise.all([
    Account.find(filter)
      .select('confidenceLevel dormantStatus evidenceClasses firstSeenAt lastSeenAt primaryDomain serviceName')
      .sort({ lastSeenAt: -1, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Account.countDocuments(filter),
  ])
  return {
    exposureSignals: accounts.map((account) => ({
      ...safeAccountProjection(account),
      level: exposureLevel(account),
      verifiedPublicExposure: false,
    })),
    pagination: paginationFor({ limit, page, total }),
    source: 'OWNTRACE_ACCOUNT_EVIDENCE',
  }
}

async function getPrivacyHealth(userId) {
  const [accounts, actions, breachReport] = await Promise.all([
    getAccountSummary(userId),
    getAccountActionSummary(userId),
    BreachReport.findOne({ userId }).select('breaches lastCheckedAt').lean(),
  ])
  const verifiedBreachCount = breachReport?.lastCheckedAt ? breachReport.breaches.length : 0
  if (accounts.total === 0 && verifiedBreachCount === 0) {
    return {
      confidence: 'NOT_ENOUGH_DATA',
      factors: [],
      score: null,
      summary: 'Connect a source and complete account discovery to calculate Privacy Health.',
    }
  }

  const penalties = {
    dormantAccounts: Math.min(20, accounts.dormant * 2),
    highPriorityActions: Math.min(24, actions.highPriority * 8),
    lowerConfidenceAccounts: Math.min(16, Math.max(0, accounts.total - accounts.highConfidence)),
    possiblyDormantAccounts: Math.min(10, accounts.possiblyDormant),
    verifiedBreaches: Math.min(30, verifiedBreachCount * 10),
  }
  const score = Math.max(0, 100 - Object.values(penalties).reduce((sum, value) => sum + value, 0))

  return {
    confidence: 'DERIVED_FROM_CURRENT_SIGNALS',
    factors: Object.entries(penalties).map(([id, penalty]) => ({ id, penalty })),
    score,
    summary: 'This score is a deterministic OwnTrace estimate, not an external security audit.',
  }
}

export {
  getPrivacyHealth,
  listBreachInsights,
  listExposureInsights,
  listSubscriptions,
}
