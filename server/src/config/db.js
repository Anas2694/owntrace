import mongoose from 'mongoose'

async function connectDatabase() {
  const mongoUri = process.env.MONGO_URI?.trim()

  if (!mongoUri) {
    console.log('MongoDB connection skipped because MONGO_URI is not configured')
    return
  }

  await mongoose.connect(mongoUri)
  console.log('MongoDB connected')
}

export default connectDatabase
