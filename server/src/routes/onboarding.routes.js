import { Router } from 'express'
import { getOnboarding, updateOnboarding } from '../controllers/onboarding.controller.js'
import requireAuth from '../middleware/auth.middleware.js'

const onboardingRouter = Router()

onboardingRouter.use(requireAuth)
onboardingRouter.get('/', getOnboarding)
onboardingRouter.patch('/', updateOnboarding)

export default onboardingRouter
