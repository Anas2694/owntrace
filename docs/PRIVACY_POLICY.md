# Privacy Policy draft

Last updated: 24 August 2026

This owner-review draft mirrors the public `/privacy-policy` page. It describes the current early-development repository and must receive legal and owner approval, a private contact channel, final hosting details, and a production backup-erasure period before public launch.

OwnTrace processes registration details, encrypted Google OAuth credentials, minimized Gmail header-derived signals, and derived product records to authenticate users and provide account, subscription, breach, exposure, and privacy-management features. It does not request or store Gmail bodies, snippets, attachments, or raw MIME content, and does not sell personal information or use Gmail-derived data for advertising.

Google data is accessed only after OAuth consent using `openid`, `email`, and `gmail.metadata`. A breach check sends the account email to XposedOrNot only after separate explicit consent and stores minimized breach names and timestamps rather than the submitted email copy or raw provider response.

Users may decline integrations, disconnect Google, or delete their OwnTrace account. Disconnect and deletion behavior is documented in `docs/GOOGLE_INTEGRATION.md` and `docs/API.md`. Production retention, backup erasure, support, jurisdiction, and policy-change procedures remain launch decisions.

Never ask users to publish personal data, credentials, provider tokens, or account details in a public GitHub issue.
