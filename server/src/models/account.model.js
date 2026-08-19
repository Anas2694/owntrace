import mongoose from 'mongoose'

const confidenceLevels = ['UNKNOWN', 'POSSIBLE', 'LIKELY', 'CONFIRMED']

const accountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    serviceKey: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 253,
    },
    serviceName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    primaryDomain: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 253,
    },
    confidenceScore: { type: Number, required: true, min: 0, max: 100 },
    confidenceLevel: {
      type: String,
      enum: confidenceLevels,
      required: true,
    },
    evidenceCount: { type: Number, required: true, min: 0 },
    ownershipEvidenceCount: { type: Number, required: true, min: 0 },
    evidenceClasses: { type: [String], default: [] },
    firstSeenAt: { type: Date, required: true },
    lastSeenAt: { type: Date, required: true },
    lastEvaluatedAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ['DISCOVERED'],
      default: 'DISCOVERED',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_document, returnedObject) {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
        delete returnedObject.userId
      },
    },
  },
)

accountSchema.index({ userId: 1, serviceKey: 1 }, { unique: true })
accountSchema.index({ userId: 1, confidenceScore: -1 })
accountSchema.index({ userId: 1, lastSeenAt: -1 })

const Account = mongoose.model('Account', accountSchema)

export { confidenceLevels }
export default Account
