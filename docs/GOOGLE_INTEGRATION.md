# Google and Gmail integration

## Implemented boundary

OwnTrace uses Google's server-side OAuth flow and requests only:

- `openid`
- `email`
- `https://www.googleapis.com/auth/gmail.metadata`

The Gmail metadata scope permits message headers and labels but not message bodies. It is nevertheless classified by Google as a restricted scope. A production public application must satisfy Google's OAuth verification requirements and, when restricted-scope data is stored or transmitted by a server, the applicable security assessment.

Official references:

- [Google OAuth 2.0 for web server applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Choose Gmail API scopes](https://developers.google.com/workspace/gmail/api/auth/scopes)
- [Gmail messages.list](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/list)
- [Gmail messages.get](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/get)
- [Google OAuth verification requirements](https://support.google.com/cloud/answer/13464321)
- [Google identity branding guidelines](https://developers.google.com/identity/branding-guidelines)

## Important provider limitations

`gmail.metadata` does not permit the `q` search parameter on `messages.list`. OwnTrace therefore cannot ask Gmail to pre-filter account-related messages using Gmail search. The initial implementation paginates safely through message IDs, retrieves selected metadata headers in 25-message batches, and enforces `GMAIL_SYNC_MESSAGE_LIMIT` (default 2,000; maximum configurable value 20,000).

The API does not prove that every discovered service represents an owned account. Later deterministic discovery treats metadata as evidence with explainable strength; marketing email alone will remain weak evidence.

## Data minimization

The sync does not request or store bodies, snippets, raw MIME, or attachments. Stored signals contain:

- HMAC-derived provider message and thread identifiers
- sender email and domain
- a normalized subject signal with email addresses and long numeric strings redacted
- the provider message date

Disconnect revokes the provider token before deleting the connection, current job, and derived signals. If Google cannot be reached, OwnTrace preserves local state and asks the user to retry so it does not falsely claim access was revoked.

## Local configuration

Create a Google Cloud OAuth client of type **Web application**, enable the Gmail API, configure the consent screen, add the restricted Gmail metadata scope, and register this development callback exactly:

`http://localhost:5000/api/google/oauth/callback`

The required environment variable names are documented in `server/.env.example`. Never commit their values.
