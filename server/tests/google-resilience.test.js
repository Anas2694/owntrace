import { google } from 'googleapis'
import request from 'supertest'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import app from '../src/app.js'
import { GMAIL_METADATA_SCOPE } from '../src/config/google.js'
import Account from '../src/models/account.model.js'
import AccountEvidence from '../src/models/account-evidence.model.js'
import GmailSignal from '../src/models/gmail-signal.model.js'
import GmailSyncJob from '../src/models/gmail-sync-job.model.js'
import GoogleConnection from '../src/models/google-connection.model.js'
import User from '../src/models/user.model.js'
import { startBackgroundMailSync } from '../src/services/background-mail-sync.service.js'
import { BATCH_LOCK_TIMEOUT_MS } from '../src/services/mail-sync-policy.js'
import { decryptSecret, encryptSecret } from '../src/utils/encryption.js'

beforeAll(async () => { await Promise.all([GoogleConnection.init(), GmailSyncJob.init(), GmailSignal.init()]) })
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs() })

async function fixture() {
  const agent = request.agent(app)
  const { body } = await agent.post('/api/auth/register').send({ name: 'Scan Test', email: 'scan@example.com', password: 'synthetic scan test password' }).expect(201)
  const userId = body.user.id
  await User.updateOne({ _id: userId }, { $set: { onboardingStatus: 'COMPLETED' } })
  const connection = await GoogleConnection.create({ userId, email: 'scan@example.com', googleAccountId: 'original-account', scopes: [GMAIL_METADATA_SCOPE], encryptedAccessToken: encryptSecret('synthetic-access'), encryptedRefreshToken: encryptSecret('synthetic-refresh'), tokenExpiresAt: new Date(Date.now() + 3_600_000) })
  return { agent, userId, connection }
}

const metadata = (id) => ({ id, threadId: `thread-${id}`, internalDate: String(Date.now()), payload: { headers: [{ name: 'From', value: 'account@canva.com' }, { name: 'Subject', value: 'Verify your account' }] } })

