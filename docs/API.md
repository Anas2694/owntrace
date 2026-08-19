# API

The API is served from `/api` and returns JSON.

## Health check

`GET /api/health`

Response (`200 OK`):

```json
{
  "success": true,
  "message": "OwnTrace API is running"
}
```

No authentication is required for the health check.

## Authentication

Authentication uses the `owntrace_session` httpOnly cookie. Successful registration and login responses set the cookie; clients must send requests with credentials enabled. Password hashes and JWTs are never returned in JSON.

### Register

`POST /api/auth/register`

Request:

```json
{
  "name": "Example User",
  "email": "user@example.com",
  "password": "a passphrase with at least 12 characters"
}
```

Response (`201 Created`):

```json
{
  "success": true,
  "user": {
    "id": "...",
    "name": "Example User",
    "email": "user@example.com",
    "authProviders": ["password"],
    "emailVerified": false,
    "onboardingStatus": "NOT_STARTED",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

Duplicate emails return `409 EMAIL_IN_USE`. Invalid fields return `400 VALIDATION_ERROR` with a field-keyed `errors` object.

### Login

`POST /api/auth/login`

Request:

```json
{
  "email": "user@example.com",
  "password": "a passphrase with at least 12 characters"
}
```

Returns `200 OK` with the same safe user shape as registration. Invalid credentials return `401 INVALID_CREDENTIALS` without confirming whether the email exists.

### Current session

`GET /api/auth/me`

Returns `200 OK` with `{ "success": true, "user": { ... } }` for a valid cookie session. Missing, invalid, or expired sessions return `401`.

### Session discovery

`GET /api/auth/session`

Used by the browser during startup. It returns the safe user shape for a valid session or `{ "success": true, "user": null }` when no restorable session exists. Invalid cookies are cleared. This endpoint does not grant access; protected APIs still require authentication middleware and return `401` when unauthorized.

### Logout

`POST /api/auth/logout`

Clears the session cookie and returns:

```json
{
  "success": true,
  "message": "Signed out successfully."
}
```

Account browsing, subscriptions, breaches, and other product APIs remain outside this authentication milestone.

## Onboarding

Both onboarding endpoints require a valid `owntrace_session` cookie. State changes are scoped to the authenticated user.

### Read onboarding status

`GET /api/onboarding`

Response (`200 OK`):

```json
{
  "success": true,
  "onboarding": {
    "status": "NOT_STARTED"
  }
}
```

### Advance onboarding

`PATCH /api/onboarding`

Request:

```json
{
  "status": "PRIVACY_REVIEWED"
}
```

The supported progression is `NOT_STARTED → PRIVACY_REVIEWED → GMAIL_PENDING`. Repeating the current step is idempotent. Unsupported states return `400 INVALID_ONBOARDING_STATUS`; skipping a required step returns `409 ONBOARDING_STEP_OUT_OF_ORDER`.

`GMAIL_PENDING` means the user completed the privacy explanation and is ready to begin connection setup. It does not mean Gmail access has been granted.

## Google connection

All endpoints require a valid OwnTrace session. Provider tokens and the Google account ID are never returned.

### Connection status

`GET /api/google/connection`

Returns whether Google is configured for the current environment and either `connection: null` or safe connection metadata including email, scopes, status, expiry timestamp, and sync timestamps.

### Begin OAuth

`GET /api/google/oauth/start`

Sets a short-lived httpOnly OAuth-state cookie and redirects to Google. The requested scopes are `openid`, `email`, and `https://www.googleapis.com/auth/gmail.metadata`, with offline access for refresh support.

### OAuth callback

`GET /api/google/oauth/callback`

Validates the session-bound state, exchanges the code on the server, verifies the Google ID token, encrypts provider tokens, and redirects to `/connect/gmail` with a safe result code. Raw provider errors and credentials are not placed in the URL.

### Disconnect

`DELETE /api/google/connection`

Attempts Google token revocation, then deletes the authenticated user's connection, sync state, derived Gmail signals, Gmail-derived account evidence, and accounts with no remaining evidence. A provider network failure returns `502 GOOGLE_REVOCATION_FAILED` without deleting local state so revocation can be retried.

## Gmail metadata sync

The sync is split into bounded requests. Every route is scoped to the authenticated user.

- `GET /api/google/sync` — current safe job state or `null`.
- `POST /api/google/sync` — create or restart a queued job (`202 Accepted`) when no batch is active.
- `POST /api/google/sync/next` — process the next batch of up to 25 message IDs and selected metadata headers.
- `DELETE /api/google/sync` — cancel an active job without deleting previously derived signals.

Job states are `QUEUED`, `SCANNING`, `PROCESSING`, `COMPLETED`, `FAILED`, and `CANCELLED`. Progress includes processed/stored counts and an estimated mailbox total; provider page tokens remain server-only. Repeated scans upsert by a user-scoped HMAC message identifier and do not duplicate signals. Starting another scan or advancing a second batch while one is active returns `409 GMAIL_SYNC_IN_PROGRESS` so concurrent browser tabs cannot reset or double-count progress. A stale batch lock can be reclaimed after an interrupted worker.

A completed bounded sync automatically runs deterministic account discovery. Account browsing endpoints are introduced in the separate accounts milestone.

Safe error codes include `GOOGLE_NOT_CONNECTED`, `GOOGLE_RECONNECT_REQUIRED`, `GOOGLE_RATE_LIMITED`, `GOOGLE_REQUEST_FAILED`, `GMAIL_SYNC_NOT_STARTED`, `GMAIL_SYNC_IN_PROGRESS`, `PARTIAL_METADATA_RESULTS`, and `MESSAGE_LIMIT_REACHED`.
