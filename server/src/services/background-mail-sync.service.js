import GmailSyncJob from '../models/gmail-sync-job.model.js'
import MicrosoftSyncJob from '../models/microsoft-sync-job.model.js'
import { logEvent } from '../utils/logger.js'
import { processNextBatch as processGmailBatch } from './gmail-sync.service.js'
import { processNextBatch as processMicrosoftBatch } from './microsoft-sync.service.js'
import { BATCH_LOCK_TIMEOUT_MS } from './mail-sync-policy.js'

const providers = [
  { model: GmailSyncJob, processBatch: processGmailBatch },
  { model: MicrosoftSyncJob, processBatch: processMicrosoftBatch },
]

// Run inside the single API process so disconnect can drain its active batches.
// MongoDB stores the cursor and claim, including when this process restarts.
export function startBackgroundMailSync({ intervalMs = 1000 } = {}) {
  let current
  let stopped = false
  async function tick() {
    for (const { model, processBatch } of providers) {
      if (stopped) return
      const now = Date.now()
      const job = await model.findOne({
        background: true,
        $or: [
          { status: 'QUEUED', nextAttemptAt: null },
          { status: 'QUEUED', nextAttemptAt: { $lte: new Date(now) } },
          { status: { $in: ['SCANNING', 'PROCESSING'] }, updatedAt: { $lt: new Date(now - BATCH_LOCK_TIMEOUT_MS) } },
        ],
      }).sort({ updatedAt: 1, _id: 1 }).select('userId +runId').lean()
      if (!job || stopped) continue
      try {
        await processBatch(job.userId, { expectedRunId: job.runId, background: true })
      } catch (error) {
        if (!['GMAIL_SYNC_IN_PROGRESS', 'MICROSOFT_SYNC_IN_PROGRESS'].includes(error.code)) {
          logEvent('warn', 'mail_background_batch_failed', { errorName: error.name })
        }
      }
    }
  }

  const schedule = () => {
    if (current || stopped) return
    current = tick()
      .catch((error) => logEvent('warn', 'mail_background_poll_failed', { errorName: error.name }))
      .finally(() => { current = undefined })
  }
  const timer = setInterval(schedule, intervalMs)
  timer.unref()
  schedule()
  return async () => {
    stopped = true
    clearInterval(timer)
    await current
  }
}
