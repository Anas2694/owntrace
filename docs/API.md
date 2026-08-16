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

No authentication is required for the health check. Authentication, Gmail, accounts, subscriptions, breaches, and other product APIs are intentionally outside the current foundation milestone.
