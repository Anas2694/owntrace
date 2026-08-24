import mongoose from 'mongoose'

const onboardingStates = [
  'NOT_STARTED',
  'PRIVACY_REVIEWED',
  'GMAIL_PENDING',
  'SCAN_PENDING',
  'COMPLETED',
]

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    authProviders: {
      type: [String],
      enum: ['password', 'google', 'microsoft'],
      default: ['password'],
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    onboardingStatus: {
      type: String,
      enum: onboardingStates,
      default: 'NOT_STARTED',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_document, returnedObject) {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
        delete returnedObject.passwordHash
        return returnedObject
      },
    },
  },
)

userSchema.index({ email: 1 }, { unique: true })

const User = mongoose.model('User', userSchema)

export { onboardingStates }
export default User
