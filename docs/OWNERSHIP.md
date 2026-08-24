# Feature Ownership

Ownership follows the feature end to end, including its frontend, backend, data model, and APIs. Shared consumers use the owning feature's API rather than duplicating its logic.

## Anas (`Anas2694`)

- Landing
- Authentication
- Onboarding
- Gmail integration
- Accounts and account discovery
- Identity graph
- Account cleanup
- Google integration
- Browser extension later
- Data-broker infrastructure later

## Raphael (`RaphaelBlaster`)

- Dashboard
- Subscriptions
- Breaches
- Exposures
- Risk engine
- Privacy inbox
- Privacy requests
- Notifications
- Microsoft integration later
- Mobile later

Cross-feature changes should be agreed in pull requests before implementation.

Microsoft metadata currently contributes to Raphael-owned subscription projections and dashboard totals. Provider-neutral account discovery, identity graph, and account-action evidence remain Anas-owned shared-platform work and require an agreed contract before Microsoft signals feed those APIs.

## User-deletion contract

`DELETE /api/auth/account` removes the authenticated user's profile, every Anas-owned record (including active server-side sessions), and Raphael-owned privacy-request, subscription, breach-report, and Microsoft subscription records through the explicit `deleteRaphaelOwnedDataForUser` service contract. Microsoft connection, job, and minimized-signal records are removed in the account-deletion workflow. Gmail and Microsoft disconnect remove their own user-scoped subscriptions before deleting minimized source signals. Feature code must continue to use owned deletion services rather than inspecting another owner's collections ad hoc.
