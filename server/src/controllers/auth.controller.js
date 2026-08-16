import {
  authenticateUser,
  getUserById,
  registerUser,
  serializeUser,
} from '../services/auth.service.js'
import { SESSION_COOKIE_NAME } from '../config/auth.js'
import AppError from '../utils/app-error.js'
import {
  clearSessionCookie,
  createSessionToken,
  setSessionCookie,
  verifySessionToken,
} from '../utils/session.js'
import { validateLoginInput, validateRegistrationInput } from '../utils/validation.js'

function throwValidationError(errors) {
  if (Object.keys(errors).length) {
    throw new AppError('Please correct the highlighted fields.', 400, 'VALIDATION_ERROR', errors)
  }
}

async function register(request, response) {
  const { data, errors } = validateRegistrationInput(request.body)
  throwValidationError(errors)

  const user = await registerUser(data)
  setSessionCookie(response, createSessionToken(user.id))

  response.status(201).json({ success: true, user: serializeUser(user) })
}

async function login(request, response) {
  const { data, errors } = validateLoginInput(request.body)
  throwValidationError(errors)

  const user = await authenticateUser(data)
  setSessionCookie(response, createSessionToken(user.id))

  response.status(200).json({ success: true, user: serializeUser(user) })
}

function logout(_request, response) {
  clearSessionCookie(response)
  response.status(200).json({ success: true, message: 'Signed out successfully.' })
}

async function me(request, response) {
  response.status(200).json({ success: true, user: serializeUser(request.user) })
}

async function session(request, response) {
  const token = request.cookies?.[SESSION_COOKIE_NAME]

  if (!token) {
    response.status(200).json({ success: true, user: null })
    return
  }

  let payload

  try {
    payload = verifySessionToken(token)
  } catch {
    clearSessionCookie(response)
    response.status(200).json({ success: true, user: null })
    return
  }

  try {
    const user = await getUserById(payload.sub)
    response.status(200).json({ success: true, user: serializeUser(user) })
  } catch (error) {
    if (!(error instanceof AppError) || error.statusCode !== 401) throw error

    clearSessionCookie(response)
    response.status(200).json({ success: true, user: null })
  }
}

export { login, logout, me, register, session }
