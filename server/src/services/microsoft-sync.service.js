import crypto from 'node:crypto'
import { getTokenEncryptionKey } from '../config/google.js'
import MicrosoftConnection from '../models/microsoft-connection.model.js'
import MicrosoftSignal from '../models/microsoft-signal.model.js'
import MicrosoftSyncJob from '../models/microsoft-sync-job.model.js'
import AppError from '../utils/app-error.js'
import { backgroundMailSyncEnabled, BATCH_LOCK_TIMEOUT_MS, retryBatchUpdate, withMailPublication } from './mail-sync-policy.js'
import { deriveSubjectSignal } from './gmail-sync.service.js'
import { discoverAccountsForUser } from './account-discovery.service.js'
import { extractBillingMetadata } from './subscription-detection.service.js'
import { syncMicrosoftSubscriptions } from './microsoft-subscription.service.js'
import { withMicrosoftAccessToken } from './microsoft-oauth.service.js'

const BATCH_SIZE = 25
const DEFAULT_MESSAGE_LIMIT = 2000
const GRAPH_ORIGIN = 'https://graph.microsoft.com'
const GRAPH_INBOX_PATHS = new Set([
  '/v1.0/me/mailFolders/inbox/messages',
  "/v1.0/me/mailFolders('inbox')/messages",
])
const MAX_GRAPH_RESPONSE_BYTES = 512_000
const activeBatchBarriers = new Map()

function getMessageLimit() {
  const configured = Number(process.env.MICROSOFT_SYNC_MESSAGE_LIMIT)
  return Number.isInteger(configured) && configured >= BATCH_SIZE && configured <= 20_000
    ? configured
    : DEFAULT_MESSAGE_LIMIT
}

function getSyncPolicy() {
  return { batchSize: BATCH_SIZE, messageLimit: getMessageLimit() }
}

function hashProviderId(userId, value) {
  return crypto.createHmac('sha256', getTokenEncryptionKey()).update(`${userId}:${value}`).digest('base64url')
}

function getGraphPageUrl(nextPageLink) {
  if (!nextPageLink) {
    return `${GRAPH_ORIGIN}/v1.0/me/mailFolders/inbox/messages?$top=${BATCH_SIZE}&$select=id,conversationId,from,subject,receivedDateTime`
  }
  let parsed
  try { parsed = new URL(nextPageLink) } catch { throw new AppError('Microsoft returned an invalid mailbox page.', 502, 'MICROSOFT_REQUEST_FAILED') }
  if (parsed.origin !== GRAPH_ORIGIN || parsed.protocol !== 'https:' || parsed.username || parsed.password || !GRAPH_INBOX_PATHS.has(parsed.pathname)) {
    throw new AppError('Microsoft returned an invalid mailbox page.', 502, 'MICROSOFT_REQUEST_FAILED')
  }
  return parsed.toString()
}

async function readBoundedJson(response, maximumBytes) {
  const declaredLength = Number(response.headers.get('content-length'))
  if (Number.isFinite(declaredLength) && declaredLength > maximumBytes) {
    throw new AppError('Microsoft returned an oversized mailbox response.', 502, 'MICROSOFT_REQUEST_FAILED')
  }
  const reader = response.body?.getReader()
  if (!reader) throw new AppError('Microsoft returned an invalid mailbox response.', 502, 'MICROSOFT_REQUEST_FAILED')
  const chunks = []
  let total = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > maximumBytes) {
        await reader.cancel()
        throw new AppError('Microsoft returned an oversized mailbox response.', 502, 'MICROSOFT_REQUEST_FAILED')
      }
      chunks.push(value)
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('Microsoft returned an invalid mailbox response.', 502, 'MICROSOFT_REQUEST_FAILED')
  }
}

async function graphRequest(accessToken, url) {
  let response
  try {
    response = await fetch(url, {
      headers: { authorization: `Bearer ${accessToken}` },
      redirect: 'error', signal: AbortSignal.timeout(15_000),
    })
  } catch {
    throw new AppError('Microsoft could not be reached. Try again.', 502, 'MICROSOFT_REQUEST_FAILED')
  }
  if (response.status === 401) throw new AppError('Reconnect Microsoft before scanning.', 409, 'MICROSOFT_RECONNECT_REQUIRED')
  if (response.status === 429) throw new AppError('Microsoft is temporarily busy. Try again shortly.', 429, 'MICROSOFT_RATE_LIMITED')
  if (!response.ok) throw new AppError('Microsoft could not read mailbox metadata. Try again.', 502, 'MICROSOFT_REQUEST_FAILED')
  return readBoundedJson(response, MAX_GRAPH_RESPONSE_BYTES)
}

