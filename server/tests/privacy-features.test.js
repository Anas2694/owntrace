import request from 'supertest'
import { beforeAll, describe, expect, it } from 'vitest'
import app from '../src/app.js'
import Account from '../src/models/account.model.js'
import PrivacyRequest from '../src/models/privacy-request.model.js'
import User from '../src/models/user.model.js'

const password = 'a secure privacy feature password'

async function registerUser(email) {
  const agent = request.agent(app)
  const response = await agent.post('/api/auth/register').send({
    email,
    name: 'Privacy Feature User',
    password,
  }).expect(201)
  return { agent, userId: response.body.user.id }
}

async function createAccount(userId, overrides = {}) {
  const observedAt = overrides.lastSeenAt || new Date()
  return Account.create({
    confidenceLevel: 'LIKELY',
    confidenceScore: 78,
    dormantReason: 'Recent account evidence exists.',
    dormantStatus: 'ACTIVE',
    evidenceClasses: ['SUBSCRIPTION'],
    evidenceCount: 1,
    firstSeenAt: observedAt,
    lastEvaluatedAt: observedAt,
    lastOwnershipEvidenceAt: observedAt,
    lastSeenAt: observedAt,
    ownershipEvidenceCount: 1,
    primaryDomain: 'example.com',
    serviceKey: 'example.com',
    serviceName: 'Example',
    userId,
    ...overrides,
  })
}

beforeAll(async () => {
  await Promise.all([User.init(), Account.init(), PrivacyRequest.init()])
})

