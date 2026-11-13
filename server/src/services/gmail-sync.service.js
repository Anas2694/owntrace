import crypto from 'node:crypto'
import { google } from 'googleapis'
import { getTokenEncryptionKey } from '../config/google.js'
import GmailSignal from '../models/gmail-signal.model.js'
import GmailSyncJob from '../models/gmail-sync-job.model.js'
import GoogleConnection from '../models/google-connection.model.js'
import AppError from '../utils/app-error.js'
import { discoverAccountsForUser } from './account-discovery.service.js'
import {
  extractBillingMetadata,
  syncSubscriptionsForUser,
} from './subscription-detection.service.js'
import { withGoogleClient } from './google-client.service.js'
import { backgroundMailSyncEnabled, BATCH_LOCK_TIMEOUT_MS, retryBatchUpdate, withMailPublication } from './mail-sync-policy.js'

const BATCH_SIZE = 25
const METADATA_CONCURRENCY = 5
const DEFAULT_MESSAGE_LIMIT = 2000
const GMAIL_REQUEST_OPTIONS = { timeout: 15_000 }
const METADATA_HEADERS = ['From', 'Subject', 'Date']
const activeBatchBarriers = new Map()

function getMessageLimit() {
  const configured = Number(process.env.GMAIL_SYNC_MESSAGE_LIMIT)
  return Number.isInteger(configured) && configured >= BATCH_SIZE && configured <= 20_000
    ? configured
    : DEFAULT_MESSAGE_LIMIT
}

function getSyncPolicy() {
  return { batchSize: BATCH_SIZE, messageLimit: getMessageLimit() }
}

function hashProviderId(userId, value) {
  return crypto
    .createHmac('sha256', getTokenEncryptionKey())
    .update(`${userId}:${value}`)
    .digest('base64url')
}

function deriveSubjectSignal(subject) {
  if (typeof subject !== 'string' || !subject.trim()) return null

  return subject
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, '[email]')
    .replace(/\b\d{4,}\b/g, '[number]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160)
}

function parseSender(value) {
  if (typeof value !== 'string') return { senderDomain: null, senderEmail: null }

  const angleMatch = value.match(/<([^<>\s]+@[^<>\s]+)>/)
  const simpleMatch = value.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i)
  const senderEmail = (angleMatch?.[1] || simpleMatch?.[0] || '').toLowerCase()
  const senderDomain = senderEmail.includes('@') ? senderEmail.split('@').pop() : null
  return { senderDomain, senderEmail: senderEmail || null }
}

function getHeader(message, name) {
  return message.payload?.headers?.find((header) => header.name?.toLowerCase() === name.toLowerCase())
    ?.value
}

function deriveSignal(userId, connectionId, message) {
  const { senderDomain, senderEmail } = parseSender(getHeader(message, 'From'))
  const subject = getHeader(message, 'Subject')
  const billingMetadata = extractBillingMetadata(subject)
  const headerDate = Date.parse(getHeader(message, 'Date'))
  const internalDate = Number(message.internalDate)
  const occurredAt = Number.isFinite(internalDate) && internalDate > 0
    ? new Date(internalDate)
    : new Date(headerDate)

  if (!message.id || !message.threadId || Number.isNaN(occurredAt.getTime())) return null

  return {
    billingAmountMinor: billingMetadata.amountMinor,
    billingCurrency: billingMetadata.currency,
    billingCycle: billingMetadata.billingCycle,
    connectionId,
    messageIdHash: hashProviderId(userId, message.id),
    occurredAt,
    senderDomain,
    senderEmail,
    subjectSignal: deriveSubjectSignal(subject),
    threadIdHash: hashProviderId(userId, message.threadId),
    userId,
  }
}