function deriveSignal(userId, connectionId, message) {
  const senderEmail = typeof message?.from?.emailAddress?.address === 'string'
    ? message.from.emailAddress.address.trim().toLowerCase()
    : null
  const occurredAt = new Date(message?.receivedDateTime)
  if (!message?.id || !message?.conversationId || !senderEmail || Number.isNaN(occurredAt.getTime())) return null
  const billing = extractBillingMetadata(message.subject)
  return {
    userId, connectionId,
    messageIdHash: hashProviderId(userId, message.id),
    threadIdHash: hashProviderId(userId, message.conversationId),
    senderEmail,
    senderDomain: senderEmail.split('@').at(-1) || null,
    subjectSignal: deriveSubjectSignal(message.subject),
    occurredAt,
    billingAmountMinor: billing.amountMinor,
    billingCurrency: billing.currency,
    billingCycle: billing.billingCycle,
  }
}

async function getSyncJob(userId, { includePageLink = false } = {}) {
  const query = MicrosoftSyncJob.findOne({ userId })
  if (includePageLink) query.select('+nextPageLink +runId +leaseId +retryCount')
  return query
}

async function startSync(userId) {
  const connection = await MicrosoftConnection.findOne({ userId })
  if (!connection) throw new AppError('Connect Microsoft before starting a scan.', 409, 'MICROSOFT_NOT_CONNECTED')
  if (connection.status === 'NEEDS_RECONNECT') throw new AppError('Reconnect Microsoft before starting a scan.', 409, 'MICROSOFT_RECONNECT_REQUIRED')
  if (connection.status === 'DISCONNECTING') throw new AppError('Microsoft is disconnecting. Try again shortly.', 409, 'MICROSOFT_DISCONNECT_IN_PROGRESS')
  const now = new Date()
  const runId = crypto.randomUUID()
  let job
  try {
    job = await MicrosoftSyncJob.findOneAndUpdate(
      { userId, $or: [
        { status: { $nin: ['QUEUED', 'SCANNING', 'PROCESSING'] } },
        { status: { $in: ['SCANNING', 'PROCESSING'] }, updatedAt: { $lt: new Date(now.getTime() - BATCH_LOCK_TIMEOUT_MS) } },
      ] },
      { $set: { background: false, cancelRequestedAt: null, completedAt: null, connectionId: connection.id, estimatedTotal: null, lastErrorCode: null, leaseId: null, nextAttemptAt: null, nextPageLink: null, processedCount: 0, retryCount: 0, runId, startedAt: now, status: 'QUEUED', storedCount: 0 } },
      { returnDocument: 'after', runValidators: true, upsert: true },
    )
  } catch (error) {
    if (error?.code === 11000) throw new AppError('A Microsoft metadata scan is already in progress.', 409, 'MICROSOFT_SYNC_IN_PROGRESS')
    throw error
  }
  if (!job) throw new AppError('A Microsoft metadata scan is already in progress.', 409, 'MICROSOFT_SYNC_IN_PROGRESS')
  const updatedConnection = await MicrosoftConnection.updateOne(
    { _id: connection.id, userId, status: { $nin: ['DISCONNECTING', 'NEEDS_RECONNECT'] } },
    { $set: { lastErrorCode: null, status: 'SYNCING' } },
  )
  if (!updatedConnection.matchedCount) {
    await MicrosoftSyncJob.updateOne({ _id: job.id, runId, status: 'QUEUED' }, { $set: { status: 'CANCELLED', completedAt: new Date() } })
    throw new AppError('The Microsoft connection changed. Refresh before scanning.', 409, 'MICROSOFT_NOT_CONNECTED')
  }
  if (backgroundMailSyncEnabled()) {
    return await MicrosoftSyncJob.findOneAndUpdate(
      { _id: job.id, runId, status: 'QUEUED' },
      { $set: { background: true } },
      { returnDocument: 'after' },
    ) || await getSyncJob(userId)
  }
  return job
}