describe('Raphael-owned website feature APIs', () => {
  it('requires authentication on every feature route', async () => {
    const routes = [
      '/api/subscriptions',
      '/api/breaches',
      '/api/exposures',
      '/api/privacy-health',
      '/api/notifications',
      '/api/privacy-requests',
    ]
    await Promise.all(routes.map((route) => request(app).get(route).expect(401)))
    await request(app).post('/api/privacy-requests').send({}).expect(401)
    await request(app).patch('/api/privacy-requests/not-an-id').send({ status: 'READY' }).expect(401)
  })

  it('returns bounded subscription signals for only the authenticated user', async () => {
    const first = await registerUser('subscriptions-first@example.com')
    const second = await registerUser('subscriptions-second@example.com')
    await Promise.all([
      createAccount(first.userId, {
        evidenceClasses: ['PAYMENT', 'SUBSCRIPTION'],
        primaryDomain: 'music.example',
        serviceKey: 'music.example',
        serviceName: 'Music Example',
      }),
      createAccount(second.userId, {
        primaryDomain: 'private.example',
        serviceKey: 'private.example',
        serviceName: 'Private Subscription',
      }),
    ])

    const response = await first.agent.get('/api/subscriptions?page=1&limit=1').expect(200)
    expect(response.body.pagination).toEqual({ limit: 1, page: 1, pages: 1, total: 1 })
    expect(response.body.subscriptions[0]).toMatchObject({
      basis: ['PAYMENT', 'SUBSCRIPTION'],
      detection: 'GMAIL_METADATA_SIGNAL',
      price: null,
      renewalDate: null,
      serviceName: 'Music Example',
    })
    expect(JSON.stringify(response.body)).not.toContain('Private Subscription')
    expect(response.body.subscriptions[0]).not.toHaveProperty('userId')
    await first.agent.get('/api/subscriptions?limit=101').expect(400)
    await first.agent.get('/api/subscriptions?page[$gt]=0').expect(400)
  })

  it('keeps verified breaches empty and labels metadata-derived security signals truthfully', async () => {
    const { agent, userId } = await registerUser('breach-signals@example.com')
    await createAccount(userId, {
      evidenceClasses: ['PASSWORD_RESET', 'SECURITY_ALERT'],
      primaryDomain: 'security.example',
      serviceKey: 'security.example',
      serviceName: 'Security Example',
    })

    const response = await agent.get('/api/breaches').expect(200)
    expect(response.body.breaches).toEqual([])
    expect(response.body.provider.configured).toBe(false)
    expect(response.body.securitySignals).toHaveLength(1)
    expect(response.body.securitySignals[0]).toMatchObject({
      serviceName: 'Security Example',
      verifiedBreach: false,
    })
  })

  it('returns bounded exposure review signals without claiming public exposure', async () => {
    const first = await registerUser('exposure-first@example.com')
    const second = await registerUser('exposure-second@example.com')
    const dormantDate = new Date()
    dormantDate.setUTCMonth(dormantDate.getUTCMonth() - 30)
    await Promise.all([
      createAccount(first.userId, {
        dormantStatus: 'DORMANT',
        firstSeenAt: dormantDate,
        lastOwnershipEvidenceAt: dormantDate,
        lastSeenAt: dormantDate,
        primaryDomain: 'old.example',
        serviceKey: 'old.example',
        serviceName: 'Old Account',
      }),
      createAccount(second.userId, {
        primaryDomain: 'other.example',
        serviceKey: 'other.example',
        serviceName: 'Other User Account',
      }),
    ])

    const response = await first.agent.get('/api/exposures?limit=10').expect(200)
    expect(response.body.exposureSignals).toHaveLength(1)
    expect(response.body.exposureSignals[0]).toMatchObject({
      level: 'MEDIUM',
      serviceName: 'Old Account',
      verifiedPublicExposure: false,
    })
    expect(JSON.stringify(response.body)).not.toContain('Other User Account')
  })

  it('calculates deterministic Privacy Health from current account and action summaries', async () => {
    const empty = await registerUser('health-empty@example.com')
    const emptyResponse = await empty.agent.get('/api/privacy-health').expect(200)
    expect(emptyResponse.body.health).toMatchObject({
      confidence: 'NOT_ENOUGH_DATA',
      score: null,
    })

    const populated = await registerUser('health-populated@example.com')
    await createAccount(populated.userId, {
      confidenceLevel: 'CONFIRMED',
      confidenceScore: 92,
      evidenceClasses: ['SECURITY_ALERT'],
      primaryDomain: 'risk.example',
      serviceKey: 'risk.example',
      serviceName: 'Risk Example',
    })
    const first = await populated.agent.get('/api/privacy-health').expect(200)
    const second = await populated.agent.get('/api/privacy-health').expect(200)
    expect(first.body.health).toEqual(second.body.health)
    expect(first.body.health.confidence).toBe('DERIVED_FROM_CURRENT_SIGNALS')
    expect(first.body.health.score).toBeGreaterThanOrEqual(0)
    expect(first.body.health.score).toBeLessThanOrEqual(100)
  })

  it('validates and user-scopes the privacy request lifecycle', async () => {
    const first = await registerUser('requests-first@example.com')
    const second = await registerUser('requests-second@example.com')
    await first.agent.post('/api/privacy-requests').send({ requestType: 'DELETE' }).expect(400)

    const created = await first.agent.post('/api/privacy-requests').send({
      notes: 'Use the official privacy form.',
      requestType: 'DELETE',
      serviceName: 'Example Service',
    }).expect(201)
    expect(created.body.privacyRequest).toMatchObject({
      requestType: 'DELETE',
      serviceName: 'Example Service',
      status: 'DRAFT',
    })
    expect(created.body.privacyRequest).not.toHaveProperty('userId')

    await second.agent
      .patch(`/api/privacy-requests/${created.body.privacyRequest.id}`)
      .send({ status: 'READY' })
      .expect(404)
    await first.agent
      .patch(`/api/privacy-requests/${created.body.privacyRequest.id}`)
      .send({ status: 'COMPLETED' })
      .expect(409)
    const ready = await first.agent
      .patch(`/api/privacy-requests/${created.body.privacyRequest.id}`)
      .send({ status: 'READY' })
      .expect(200)
    expect(ready.body.privacyRequest.status).toBe('READY')
  })

  it('paginates privacy requests and rejects invalid query controls', async () => {
    const { agent } = await registerUser('request-list@example.com')
    await Promise.all(['One', 'Two'].map((serviceName) => agent.post('/api/privacy-requests').send({
      requestType: 'ACCESS',
      serviceName,
    }).expect(201)))

    const response = await agent.get('/api/privacy-requests?page=1&limit=1').expect(200)
    expect(response.body.requests).toHaveLength(1)
    expect(response.body.pagination).toEqual({ limit: 1, page: 1, pages: 2, total: 2 })
    await agent.get('/api/privacy-requests?status=unknown').expect(400)
    await agent.get('/api/privacy-requests?page=0').expect(400)
  })

  it('derives bounded notifications without exposing another user records', async () => {
    const first = await registerUser('notifications-first@example.com')
    const second = await registerUser('notifications-second@example.com')
    const firstRequest = await first.agent.post('/api/privacy-requests').send({
      requestType: 'OPT_OUT',
      serviceName: 'Visible Service',
    }).expect(201)
    await first.agent.patch(`/api/privacy-requests/${firstRequest.body.privacyRequest.id}`)
      .send({ status: 'READY' }).expect(200)
    await second.agent.post('/api/privacy-requests').send({
      requestType: 'ACCESS',
      serviceName: 'Private Service',
    }).expect(201)

    const response = await first.agent.get('/api/notifications?limit=10').expect(200)
    expect(response.body.notifications.some((item) => item.title.includes('Visible Service'))).toBe(true)
    expect(JSON.stringify(response.body)).not.toContain('Private Service')
    expect(JSON.stringify(response.body)).not.toContain(first.userId)
    await first.agent.get('/api/notifications?limit=51').expect(400)
  })

  it('removes Raphael-owned persistent records during permanent account deletion', async () => {
    const { agent, userId } = await registerUser('privacy-delete@example.com')
    await agent.post('/api/privacy-requests').send({
      requestType: 'DELETE',
      serviceName: 'Deletion Example',
    }).expect(201)
    expect(await PrivacyRequest.countDocuments({ userId })).toBe(1)

    await agent.delete('/api/auth/account').send({ confirmation: 'DELETE', password }).expect(200)
    expect(await PrivacyRequest.countDocuments({ userId })).toBe(0)
    expect(await User.countDocuments({ _id: userId })).toBe(0)
  })
})
