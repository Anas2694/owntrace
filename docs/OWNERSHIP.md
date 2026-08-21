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

`DELETE /api/auth/account` currently removes the authenticated user's profile and every Anas-owned record. When Raphael-owned persistent models are merged, their owner must add an explicit deletion hook or coordinated service contract before the product can describe deletion as covering those features. Feature code must not inspect or delete another owner's collections ad hoc.
