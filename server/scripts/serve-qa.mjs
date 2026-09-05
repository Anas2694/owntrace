import { randomBytes } from 'node:crypto'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

// This process never loads .env or connects to the product database.
Object.assign(process.env, {
  NODE_ENV: 'test', LOG_LEVEL: 'silent', TRUST_PROXY: 'false', BCRYPT_ROUNDS: '10',
  JWT_SECRET: randomBytes(48).toString('base64url'),
  TOKEN_ENCRYPTION_KEY: randomBytes(32).toString('base64'),
  CLIENT_ORIGINS: 'http://localhost:5175', CLIENT_APP_URL: 'http://localhost:5175',
  GOOGLE_CLIENT_ID: '', GOOGLE_CLIENT_SECRET: '', GOOGLE_REDIRECT_URI: '',
  MICROSOFT_CLIENT_ID: '', MICROSOFT_CLIENT_SECRET: '', MICROSOFT_REDIRECT_URI: '',
})
const mongo = await MongoMemoryServer.create()
await mongoose.connect(mongo.getUri())
const { default: app } = await import('../src/app.js')
const server = app.listen(5056, '127.0.0.1', () => process.stdout.write('Isolated QA API ready on 127.0.0.1:5056; providers disabled; disposable database.\n'))
const close = async () => { await new Promise((resolve) => server.close(resolve)); await mongoose.disconnect(); await mongo.stop(); process.exit(0) }
process.once('SIGINT', close)
process.once('SIGTERM', close)
