import dotenv from 'dotenv'
import app from './app.js'
import { validateAuthEnvironment } from './config/auth.js'
import connectDatabase from './config/db.js'

dotenv.config()

const port = Number(process.env.PORT) || 5000

async function startServer() {
  validateAuthEnvironment()
  await connectDatabase()

  app.listen(port, () => {
    console.log(`OwnTrace API listening on port ${port}`)
  })
}

startServer().catch((error) => {
  console.error('Unable to start OwnTrace API:', error.message)
  process.exit(1)
})
