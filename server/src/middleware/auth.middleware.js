import { SESSION_COOKIE_NAME } from '../config/auth.js'
import AppError from '../utils/app-error.js'
import { verifySessionToken } from '../utils/session.js'

function requireAuth(request, _response, next) {
  const token = request.cookies?.[SESSION_COOKIE_NAME]

  if (!token) {
    return next(new AppError('Authentication is required.', 401, 'UNAUTHENTICATED'))
  }

  try {
    const payload = verifySessionToken(token)
    request.auth = { userId: payload.sub }
    return next()
  } catch {
    return next(new AppError('Your session is invalid or has expired.', 401, 'INVALID_SESSION'))
  }
}

export default requireAuth
