import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import request from 'supertest'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import app from '../src/app.js'
import { TOKEN_AUDIENCE, TOKEN_ISSUER, getJwtSecret } from '../src/config/auth.js'
import { requireTrustedOrigin } from '../src/middleware/security.middleware.js'
import User from '../src/models/user.model.js'

const validRegistration = {
  name: 'Anas Example',
  email: 'anas@example.com',
  password: 'correct horse battery staple',
}

beforeAll(async () => {
  await User.init()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('authentication API', () => {
  describe('POST /api/auth/register', () => {
    it('creates a minimal user, hashes the password, and starts a cookie session', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Origin', 'http://localhost:5173')
        .send({ ...validRegistration, email: '  ANAS@EXAMPLE.COM  ' })
        .expect(201)

      expect(response.body).toMatchObject({
        success: true,
        user: {
          authProviders: ['password'],
          email: 'anas@example.com',
          emailVerified: false,
          name: 'Anas Example',
          onboardingStatus: 'NOT_STARTED',
        },
      })
      expect(response.body.user).not.toHaveProperty('passwordHash')
      expect(response.headers['set-cookie'][0]).toContain('owntrace_session=')
      expect(response.headers['set-cookie'][0]).toContain('HttpOnly')
      expect(response.headers['set-cookie'][0]).toContain('SameSite=Lax')
      expect(response.headers['set-cookie'][0]).not.toContain('Secure')

      const storedUser = await User.findOne({ email: 'anas@example.com' }).select('+passwordHash')
      expect(storedUser.passwordHash).not.toBe(validRegistration.password)
      expect(await bcrypt.compare(validRegistration.password, storedUser.passwordHash)).toBe(true)
    })

    it('rejects duplicate registration without exposing the stored user', async () => {
      await request(app).post('/api/auth/register').send(validRegistration).expect(201)

      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validRegistration, name: 'Another Name' })
        .expect(409)

      expect(response.body).toEqual({
        success: false,
        code: 'EMAIL_IN_USE',
        message: 'An account with this email already exists.',
      })
      expect(await User.countDocuments({ email: validRegistration.email })).toBe(1)
    })

    it.each([
      [{ ...validRegistration, name: '' }, 'name'],
      [{ ...validRegistration, email: 'not-an-email' }, 'email'],
      [{ ...validRegistration, password: 'too-short' }, 'password'],
    ])('returns field validation for invalid registration input', async (payload, field) => {
      const response = await request(app).post('/api/auth/register').send(payload).expect(400)

      expect(response.body.code).toBe('VALIDATION_ERROR')
      expect(response.body.errors).toHaveProperty(field)
    })

    it('rejects untrusted browser origins', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Origin', 'https://attacker.example')
        .send(validRegistration)
        .expect(403)

      expect(response.body.code).toBe('ORIGIN_NOT_ALLOWED')
      expect(await User.countDocuments()).toBe(0)
    })

    it('rejects unsafe requests without an Origin outside the test bypass', () => {
      const requestWithoutOrigin = { get: () => undefined, method: 'POST' }
      const next = vi.fn()
      const originalNodeEnvironment = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      try {
        requireTrustedOrigin(requestWithoutOrigin, {}, next)
      } finally {
        process.env.NODE_ENV = originalNodeEnvironment
      }

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        code: 'ORIGIN_NOT_ALLOWED',
        statusCode: 403,
      }))
    })
  })

  describe('POST /api/auth/login', () => {
    it('authenticates a valid password and returns only safe user fields', async () => {
      await request(app).post('/api/auth/register').send(validRegistration).expect(201)

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ANAS@EXAMPLE.COM', password: validRegistration.password })
        .expect(200)

      expect(response.body.user.email).toBe(validRegistration.email)
      expect(response.body.user).not.toHaveProperty('passwordHash')
      expect(response.headers['set-cookie'][0]).toContain('HttpOnly')
    })

    it.each([
      ['wrong password', { email: validRegistration.email, password: 'this password is incorrect' }],
      ['unknown email', { email: 'unknown@example.com', password: validRegistration.password }],
    ])('returns the same safe error for %s', async (_case, credentials) => {
      await request(app).post('/api/auth/register').send(validRegistration).expect(201)

      const response = await request(app).post('/api/auth/login').send(credentials).expect(401)

      expect(response.body).toEqual({
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: 'Email or password is incorrect.',
      })
    })
  })

  describe('session routes', () => {
    it('returns a console-safe empty result when no restorable session exists', async () => {
      const response = await request(app).get('/api/auth/session').expect(200)

      expect(response.body).toEqual({ success: true, user: null })
    })

    it('restores an authenticated session through GET /api/auth/session', async () => {
      const agent = request.agent(app)
      await agent.post('/api/auth/register').send(validRegistration).expect(201)

      const response = await agent.get('/api/auth/session').expect(200)

      expect(response.body.user).toMatchObject({
        email: validRegistration.email,
        name: validRegistration.name,
      })
      expect(response.body.user).not.toHaveProperty('passwordHash')
    })

    it('does not disguise an unexpected database failure as a signed-out session', async () => {
      const agent = request.agent(app)
      await agent.post('/api/auth/register').send(validRegistration).expect(201)
      vi.spyOn(User, 'findById').mockRejectedValueOnce(new Error('database unavailable'))
      vi.spyOn(console, 'error').mockImplementation(() => {})

      const response = await agent.get('/api/auth/session').expect(500)

      expect(response.body).toEqual({
        success: false,
        code: 'INTERNAL_ERROR',
        message: 'An unexpected server error occurred.',
      })
    })

    it('rejects missing and invalid session cookies', async () => {
      const missing = await request(app).get('/api/auth/me').expect(401)
      const invalid = await request(app)
        .get('/api/auth/me')
        .set('Cookie', 'owntrace_session=not-a-valid-token')
        .expect(401)

      expect(missing.body.code).toBe('UNAUTHENTICATED')
      expect(invalid.body.code).toBe('INVALID_SESSION')
    })

    it('rejects an expired signed session token', async () => {
      const expiredToken = jwt.sign({}, getJwtSecret(), {
        algorithm: 'HS256',
        audience: TOKEN_AUDIENCE,
        expiresIn: -1,
        issuer: TOKEN_ISSUER,
        subject: '507f1f77bcf86cd799439011',
      })

      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', `owntrace_session=${expiredToken}`)
        .expect(401)

      expect(response.body.code).toBe('INVALID_SESSION')
    })

    it('clears the cookie and ends the browser session on logout', async () => {
      const agent = request.agent(app)
      await agent.post('/api/auth/register').send(validRegistration).expect(201)

      const response = await agent.post('/api/auth/logout').expect(200)

      expect(response.headers['set-cookie'][0]).toContain('owntrace_session=;')
      await agent.get('/api/auth/me').expect(401)
    })
  })
})
