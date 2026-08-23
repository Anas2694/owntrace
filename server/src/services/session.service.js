import { createHash, randomUUID } from 'node:crypto'
import { SESSION_DURATION_MS } from '../config/auth.js'
import Session from '../models/session.model.js'
import { createSessionToken, verifySessionToken } from '../utils/session.js'

function hashTokenId(tokenId) {
  return createHash('sha256').update(tokenId).digest('base64url')
}

async function issueSession(userId) {
  const tokenId = randomUUID()
  await Session.create({
    expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
    tokenIdHash: hashTokenId(tokenId),
    userId,
  })
  return createSessionToken(userId, tokenId)
}

async function verifyActiveSession(token) {
  const payload = verifySessionToken(token)
  if (typeof payload.jti !== 'string' || !payload.jti) throw new Error('Session ID is missing')
  const activeSession = await Session.exists({
    expiresAt: { $gt: new Date() },
    tokenIdHash: hashTokenId(payload.jti),
    userId: payload.sub,
  })
  if (!activeSession) throw new Error('Session has been revoked')
  return payload
}

async function revokeSession(token) {
  if (!token) return
  try {
    const payload = verifySessionToken(token)
    if (typeof payload.jti !== 'string' || !payload.jti) return
    await Session.deleteOne({
      tokenIdHash: hashTokenId(payload.jti),
      userId: payload.sub,
    })
  } catch {
    // Logout remains idempotent for expired or malformed cookies.
  }
}

export { hashTokenId, issueSession, revokeSession, verifyActiveSession }
