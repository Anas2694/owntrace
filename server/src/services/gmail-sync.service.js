import crypto from 'node:crypto'
import { google } from 'googleapis'
import { getTokenEncryptionKey } from '../config/google.js'
import GmailSignal from '../models/gmail-signal.model.js'
import GmailSyncJob from '../models/gmail-sync-job.model.js'
import GoogleConnection from '../models/google-connection.model.js'
import AppError from '../utils/app-error.js'
import { discoverAccountsForUser } from './account-discovery.service.js'
import { withGoogleClient } from './google-client.service.js'

const BATCH_SIZE = 25
const BATCH_LOCK_TIMEOUT_MS = 5 * 60 * 1000
const METADATA_CONCURRENCY = 5
const DEFAULT_MESSAGE_LIMIT = 2000
const METADATA_HEADERS = ['From', 'Subject', 'Date']

function getMessageLimit() {
  const configured = Number(process.env.GMAIL_SYNC_MESSAGE_LIMIT)
  return Number.isInteger(configured) && configured >= BATCH_SIZE && configured <= 20_000
    ? configured
    : DEFAULT_MESSAGE_LIMIT
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
  const headerDate = Date.parse(getHeader(message, 'Date'))
  const internalDate = Number(message.internalDate)
  const occurredAt = Number.isFinite(internalDate) && internalDate > 0
    ? new Date(internalDate)
    : new Date(headerDate)

  if (!message.id || !message.threadId || Number.isNaN(occurredAt.getTime())) return null

  return {
    connectionId,
    messageIdHash: hashProviderId(userId, message.id),
    occurredAt,
    senderDomain,
    senderEmail,
    subjectSignal: deriveSubjectSignal(getHeader(message, 'Subject')),
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

  const activeJob = await GmailSyncJob.findOne({
    userId,
    status: { $in: ['QUEUED', 'SCANNING', 'PROCESSING'] },
  })
  const activeJobIsStale = activeJob
    && ['SCANNING', 'PROCESSING'].includes(activeJob.status)
    && activeJob.updatedAt < new Date(Date.now() - BATCH_LOCK_TIMEOUT_MS)
  if (activeJob && !activeJobIsStale) {
    throw new AppError(
      'A Gmail metadata scan is already in progress.',
      409,
      'GMAIL_SYNC_IN_PROGRESS',
    )
  }

  await GoogleConnection.updateOne(
    { _id: connection.id, userId },
    { $set: { lastErrorCode: null, status: 'SYNCING' } },
  )

  return GmailSyncJob.findOneAndUpdate(
    { userId },
    {
      $set: {
        completedAt: null,
        connectionId: connection.id,
        estimatedTotal: null,
        lastErrorCode: null,
        nextPageToken: null,
        processedCount: 0,
        startedAt: new Date(),
        status: 'QUEUED',
        storedCount: 0,
      },
    },
    { returnDocument: 'after', runValidators: true, upsert: true },
  )
}

async function getSyncJob(userId, { includePageToken = false } = {}) {
  const query = GmailSyncJob.findOne({ userId })
  if (includePageToken) query.select('+nextPageToken')
  return query
}

async function fetchMessageMetadata(gmail, messageId) {
  try {
    const response = await gmail.users.messages.get({
      format: 'metadata',
      id: messageId,
      metadataHeaders: METADATA_HEADERS,
      userId: 'me',
    })
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

async function processNextBatch(userId) {
  const currentJob = await getSyncJob(userId, { includePageToken: true })

  if (!currentJob) {
    throw new AppError('Start a Gmail scan before processing it.', 409, 'GMAIL_SYNC_NOT_STARTED')
  }
  if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(currentJob.status)) return currentJob

  const job = await GmailSyncJob.findOneAndUpdate(
    {
      _id: currentJob.id,
      userId,
      $or: [
        { status: 'QUEUED' },
        {
          status: { $in: ['SCANNING', 'PROCESSING'] },
          updatedAt: { $lt: new Date(Date.now() - BATCH_LOCK_TIMEOUT_MS) },
        },
      ],
    },
    { $set: { lastErrorCode: null, status: 'SCANNING' } },
    { returnDocument: 'after' },
  ).select('+nextPageToken')

  if (!job) {
    throw new AppError(
      'A Gmail metadata batch is already in progress.',
      409,
      'GMAIL_SYNC_IN_PROGRESS',
    )
  }

  try {
    const updatedJob = await withGoogleClient(userId, async ({ connection, oauthClient }) => {
      const gmail = google.gmail({ auth: oauthClient, version: 'v1' })
      const listResponse = await gmail.users.messages.list({
        maxResults: BATCH_SIZE,
        pageToken: job.nextPageToken || undefined,
        userId: 'me',
      })
      const messages = listResponse.data.messages || []

      const processingUpdate = await GmailSyncJob.updateOne(
        { _id: job.id, status: { $ne: 'CANCELLED' }, userId },
        { $set: { estimatedTotal: listResponse.data.resultSizeEstimate ?? null, status: 'PROCESSING' } },
      )

      if (!processingUpdate.modifiedCount) return getSyncJob(userId)

      const results = await fetchMetadataBatch(gmail, messages)
      const criticalFailure = results.find((result) => {
        const status = result.reason?.response?.status || result.reason?.code
        const providerCode = result.reason?.response?.data?.error
        return result.status === 'rejected' && (
          status === 401 || status === 429 || providerCode === 'invalid_grant'
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
        const bulkResult = await GmailSignal.bulkWrite(
          signals.map((signal) => ({
            updateOne: {
              filter: {
                connectionId: signal.connectionId,
                messageIdHash: signal.messageIdHash,
                userId,
              },
              update: { $setOnInsert: signal },
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

      const updatedJob = await GmailSyncJob.findOneAndUpdate(
        { _id: job.id, status: { $ne: 'CANCELLED' }, userId },
        {
          $inc: { processedCount: messages.length, storedCount },
          $set: {
            completedAt: completed ? new Date() : null,
            lastErrorCode,
            nextPageToken,
            status: completed ? 'COMPLETED' : 'QUEUED',
          },
        },
        { returnDocument: 'after', runValidators: true },
      )

      if (!updatedJob) return getSyncJob(userId)

      if (completed) {
        await GoogleConnection.updateOne(
          { _id: connection.id, userId },
          { $set: { lastErrorCode, lastSyncAt: new Date(), status: 'CONNECTED' } },
        )
      }

      return updatedJob
    })

    if (updatedJob?.status === 'COMPLETED') await discoverAccountsForUser(userId)
    return updatedJob
  } catch (error) {
    await GmailSyncJob.updateOne(
      { _id: job.id, status: { $ne: 'CANCELLED' }, userId },
      { $set: { lastErrorCode: error.code || 'GMAIL_SYNC_FAILED', status: 'FAILED' } },
    )
    if (error.code !== 'GOOGLE_RECONNECT_REQUIRED') {
      await GoogleConnection.updateOne(
        { _id: job.connectionId, userId },
        { $set: { lastErrorCode: error.code || 'GMAIL_SYNC_FAILED', status: 'ERROR' } },
      )
    }
    throw error
  }
}

async function cancelSync(userId) {
  const job = await GmailSyncJob.findOneAndUpdate(
    { userId, status: { $in: ['QUEUED', 'SCANNING', 'PROCESSING'] } },
    { $set: { completedAt: new Date(), nextPageToken: null, status: 'CANCELLED' } },
    { returnDocument: 'after' },
  )

  if (job) {
    await GoogleConnection.updateOne(
      { _id: job.connectionId, userId },
      { $set: { lastErrorCode: null, status: 'CONNECTED' } },
    )
  }

  return job
}

export {
  cancelSync,
  deriveSignal,
  deriveSubjectSignal,
  getSyncJob,
  parseSender,
  processNextBatch,
  startSync,
}
