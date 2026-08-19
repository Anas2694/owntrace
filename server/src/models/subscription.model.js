import mongoose from 'mongoose'

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    serviceName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    category: {
      type: String,
      trim: true,
      maxlength: 80,
    },
    cost: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      minlength: 3,
      maxlength: 3,
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly', 'one_time'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'dormant'],
      default: 'active',
    },
    lastUsedAt: Date,
    nextBillingDate: Date,
    source: {
      type: String,
      enum: ['gmail', 'manual', 'scan'],
      default: 'manual',
    },
  },
  { timestamps: true },
)

subscriptionSchema.index({ userId: 1, status: 1 })
subscriptionSchema.index({ userId: 1, nextBillingDate: 1 })

const Subscription = mongoose.model('Subscription', subscriptionSchema)

export default Subscription
