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

Gmail, accounts, subscriptions, breaches, and other product APIs remain outside this authentication milestone.
