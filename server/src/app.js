import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js'
import {
  apiRateLimiter,
  createCorsOptions,
  requireTrustedOrigin,
} from './middleware/security.middleware.js'
import accountRouter from './routes/account.routes.js'
import accountActionRouter from './routes/account-action.routes.js'
import authRouter from './routes/auth.routes.js'
import googleRouter from './routes/google.routes.js'
import healthRouter from './routes/health.routes.js'
import identityRouter from './routes/identity.routes.js'
import onboardingRouter from './routes/onboarding.routes.js'
import privacyFeatureRouter from './routes/privacy-feature.routes.js'

const app = express()

app.disable('x-powered-by')
app.use(helmet({ hsts: process.env.NODE_ENV === 'production' ? undefined : false }))
app.use(cors(createCorsOptions()))
app.use(apiRateLimiter)
app.use(express.json({ limit: '100kb' }))
app.use(cookieParser())
app.use(requireTrustedOrigin)

app.use('/api/health', healthRouter)
app.use('/api/auth', authRouter)
app.use('/api/google', googleRouter)
app.use('/api/onboarding', onboardingRouter)
app.use('/api/accounts', accountRouter)
app.use('/api/account-actions', accountActionRouter)
app.use('/api/identity', identityRouter)
app.use('/api', privacyFeatureRouter)

app.use(notFoundHandler)
app.use(errorHandler)

export default app
