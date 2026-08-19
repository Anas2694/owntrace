import Subscription from '../models/subscription.model.js'

async function getDashboardData(userId) {
  const subscriptions = await Subscription
    .find({ userId })
    .sort({ nextBillingDate: 1 })
    .lean()

  const serializedSubscriptions = subscriptions.map((subscription) => ({
    ...subscription,
    id: subscription._id.toString(),
    userId: subscription.userId.toString(),
    _id: undefined,
  }))

  return {
    privacyHealth: null,
    metrics: {
      accountsFound: null,
      dormantAccounts: null,
      subscriptions: serializedSubscriptions.length,
      knownBreaches: null,
    },
    subscriptions: serializedSubscriptions,
    source: 'mongodb',
  }
}

export { getDashboardData }
