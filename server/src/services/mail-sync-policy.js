export const BATCH_LOCK_TIMEOUT_MS = 5 * 60 * 1000

const publicationByUser = new Map()

// Within the single API process, finish publishing a user's scan before a
// cancellation or provider cleanup changes the records it is publishing.
export async function withMailPublication(userId, operation) {
  const key = String(userId)
  const previous = publicationByUser.get(key)
  const current = Promise.resolve(previous).catch(() => {}).then(operation)
  publicationByUser.set(key, current)
  try {
    return await current
  } finally {
    if (publicationByUser.get(key) === current) publicationByUser.delete(key)
  }
}

export function backgroundMailSyncEnabled() {
  return process.env.MAIL_BACKGROUND_SYNC === 'true'
}

export function retryBatchUpdate(job, error, background) {
  const transient = [429, 502, 503, 504].includes(error.statusCode)
  const attempts = job.retryCount ?? 0
  if (!background || !transient || attempts >= 3) return null
  const retryCount = attempts + 1
  return {
    leaseId: null,
    nextAttemptAt: new Date(Date.now() + 15_000 * 2 ** (retryCount - 1)),
    retryCount,
    status: 'QUEUED',
  }
}
