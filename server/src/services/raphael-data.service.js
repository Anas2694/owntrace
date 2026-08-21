import PrivacyRequest from '../models/privacy-request.model.js'

async function deleteRaphaelOwnedDataForUser(userId) {
  await PrivacyRequest.deleteMany({ userId })
}

export { deleteRaphaelOwnedDataForUser }