async function startSync(userId) {
  const connection = await GoogleConnection.findOne({ userId })
  if (!connection) throw new AppError('Connect Gmail before starting a scan.', 409, 'GOOGLE_NOT_CONNECTED')
  if (connection.status === 'NEEDS_RECONNECT') {
    throw new AppError('Reconnect Gmail before starting a scan.', 409, 'GOOGLE_RECONNECT_REQUIRED')
  }

  if (connection.status === 'DISCONNECTING') {
    throw new AppError('Gmail is disconnecting. Try again shortly.', 409, 'GOOGLE_DISCONNECT_IN_PROGRESS')
  }
  const runId = crypto.randomUUID()
  let job
  try {
    job = await GmailSyncJob.findOneAndUpdate(
      {
        userId,
        $or: [
          { status: { $nin: ['QUEUED', 'SCANNING', 'PROCESSING'] } },
          { status: { $in: ['SCANNING', 'PROCESSING'] }, updatedAt: { $lt: new Date(Date.now() - BATCH_LOCK_TIMEOUT_MS) } },
        ],
      },
      {
        $set: {
          completedAt: null,
          connectionId: connection.id,
          estimatedTotal: null,
          lastErrorCode: null,
          nextPageToken: null,
          processedCount: 0,
          runId,
          leaseId: null,
          background: false,
          nextAttemptAt: null,
          retryCount: 0,
          startedAt: new Date(),
          status: 'QUEUED',
          storedCount: 0,
        },
      },
      { returnDocument: 'after', runValidators: true, upsert: true },
    )
  } catch (error) {
    if (error?.code !== 11000) throw error
    throw new AppError('A Gmail metadata scan is already in progress.', 409, 'GMAIL_SYNC_IN_PROGRESS')
  }
  const updatedConnection = await GoogleConnection.updateOne(
    { _id: connection.id, userId, status: { $nin: ['DISCONNECTING', 'NEEDS_RECONNECT'] } },
    { $set: { lastErrorCode: null, status: 'SYNCING' } },
  )
  if (!updatedConnection.matchedCount) {
    await GmailSyncJob.updateOne({ _id: job.id, runId, status: 'QUEUED' }, { $set: { status: 'CANCELLED', completedAt: new Date() } })
    throw new AppError('The Gmail connection changed. Refresh before scanning.', 409, 'GOOGLE_NOT_CONNECTED')
  }
  if (backgroundMailSyncEnabled()) {
    return await GmailSyncJob.findOneAndUpdate(
      { _id: job.id, runId, status: 'QUEUED' },
      { $set: { background: true } },
      { returnDocument: 'after' },
    ) || await getSyncJob(userId)
  }
  return job
}

async function getSyncJob(userId, { includePageToken = false } = {}) {
  const query = GmailSyncJob.findOne({ userId })
  if (includePageToken) query.select('+nextPageToken +runId +leaseId +retryCount')
  return query
}

async function fetchMessageMetadata(gmail, messageId) {
  try {
    const response = await gmail.users.messages.get({
      format: 'metadata',
      id: messageId,
      metadataHeaders: METADATA_HEADERS,
      userId: 'me',
    }, GMAIL_REQUEST_OPTIONS)
    return { message: response.data }
  } catch (error) {
    if (error?.response?.status === 404) return { deleted: true }
    throw error
  }
}

async function fetchMetadataBatch(gmail, messages) {
  const results = new Array(messages.length)
  let nextIndex = 0

  async function worker() {
    while (nextIndex < messages.length) {
      const currentIndex = nextIndex
      nextIndex += 1

      try {
        results[currentIndex] = {
          status: 'fulfilled',
          value: await fetchMessageMetadata(gmail, messages[currentIndex].id),
        }
      } catch (reason) {
        results[currentIndex] = { reason, status: 'rejected' }
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(METADATA_CONCURRENCY, messages.length) }, () => worker()),
  )
  return results
}

