# Security and Privacy Baseline

OwnTrace may eventually process sensitive identity, email metadata, OAuth tokens, breach information, and account records. The project therefore starts with these rules:

- Never commit `.env` files, credentials, OAuth secrets, tokens, production data, or real user data.
- Keep authentication tokens out of frontend local storage; prefer secure httpOnly cookies.
- Validate inputs, minimize stored data, and request the least OAuth privilege required.
- Store derived email metadata rather than full inbox content wherever possible.
- Never log passwords, OAuth tokens, or sensitive email content.
- Configure CORS, secure cookies, rate limits, and security headers before production authentication is enabled.
- Encrypt sensitive stored credentials or tokens when those integrations are introduced.

The current foundation contains no authentication, integrations, or production credentials. Security controls will be added with the milestones that require them and reviewed before deployment.
