import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { afterAll, afterEach, beforeAll } from 'vitest'

process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'owntrace-test-secret-that-is-longer-than-thirty-two-characters'
process.env.CLIENT_ORIGINS = 'http://localhost:5173'

let mongoServer

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  await mongoose.connect(mongoServer.getUri())
})

afterEach(async () => {
  await Promise.all(
    Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({})),
  )
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongoServer?.stop()
})