async function processNextBatch(userId, { expectedRunId, background = false } = {}) {
  const currentJob = await getSyncJob(userId, { includePageToken: true })

  if (!currentJob) {
    throw new AppError('Start a Gmail scan before processing it.', 409, 'GMAIL_SYNC_NOT_STARTED')
  }
  if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(currentJob.status)) return currentJob
  if (background ? currentJob.runId !== expectedRunId || !currentJob.background
    : currentJob.background && backgroundMailSyncEnabled()) return currentJob

  const leaseId = crypto.randomUUID()
  const job = await GmailSyncJob.findOneAndUpdate(
    {
      _id: currentJob.id,
      userId,
      runId: currentJob.runId,
      $or: [
        { status: 'QUEUED', ...(background ? { $or: [{ nextAttemptAt: null }, { nextAttemptAt: { $lte: new Date() } }] } : {}) },
        {
          status: { $in: ['SCANNING', 'PROCESSING'] },
          updatedAt: { $lt: new Date(Date.now() - BATCH_LOCK_TIMEOUT_MS) },
        },
      ],
    },
    { $set: { lastErrorCode: null, leaseId, status: 'SCANNING' } },
    { returnDocument: 'after' },
  ).select('+nextPageToken +runId +leaseId +retryCount')

  if (!job) {
    throw new AppError(
      'A Gmail metadata batch is already in progress.',
      409,
      'GMAIL_SYNC_IN_PROGRESS',
    )
  }

  let releaseBarrier
  const barrierKey = `${userId}:${leaseId}`
  activeBatchBarriers.set(barrierKey, new Promise((resolve) => { releaseBarrier = resolve }))
  const ownedLease = { _id: job.id, userId, runId: job.runId, leaseId }
  try {
    return await withGoogleClient(userId, async ({ connection, oauthClient }) => {
      if (connection.id !== job.connectionId.toString()) {
        throw new AppError('The Gmail connection changed.', 409, 'GOOGLE_NOT_CONNECTED')
      }
      const gmail = google.gmail({ auth: oauthClient, version: 'v1' })
      const listResponse = await gmail.users.messages.list({
        maxResults: Math.min(BATCH_SIZE, Math.max(1, getMessageLimit() - job.processedCount)),
        pageToken: job.nextPageToken || undefined,
        userId: 'me',
      }, GMAIL_REQUEST_OPTIONS)
      const messages = (listResponse.data.messages || []).slice(0, Math.min(BATCH_SIZE, Math.max(0, getMessageLimit() - job.processedCount)))

      const processingUpdate = await GmailSyncJob.updateOne(
        { ...ownedLease, status: 'SCANNING' },
        { $set: { estimatedTotal: listResponse.data.resultSizeEstimate ?? null, status: 'PROCESSING' } },
      )

      if (!processingUpdate.modifiedCount) return getSyncJob(userId)

      const results = await fetchMetadataBatch(gmail, messages)
      const criticalFailure = results.find((result) => {
        const status = result.reason?.response?.status || result.reason?.code
        const providerCode = result.reason?.response?.data?.error
        return result.status === 'rejected' && (
          status === 401 || status === 429 || (background && status >= 500) || providerCode === 'invalid_grant'
        )
      })

      if (criticalFailure) throw criticalFailure.reason

      const signals = []
      let failedCount = 0

      results.forEach((result) => {
        if (result.status === 'rejected') {
          failedCount += 1
          return
        }

        if (!result.value.deleted) {
          const signal = deriveSignal(userId, connection.id, result.value.message)
          if (signal) signals.push(signal)
        }
      })

      let storedCount = 0
      if (signals.length) {
        const activeLease = await GmailSyncJob.exists({ ...ownedLease, status: 'PROCESSING' })
        const activeConnection = await GoogleConnection.exists({ _id: connection.id, userId, status: { $in: ['SYNCING', 'CONNECTED'] } })
        if (!activeLease || !activeConnection) return getSyncJob(userId)
        const bulkResult = await GmailSignal.bulkWrite(
          signals.map((signal) => ({
            updateOne: {
              filter: {
                connectionId: signal.connectionId,
                messageIdHash: signal.messageIdHash,
                userId,
              },
              update: {
                $set: {
                  billingAmountMinor: signal.billingAmountMinor,
                  billingCurrency: signal.billingCurrency,
                  billingCycle: signal.billingCycle,
                  occurredAt: signal.occurredAt,
                  senderDomain: signal.senderDomain,
                  senderEmail: signal.senderEmail,
                  subjectSignal: signal.subjectSignal,
                },
                $setOnInsert: {
                  connectionId: signal.connectionId,
                  messageIdHash: signal.messageIdHash,
                  threadIdHash: signal.threadIdHash,
                  userId,
                },
              },
              upsert: true,
            },
          })),
          { ordered: false },
        )
        storedCount = bulkResult.upsertedCount
      }

      const processedCount = job.processedCount + messages.length
      const reachedLimit = processedCount >= getMessageLimit()
      const nextPageToken = reachedLimit ? null : listResponse.data.nextPageToken || null
      const completed = !nextPageToken
      const lastErrorCode = failedCount
        ? 'PARTIAL_METADATA_RESULTS'
        : reachedLimit && listResponse.data.nextPageToken
          ? 'MESSAGE_LIMIT_REACHED'
          : null

      const saveProgress = () => GmailSyncJob.findOneAndUpdate(
        { ...ownedLease, status: 'PROCESSING' },
        {
          $inc: { processedCount: messages.length, storedCount },
          $set: {
            completedAt: completed ? new Date() : null,
            lastErrorCode,
            nextPageToken,
            nextAttemptAt: null,
            retryCount: 0,
            status: completed ? 'COMPLETED' : 'QUEUED',
          },
        },
        { returnDocument: 'after', runValidators: true },
      )

      if (!completed) return await saveProgress() || getSyncJob(userId)
      return withMailPublication(userId, async () => {
        if (!await GmailSyncJob.exists({ ...ownedLease, status: 'PROCESSING' })) return getSyncJob(userId)
        await discoverAccountsForUser(userId)
        await syncSubscriptionsForUser(userId)
        await GoogleConnection.updateOne(
          { _id: connection.id, userId, status: 'SYNCING' },
          { $set: { lastErrorCode, lastSyncAt: new Date(), status: 'CONNECTED' } },
        )
        return await saveProgress() || getSyncJob(userId)
      })
    })
  } catch (error) {
    const retry = retryBatchUpdate(job, error, background)
    if (retry) {
      await GmailSyncJob.updateOne(
        { ...ownedLease, status: { $in: ['SCANNING', 'PROCESSING'] } },
        { $set: { ...retry, lastErrorCode: error.code } },
      )
      return getSyncJob(userId)
    }
    const failed = await GmailSyncJob.updateOne(
      { ...ownedLease, status: { $in: ['SCANNING', 'PROCESSING', 'COMPLETED'] } },
      { $set: { lastErrorCode: error.code || 'GMAIL_SYNC_FAILED', status: 'FAILED' } },
    )
    if (failed.matchedCount && error.code !== 'GOOGLE_RECONNECT_REQUIRED') {
      await GoogleConnection.updateOne(
        { _id: job.connectionId, userId, status: { $ne: 'DISCONNECTING' } },
        { $set: { lastErrorCode: error.code || 'GMAIL_SYNC_FAILED', status: 'ERROR' } },
      )
    }
    throw error
  } finally {
    releaseBarrier()
    activeBatchBarriers.delete(barrierKey)
  }
}

async function cancelSync(userId) {
  const job = await GmailSyncJob.findOneAndUpdate(
    { userId, status: { $in: ['QUEUED', 'SCANNING', 'PROCESSING'] } },
    { $set: { completedAt: new Date(), leaseId: crypto.randomUUID(), nextPageToken: null, status: 'CANCELLED' } },
    { returnDocument: 'after' },
  )

  if (job) {
    await GoogleConnection.updateOne(
      { _id: job.connectionId, userId, status: 'SYNCING' },
      { $set: { lastErrorCode: null, status: 'CONNECTED' } },
    )
  }

  return job
}

async function cancelAndWaitForSync(userId) {
  const job = await withMailPublication(userId, () => cancelSync(userId))
  await Promise.all([...activeBatchBarriers.entries()]
    .filter(([key]) => key.startsWith(`${userId}:`))
    .map(([, barrier]) => barrier))
  return job
}

export {
  cancelAndWaitForSync,
  cancelSync,
  deriveSignal,
  deriveSubjectSignal,
  getSyncPolicy,
  getSyncJob,
  parseSender,
  processNextBatch,
  startSync,
}
