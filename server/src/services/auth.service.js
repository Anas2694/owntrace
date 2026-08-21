import bcrypt from 'bcryptjs'
import { getBcryptRounds } from '../config/auth.js'
import AccountAction from '../models/account-action.model.js'
import AccountEvidence from '../models/account-evidence.model.js'
import Account from '../models/account.model.js'
import GmailSignal from '../models/gmail-signal.model.js'
import GmailSyncJob from '../models/gmail-sync-job.model.js'
import GoogleConnection from '../models/google-connection.model.js'
import User from '../models/user.model.js'
import AppError from '../utils/app-error.js'
import { revokeGoogleAccessForUser } from './google-oauth.service.js'

const DUMMY_PASSWORD_HASH = '$2b$12$OnbP9kWdyUNUxvOW.s950OcEToRQb8xqltZWIdmkSeXsYPip5BlS6'

function serializeUser(user) {
  return user.toJSON()
}

async function registerUser({ name, email, password }) {
  const existingUser = await User.exists({ email })

  if (existingUser) {
    throw new AppError('An account with this email already exists.', 409, 'EMAIL_IN_USE')
  }

  const passwordHash = await bcrypt.hash(password, getBcryptRounds())

  try {
    const user = await User.create({ email, name, passwordHash })
    return user
  } catch (error) {
    if (error?.code === 11000) {
      throw new AppError('An account with this email already exists.', 409, 'EMAIL_IN_USE')
    }

    throw error
  }
}

async function authenticateUser({ email, password }) {
  const user = await User.findOne({ email }).select('+passwordHash')
  const passwordMatches = await bcrypt.compare(password, user?.passwordHash || DUMMY_PASSWORD_HASH)

  if (!user || !passwordMatches) {
    throw new AppError('Email or password is incorrect.', 401, 'INVALID_CREDENTIALS')
  }

  return user
}

async function getUserById(userId) {
  const user = await User.findById(userId)

  if (!user) {
    throw new AppError('Authentication is required.', 401, 'UNAUTHENTICATED')
  }

  return user
}

async function deleteUserAccount(userId, password) {
  const user = await User.findById(userId).select('+passwordHash')
  const passwordMatches = await bcrypt.compare(password, user?.passwordHash || DUMMY_PASSWORD_HASH)

  if (!user || !passwordMatches) {
    throw new AppError(
      'Password confirmation failed.',
      401,
      'ACCOUNT_DELETION_CONFIRMATION_FAILED',
    )
  }

  let providerRevocation = 'NOT_CONNECTED'

  try {
    const revoked = await revokeGoogleAccessForUser(userId)
    if (revoked) providerRevocation = 'REVOKED'
  } catch {
    providerRevocation = 'FAILED'
  }

  await Promise.all([
    AccountAction.deleteMany({ userId }),
    AccountEvidence.deleteMany({ userId }),
    Account.deleteMany({ userId }),
    GmailSignal.deleteMany({ userId }),
    GmailSyncJob.deleteMany({ userId }),
    GoogleConnection.deleteMany({ userId }),
  ])
  await User.deleteOne({ _id: userId })

  return { providerRevocation }
}

export { authenticateUser, deleteUserAccount, getUserById, registerUser, serializeUser }
