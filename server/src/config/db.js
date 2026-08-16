import mongoose from 'mongoose'

async function connectDatabase() {
  const mongoUri = process.env.MONGO_URI?.trim()

  if (!mongoUri) {
    throw new Error('MONGO_URI must be configured')
  }

  await mongoose.connect(mongoUri)
  console.log('MongoDB connected')
}

export default connectDatabase