describe('Google connection resilience', () => {
  it('allows only one simultaneous scan start and never serializes worker identifiers', async () => {
    const { agent } = await fixture()
    const starts = await Promise.all([agent.post('/api/google/sync'), agent.post('/api/google/sync')])
    expect(starts.map((response) => response.status).sort()).toEqual([202, 409])
    const { body } = await agent.get('/api/google/sync').expect(200)
    expect(body.sync).not.toHaveProperty('runId')
    expect(body.sync).not.toHaveProperty('leaseId')
  })

  it('honors a message cap that is not a multiple of the batch size', async () => {
    vi.stubEnv('GMAIL_SYNC_MESSAGE_LIMIT', '37')
    const { agent } = await fixture()
    const list = vi.fn(({ maxResults, pageToken }) => Promise.resolve({ data: { messages: Array.from({ length: maxResults }, (_, index) => ({ id: `${pageToken || 'first'}-${index}` })), nextPageToken: 'next', resultSizeEstimate: 201 } }))
    const get = vi.fn(({ id }) => Promise.resolve({ data: metadata(id) }))
    vi.spyOn(google, 'gmail').mockReturnValue({ users: { messages: { list, get } } })
    await agent.post('/api/google/sync').expect(202)
    await agent.post('/api/google/sync/next').expect(200)
    const { body } = await agent.post('/api/google/sync/next').expect(200)
    expect(body.sync).toMatchObject({ processedCount: 37, status: 'COMPLETED', lastErrorCode: 'MESSAGE_LIMIT_REACHED' })
    expect(list.mock.calls.map(([args]) => args.maxResults)).toEqual([25, 12])
    expect(get).toHaveBeenCalledTimes(37)
  })

  it('recovers a stale background claim and publishes results without browser batch requests', async () => {
    vi.stubEnv('MAIL_BACKGROUND_SYNC', 'true')
    const { agent, userId } = await fixture()
    const list = vi.fn().mockResolvedValue({ data: { messages: [{ id: 'resumed-message' }] } })
    const get = vi.fn().mockResolvedValue({ data: metadata('resumed-message') })
    vi.spyOn(google, 'gmail').mockReturnValue({ users: { messages: { list, get } } })
    const { body } = await agent.post('/api/google/sync').expect(202)
    expect(body.sync.background).toBe(true)
    await GmailSyncJob.updateOne(
      { userId },
      { $set: { status: 'PROCESSING', leaseId: 'previous-worker', updatedAt: new Date(Date.now() - BATCH_LOCK_TIMEOUT_MS - 1000) } },
      { timestamps: false },
    )
    const stop = startBackgroundMailSync({ intervalMs: 25 })
    try {
      await agent.post('/api/google/sync/next').expect(200)
      await vi.waitFor(async () => {
        expect((await GmailSyncJob.findOne({ userId })).status).toBe('COMPLETED')
      })
      expect(list).toHaveBeenCalledTimes(1)
      expect(await GmailSignal.countDocuments({ userId })).toBe(1)
      expect(await Account.countDocuments({ userId })).toBe(1)
    } finally {
      await stop()
    }
  })

  it('persists backoff after a provider rate limit and resumes after the worker stops', async () => {
    vi.stubEnv('MAIL_BACKGROUND_SYNC', 'true')
    const { agent, userId } = await fixture()
    const list = vi.fn()
      .mockRejectedValueOnce({ response: { status: 429 } })
      .mockResolvedValue({ data: { messages: [] } })
    vi.spyOn(google, 'gmail').mockReturnValue({ users: { messages: { list } } })
    await agent.post('/api/google/sync').expect(202)
    const stop = startBackgroundMailSync({ intervalMs: 25 })
    try {
      await vi.waitFor(async () => {
        const job = await GmailSyncJob.findOne({ userId }).select('+nextAttemptAt +retryCount')
        expect(job).toMatchObject({ status: 'QUEUED', retryCount: 1, lastErrorCode: 'GOOGLE_RATE_LIMITED' })
        expect(job.nextAttemptAt.getTime()).toBeGreaterThan(Date.now())
      })
      await agent.post('/api/google/sync/next').expect(200)
      expect(list).toHaveBeenCalledTimes(1)
    } finally {
      await stop()
    }
    await GmailSyncJob.updateOne({ userId }, { $set: { nextAttemptAt: new Date(0) } })
    const stopRestarted = startBackgroundMailSync({ intervalMs: 25 })
    try {
      await vi.waitFor(async () => {
        expect((await GmailSyncJob.findOne({ userId })).status).toBe('COMPLETED')
      })
      expect(list).toHaveBeenCalledTimes(2)
    } finally {
      await stopRestarted()
    }
  })

  it.each([
    { background: false, deleting: false },
    { background: true, deleting: false },
    { background: true, deleting: true },
  ])('drains an outstanding batch before cleanup ($background, $deleting)', async ({ background, deleting }) => {
    vi.stubEnv('MAIL_BACKGROUND_SYNC', String(background))
    const { agent, userId } = await fixture()
    let release, started
    const held = new Promise((resolve) => { release = resolve })
    const entered = new Promise((resolve) => { started = resolve })
    vi.spyOn(google, 'gmail').mockReturnValue({ users: { messages: {
      list: vi.fn().mockResolvedValue({ data: { messages: [{ id: 'held-message' }] } }),
      get: vi.fn(async () => { started(); await held; return { data: metadata('held-message') } }),
    } } })
    vi.spyOn(google.auth.OAuth2.prototype, 'revokeToken').mockResolvedValue({ data: {} })
    await agent.post('/api/google/sync').expect(202)
    const stop = background ? startBackgroundMailSync({ intervalMs: 25 }) : null
    const batch = background ? null : agent.post('/api/google/sync/next').then((response) => response)
    try {
      await entered
      const cleanup = deleting
        ? agent.delete('/api/auth/account').send({ confirmation: 'DELETE', password: 'synthetic scan test password' })
        : agent.delete('/api/google/connection')
      const disconnected = cleanup.then((response) => response)
      try {
        await vi.waitFor(async () => { expect((await GoogleConnection.findOne({ userId }))?.status).toBe('DISCONNECTING') })
      } finally { release() }
      if (batch) expect((await batch).status).toBe(200)
      expect((await disconnected).status).toBe(200)
    } finally {
      release()
      await stop?.()
    }
    for (const model of [GoogleConnection, GmailSignal, GmailSyncJob, Account, AccountEvidence]) expect(await model.countDocuments({ userId })).toBe(0)
    const user = await User.findById(userId)
    if (deleting) expect(user).toBeNull()
    else expect(user.onboardingStatus).toBe('COMPLETED')
  })

  it.each(['original-account', 'different-account'])('handles reconnect identity %s without mixing refresh tokens or resetting onboarding', async (identity) => {
    const { agent, userId } = await fixture()
    const start = await agent.get('/api/google/oauth/start').expect(302)
    const state = new URL(start.headers.location).searchParams.get('state')
    vi.spyOn(google.auth.OAuth2.prototype, 'getToken').mockResolvedValue({ tokens: { access_token: 'replacement-access', expiry_date: Date.now() + 3_600_000, id_token: 'synthetic-id', scope: `openid email ${GMAIL_METADATA_SCOPE}` } })
    vi.spyOn(google.auth.OAuth2.prototype, 'verifyIdToken').mockResolvedValue({ getPayload: () => ({ email: 'scan@example.com', email_verified: true, sub: identity }) })
    const callback = await agent.get(`/api/google/oauth/callback?code=synthetic-code&state=${encodeURIComponent(state)}`).expect(302)
    expect(callback.headers.location).toContain(identity === 'original-account' ? 'google=connected' : 'google=google_account_mismatch')
    const stored = await GoogleConnection.findOne({ userId }).select('+encryptedAccessToken +encryptedRefreshToken')
    expect(stored.googleAccountId).toBe('original-account')
    expect(decryptSecret(stored.encryptedRefreshToken)).toBe('synthetic-refresh')
    expect(decryptSecret(stored.encryptedAccessToken)).toBe(identity === 'original-account' ? 'replacement-access' : 'synthetic-access')
    expect((await User.findById(userId)).onboardingStatus).toBe('COMPLETED')
  })
})