async function processNextBatch(userId, { expectedRunId, background = false } = {}) {
  const currentJob = await getSyncJob(userId, { includePageLink: true })
  if (!currentJob) throw new AppError('Start a Microsoft scan before processing it.', 409, 'MICROSOFT_SYNC_NOT_STARTED')
  if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(currentJob.status)) return currentJob
  if (background ? currentJob.runId !== expectedRunId || !currentJob.background
    : currentJob.background && backgroundMailSyncEnabled()) return currentJob

  const leaseId = crypto.randomUUID()
  const job = await MicrosoftSyncJob.findOneAndUpdate(
    {
      _id: currentJob.id,
      userId,
      runId: currentJob.runId,
      $or: [
        { status: 'QUEUED', ...(background ? { $or: [{ nextAttemptAt: null }, { nextAttemptAt: { $lte: new Date() } }] } : {}) },
        { status: { $in: ['SCANNING', 'PROCESSING'] }, updatedAt: { $lt: new Date(Date.now() - BATCH_LOCK_TIMEOUT_MS) } },
      ],
    },
    { $set: { lastErrorCode: null, leaseId, status: 'SCANNING' } }, { returnDocument: 'after' },
  ).select('+nextPageLink +runId +leaseId +retryCount')
  if (!job) throw new AppError('A Microsoft metadata batch is already in progress.', 409, 'MICROSOFT_SYNC_IN_PROGRESS')

  let releaseBarrier
  const barrierKey = `${userId}:${job.runId}:${leaseId}`
  const barrier = new Promise((resolve) => { releaseBarrier = resolve })
  activeBatchBarriers.set(barrierKey, barrier)
  try {
    return await withMicrosoftAccessToken(userId, async ({ accessToken, connection }) => {
      if (connection.id !== job.connectionId.toString()) {
        throw new AppError('The Microsoft connection changed.', 409, 'MICROSOFT_NOT_CONNECTED')
      }
      const page = await graphRequest(accessToken, getGraphPageUrl(job.nextPageLink))
      if (!Array.isArray(page.value) || page.value.length > BATCH_SIZE || (page['@odata.nextLink'] !== undefined && typeof page['@odata.nextLink'] !== 'string')) {
        throw new AppError('Microsoft returned an invalid mailbox response.', 502, 'MICROSOFT_REQUEST_FAILED')
      }
      const messages = page.value.slice(0, BATCH_SIZE)
      const processing = await MicrosoftSyncJob.updateOne(
        { _id: job.id, userId, runId: job.runId, leaseId, status: 'SCANNING' },
        { $set: { status: 'PROCESSING' } },
      )
      if (!processing.modifiedCount) return getSyncJob(userId)

      const signals = messages.map((message) => deriveSignal(userId, connection.id, message)).filter(Boolean)
      let storedCount = 0
      if (signals.length) {
        const activeLease = await MicrosoftSyncJob.exists({ _id: job.id, userId, runId: job.runId, leaseId, status: 'PROCESSING' })
        const activeConnection = await MicrosoftConnection.exists({ _id: connection.id, userId, status: { $in: ['SYNCING', 'CONNECTED'] } })
        if (!activeLease || !activeConnection) return getSyncJob(userId)
        const result = await MicrosoftSignal.bulkWrite(signals.map((signal) => ({ updateOne: {
          filter: { connectionId: signal.connectionId, messageIdHash: signal.messageIdHash, userId },
          update: { $set: { billingAmountMinor: signal.billingAmountMinor, billingCurrency: signal.billingCurrency, billingCycle: signal.billingCycle, occurredAt: signal.occurredAt, senderDomain: signal.senderDomain, senderEmail: signal.senderEmail, subjectSignal: signal.subjectSignal }, $setOnInsert: { connectionId: signal.connectionId, messageIdHash: signal.messageIdHash, syncRunId: job.runId, threadIdHash: signal.threadIdHash, userId } }, upsert: true,
        } })), { ordered: false })
        storedCount = result.upsertedCount
      }

      const processedCount = job.processedCount + messages.length
      const reachedLimit = processedCount >= getMessageLimit()
      const nextPageLink = reachedLimit ? null : page['@odata.nextLink'] || null
      const completed = !nextPageLink
      const lastErrorCode = reachedLimit && page['@odata.nextLink'] ? 'MESSAGE_LIMIT_REACHED' : null
      const claim = { _id: job.id, userId, runId: job.runId, leaseId, status: 'PROCESSING' }
      const saveProgress = () => MicrosoftSyncJob.findOneAndUpdate(
        claim,
        { $inc: { processedCount: messages.length, storedCount }, $set: { completedAt: completed ? new Date() : null, lastErrorCode, nextAttemptAt: null, nextPageLink, retryCount: 0, status: completed ? 'COMPLETED' : 'QUEUED' } },
        { returnDocument: 'after', runValidators: true },
      )
      const updated = completed ? await withMailPublication(userId, async () => {
        if (!await MicrosoftSyncJob.exists(claim)) return null
        await discoverAccountsForUser(userId)
        await syncMicrosoftSubscriptions(userId)
        await MicrosoftConnection.updateOne({ _id: connection.id, userId, status: 'SYNCING' }, { $set: { lastErrorCode, lastSyncAt: new Date(), status: 'CONNECTED' } })
        return saveProgress()
      }) : await saveProgress()
      if (!updated) {
        const currentState = await MicrosoftSyncJob.findById(job.id).select('+runId')
        if (currentState?.status === 'CANCELLED' && currentState.runId === job.runId) {
          await MicrosoftSignal.deleteMany({ userId, connectionId: job.connectionId, syncRunId: job.runId })
        }
        return getSyncJob(userId)
      }
      return updated
    })
  } catch (error) {
    const retry = retryBatchUpdate(job, error, background)
    if (retry) {
      await MicrosoftSyncJob.updateOne(
        { _id: job.id, userId, runId: job.runId, leaseId, status: { $in: ['SCANNING', 'PROCESSING'] } },
        { $set: { ...retry, lastErrorCode: error.code } },
      )
      return getSyncJob(userId)
    }
    const ownsLease = await MicrosoftSyncJob.exists({ _id: job.id, userId, runId: job.runId, leaseId, status: { $in: ['SCANNING', 'PROCESSING'] } })
    if (ownsLease) {
      if (error.code === 'MICROSOFT_RECONNECT_REQUIRED') await MicrosoftConnection.updateOne({ _id: job.connectionId, userId, status: 'SYNCING' }, { $set: { lastErrorCode: error.code, status: 'NEEDS_RECONNECT' } })
      else await MicrosoftConnection.updateOne({ _id: job.connectionId, userId, status: 'SYNCING' }, { $set: { lastErrorCode: error.code || 'MICROSOFT_SYNC_FAILED', status: 'ERROR' } })
      await MicrosoftSyncJob.updateOne({ _id: job.id, userId, runId: job.runId, leaseId, status: { $in: ['SCANNING', 'PROCESSING'] } }, { $set: { lastErrorCode: error.code || 'MICROSOFT_SYNC_FAILED', status: 'FAILED' } })
    } else {
      const currentState = await MicrosoftSyncJob.findById(job.id).select('+runId')
      if (currentState?.status === 'CANCELLED' && currentState.runId === job.runId) {
        await MicrosoftSignal.deleteMany({ userId, connectionId: job.connectionId, syncRunId: job.runId })
      }
    }
    throw error
  } finally {
    releaseBarrier()
    activeBatchBarriers.delete(barrierKey)
  }
}

async function cancelSync(userId) {
  const job = await MicrosoftSyncJob.findOneAndUpdate(
    { userId, status: { $in: ['QUEUED', 'SCANNING', 'PROCESSING'] } },
    { $set: { cancelRequestedAt: new Date(), completedAt: new Date(), leaseId: crypto.randomUUID(), nextPageLink: null, status: 'CANCELLED' } }, { returnDocument: 'after' },
  ).select('+runId')
  if (job) await MicrosoftConnection.updateOne({ _id: job.connectionId, userId, status: 'SYNCING' }, { $set: { lastErrorCode: null, status: 'CONNECTED' } })
  return job
}

async function cancelAndWaitForSync(userId) {
  const job = await withMailPublication(userId, () => cancelSync(userId))
  const barriers = [...activeBatchBarriers.entries()]
    .filter(([key]) => key.startsWith(`${userId}:`))
    .map(([, barrier]) => barrier)
  await Promise.all(barriers)
  if (job) await MicrosoftSignal.deleteMany({ userId, connectionId: job.connectionId, syncRunId: job.runId })
  return job
}

export { cancelAndWaitForSync, cancelSync, deriveSignal, getGraphPageUrl, getSyncJob, getSyncPolicy, processNextBatch, readBoundedJson, startSync }
