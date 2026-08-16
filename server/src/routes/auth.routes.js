import { Router } from 'express'
import { login, logout, me, register, session } from '../controllers/auth.controller.js'
import requireAuth from '../middleware/auth.middleware.js'
import { authRateLimiter } from '../middleware/security.middleware.js'

const authRouter = Router()

authRouter.post('/register', authRateLimiter, register)
authRouter.post('/login', authRateLimiter, login)
authRouter.post('/logout', logout)
authRouter.get('/session', session)
authRouter.get('/me', requireAuth, me)

export default authRouter
