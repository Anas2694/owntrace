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

## User-deletion contract

`DELETE /api/auth/account` removes the authenticated user's profile, every Anas-owned record, and Raphael-owned privacy-request records through the explicit `deleteRaphaelOwnedDataForUser` service contract. Other Raphael-owned views are derived and do not create persistent collections. Feature code must continue to use an owned deletion service rather than inspecting another owner's collections ad hoc.
