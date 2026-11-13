import mongoose from 'mongoose'
const microsoftSyncJobSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true }, connectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'MicrosoftConnection', required: true },
  status: { type: String, enum: ['QUEUED', 'SCANNING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'], default: 'QUEUED' }, processedCount: { type: Number, default: 0, min: 0 }, storedCount: { type: Number, default: 0, min: 0 }, estimatedTotal: { type: Number, default: null, min: 0 }, nextPageLink: { type: String, default: null, select: false }, lastErrorCode: { type: String, default: null }, startedAt: { type: Date, default: Date.now }, completedAt: { type: Date, default: null },
  runId: { type: String, required: true, default: () => new mongoose.Types.ObjectId().toString(), select: false },
  cancelRequestedAt: { type: Date, default: null, select: false },
  leaseId: { type: String, default: null, select: false },
  background: { type: Boolean, default: false },
  nextAttemptAt: { type: Date, default: null, select: false },
  retryCount: { type: Number, default: 0, select: false },
}, {
  timestamps: true,
  toJSON: {
    transform(_doc, value) {
      value.id = value._id.toString()
      for (const key of ['_id', '__v', 'userId', 'connectionId', 'nextPageLink', 'runId', 'leaseId', 'cancelRequestedAt', 'nextAttemptAt', 'retryCount']) {
        delete value[key]
      }
      value.background = value.background && process.env.MAIL_BACKGROUND_SYNC === 'true'
      return value
    },
  },
})
microsoftSyncJobSchema.index({ background: 1, status: 1, updatedAt: 1 })
const MicrosoftSyncJob = mongoose.model('MicrosoftSyncJob', microsoftSyncJobSchema)
export default MicrosoftSyncJob
