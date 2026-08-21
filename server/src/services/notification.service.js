import PrivacyRequest from '../models/privacy-request.model.js'
import { listAccountActions } from './account-action.service.js'
import { paginationFor, parseBoundedPagination } from '../utils/pagination.js'

async function listNotifications(userId, rawQuery = {}) {
  const { limit, page } = parseBoundedPagination(rawQuery, {
    defaultLimit: 20,
    maximumLimit: 50,
  })
  const [actionResult, privacyRequests] = await Promise.all([
    listAccountActions(userId, { limit: 100, page: 1, status: 'OPEN' }),
    PrivacyRequest.find({ status: { $in: ['READY', 'SENT'] }, userId })
      .sort({ statusUpdatedAt: -1, _id: 1 })
      .limit(100)
      .lean(),
  ])

  const actionNotifications = actionResult.actions.map((action) => ({
    createdAt: action.createdAt,
    id: `action:${action.id}`,
    kind: 'ACCOUNT_ACTION',
    message: action.reason,
    priority: action.priority,
    target: '/privacy-inbox',
    title: action.title,
  }))
  const requestNotifications = privacyRequests.map((request) => ({
    createdAt: request.statusUpdatedAt,
    id: `request:${request._id}`,
    kind: 'PRIVACY_REQUEST',
    message: request.status === 'READY'
      ? 'This draft is ready for you to send through the service’s official channel.'
      : 'This request is awaiting an outcome you record manually.',
    priority: 'MEDIUM',
    target: '/privacy-requests',
    title: `${request.serviceName} ${request.requestType.toLowerCase()} request`,
  }))
  const allNotifications = [...actionNotifications, ...requestNotifications]
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
  const total = allNotifications.length
  const start = (page - 1) * limit

  return {
    notifications: allNotifications.slice(start, start + limit),
    pagination: paginationFor({ limit, page, total }),
  }
}

export { listNotifications }
