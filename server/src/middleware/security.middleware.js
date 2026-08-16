import { rateLimit } from 'express-rate-limit'
import { getAllowedOrigins } from '../config/auth.js'
import AppError from '../utils/app-error.js'

const rateLimitResponse = {
  success: false,
  code: 'RATE_LIMITED',
  message: 'Too many requests. Please wait and try again.',
}

const apiRateLimiter = rateLimit({
  legacyHeaders: false,
  limit: 200,
  message: rateLimitResponse,
  skip: () => process.env.NODE_ENV === 'test',
  standardHeaders: 'draft-8',
  windowMs: 15 * 60 * 1000,
})

const authRateLimiter = rateLimit({
  legacyHeaders: false,
  limit: 20,
  message: rateLimitResponse,
  skip: () => process.env.NODE_ENV === 'test',
  standardHeaders: 'draft-8',
  windowMs: 15 * 60 * 1000,
})

function createCorsOptions() {
  const allowedOrigins = getAllowedOrigins()

  return {
    credentials: true,
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
        return
      }

      callback(new AppError('Request origin is not allowed.', 403, 'ORIGIN_NOT_ALLOWED'))
    },
  }
}

function requireTrustedOrigin(request, _response, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return next()
  if (process.env.NODE_ENV === 'test') return next()

  const origin = request.get('origin')

  if (!origin || !getAllowedOrigins().includes(origin)) {
    return next(new AppError('Request origin is not allowed.', 403, 'ORIGIN_NOT_ALLOWED'))
  }

  return next()
}

export { apiRateLimiter, authRateLimiter, createCorsOptions, requireTrustedOrigin }
