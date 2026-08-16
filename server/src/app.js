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
import authRouter from './routes/auth.routes.js'
import healthRouter from './routes/health.routes.js'

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

app.use(notFoundHandler)
app.use(errorHandler)

export default app
