import PrivacyRequest from '../models/privacy-request.model.js'
import BreachReport from '../models/breach-report.model.js'

async function deleteRaphaelOwnedDataForUser(userId) {
  await Promise.all([
    BreachReport.deleteMany({ userId }),
    PrivacyRequest.deleteMany({ userId }),
  ])
}

export { deleteRaphaelOwnedDataForUser }
