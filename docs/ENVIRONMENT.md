# Environment configuration

OwnTrace reads server variables from the runtime environment. Local development may use `server/.env`; production must use the hosting platform's encrypted secret store. Never place production values in a Docker image, repository file, CI command, support ticket, screenshot, or log.

| Variable | Required | Secret | Purpose and safe production rule | Rotation / owner |
| --- | --- | --- | --- | --- |
| `NODE_ENV` | Yes | No | Use `production` for a release. Other supported values are `development` and `test`. | Deployment owner |
| `PORT` | No | No | HTTP listener, default `5000`; must be `1–65535`. Managed platforms may inject it. | Hosting platform |
| `LOG_LEVEL` | No | No | `info`, `error`, or `silent`; default `info`. Logs never intentionally include request bodies, query strings, cookies, email addresses, tokens, or IP addresses. | Operations owner |
| `TRUST_PROXY` | Topology-dependent | No | `false`, a positive proxy-hop count, or Express subnet name. Production validation rejects broad `true`; use only documented platform topology so client IP rate limits cannot be spoofed. | Hosting owner |
| `SHUTDOWN_TIMEOUT_MS` | No | No | Graceful shutdown deadline, `1000–60000`; default `10000`. | Operations owner |
| `CLIENT_ORIGINS` | Yes | No | Comma-separated exact browser origins. Production entries must be HTTPS origins with no path or credentials. | Deployment owner |
| `CLIENT_APP_URL` | Yes | No | Canonical HTTPS frontend origin used after OAuth. | Deployment owner |
| `MONGO_URI` | Yes | Yes | Dedicated environment-specific MongoDB connection string with least-privilege credentials and TLS. Rotate in MongoDB and the secret store together. | Database owner |
| `JWT_SECRET` | Yes | Yes | Random value of at least 32 characters. Rotation invalidates browser sessions; perform during a communicated maintenance or security event. | Security owner |
| `BCRYPT_ROUNDS` | No | No | Password work factor, default `12`; supported application range `10–14`. Benchmark before changing. | Security owner |
| `GOOGLE_CLIENT_ID` | Production | No | OAuth web-client ID for the exact environment. | Google Cloud owner |
| `GOOGLE_CLIENT_SECRET` | Production | Yes | OAuth client secret. Rotate in Google Cloud and the secret store; never send to the browser. | Google Cloud owner |
| `GOOGLE_REDIRECT_URI` | Production | No | Exact HTTPS callback ending in `/api/google/oauth/callback`; must match Google Cloud configuration. | Google Cloud owner |
| `TOKEN_ENCRYPTION_KEY` | Production Gmail | Yes | Base64 encoding of exactly 32 random bytes for AES-256-GCM provider-token encryption. Rotation currently requires a planned reconnect of affected Google accounts. | Security owner |
| `GMAIL_SYNC_MESSAGE_LIMIT` | No | No | Maximum messages per scan, default `2000`, bounded internally. | Product/operations owner |
| `VITE_API_BASE_URL` | Separate frontend only | No | Client build-time API base. Leave unset for the recommended single-origin container. | Deployment owner |

Generate secrets locally without printing them into shared logs:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

The first output can be used for `JWT_SECRET`; the second has the required `TOKEN_ENCRYPTION_KEY` format. Store the values immediately in the intended environment secret store and clear terminal history where organizational policy requires it.
