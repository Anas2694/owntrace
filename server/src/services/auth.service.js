import bcrypt from 'bcryptjs'
import { getBcryptRounds } from '../config/auth.js'
import User from '../models/user.model.js'
import AppError from '../utils/app-error.js'

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

export { authenticateUser, getUserById, registerUser, serializeUser }
