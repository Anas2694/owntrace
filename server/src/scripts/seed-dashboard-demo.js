import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { getBcryptRounds } from '../config/auth.js'
import User from '../models/user.model.js'
import Subscription from '../models/subscription.model.js'

dotenv.config()

const demoEmail = 'arpit.demo@owntrace.local'
const demoPassword = 'ArpitDemoPassword123'

const demoSubscriptions = [
  { serviceName: 'Spotify', category: 'Entertainment', cost: 119, billingCycle: 'monthly', status: 'active', source: 'manual' },
  { serviceName: 'Notion', category: 'Productivity', cost: 800, billingCycle: 'monthly', status: 'active', source: 'manual' },
  { serviceName: 'Adobe Creative Cloud', category: 'Design', cost: 1675, billingCycle: 'monthly', status: 'active', source: 'scan' },
  { serviceName: 'Dropbox', category: 'Storage', cost: 1200, billingCycle: 'yearly', status: 'dormant', source: 'scan' },
  { serviceName: 'Figma', category: 'Design', cost: 1500, billingCycle: 'monthly', status: 'cancelled', source: 'manual' },
]

async function seed() {
  const mongoUri = process.env.MONGO_URI?.trim()
  if (!mongoUri) throw new Error('MONGO_URI must be configured')

  await mongoose.connect(mongoUri)

  const passwordHash = await bcrypt.hash(demoPassword, getBcryptRounds())
  const user = await User.findOneAndUpdate(
    { email: demoEmail },
    { name: 'Arpit Sharma', email: demoEmail, passwordHash },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  )

  await Subscription.deleteMany({ userId: user._id })
  await Subscription.insertMany(demoSubscriptions.map((subscription) => ({ ...subscription, userId: user._id })))

  console.log(`Seeded dashboard demo user: ${demoEmail}`)
  console.log(`Demo password: ${demoPassword}`)
  console.log(`Seeded subscriptions: ${demoSubscriptions.length}`)
}

seed()
  .catch((error) => {
    console.error('Unable to seed dashboard demo data:', error.message)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
  })
