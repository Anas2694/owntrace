# Dashboard Backend Engineering Notes

> Internal working notes. This document records implementation decisions, assumptions, pending dependencies, and the reasons behind small backend choices. It is not product-facing documentation.

## Current domain decision

For the current OwnTrace dashboard, a subscription is a billing/service record for a user. One user can have many subscription records.

“Accounts found” is a separate metric reserved for connected email/account-discovery data. A subscription must not be counted as a discovered account.

## Important pending dependency: email activity API

The dormant-account calculation is intentionally not implemented yet.

The intended meaning is:

- An account is a discovered service/subscription record.
- An account becomes dormant when the related email activity has not been seen for a configured period.
- The last-seen signal is expected to come from the email-related API being implemented by the other contributor.

Until that API exists, we must not invent `lastSeenAt` values or label subscriptions dormant based only on assumptions. The backend should keep the relevant dashboard values unavailable or return an empty state rather than present fabricated security information.

Known breaches are also intentionally left unavailable until a breach data source and model are implemented.

## Implemented changes

### Subscription model

File: `server/src/models/subscription.model.js`

Added a Mongoose `Subscription` model with:

- `userId`: reference to the owning `User._id`.
- `serviceName`: discovered service name.
- `category`: optional service category.
- `cost`, `currency`, and `billingCycle`: billing information.
- `status`: `active`, `cancelled`, or `dormant`.
- `lastUsedAt` and `nextBillingDate`: lifecycle dates. `lastUsedAt` must not be treated as email activity until the email API defines that mapping.
- `source`: `gmail`, `manual`, or `scan`.
- Automatic `createdAt` and `updatedAt` timestamps.

### User relationship

Subscriptions are stored as separate documents rather than embedded inside the user document:

```text
User._id
  ├── Subscription.userId
  ├── Subscription.userId
  └── Subscription.userId
```

Reason: this is a one-to-many relationship and subscription records can grow, change, and be queried independently. The authenticated `request.auth.userId` is the only user ID that should be used for dashboard queries; a user ID supplied by the frontend must not be trusted.

### Indexes

The subscription model currently includes:

```js
{ userId: 1, status: 1 }
{ userId: 1, nextBillingDate: 1 }
```

These support the expected reads:

- Find one user’s active or dormant records.
- Find one user’s records ordered by upcoming billing date.

They are performance structures, not ownership or validation rules. The `userId` field itself also currently declares `index: true`; this single-field index may be redundant because both compound indexes begin with `userId`. Revisit that duplication when indexes are reviewed against actual query plans.

### Dashboard API

Files:

- `server/src/routes/dashboard.routes.js`
- `server/src/controllers/dashboard.controller.js`
- `server/src/services/dashboard.service.js`
- `server/src/app.js`

Current endpoint:

```text
GET /api/dashboard
```

Request flow:

```text
GET /api/dashboard
  → requireAuth middleware
  → dashboard controller
  → dashboard service
  → Subscription.find({ userId })
  → JSON response
```

The service currently reads the authenticated user’s subscriptions from MongoDB, sorts them by `nextBillingDate`, serializes their IDs, and returns the subscription count. `accountsFound` remains unavailable until account-discovery data exists. Values requiring data that does not exist yet are not treated as real metrics.

## Why the controller/service split exists

- Routes define the HTTP endpoint and middleware order.
- Controllers translate an HTTP request into an HTTP response.
- Services contain database queries and dashboard business logic.
- Models define MongoDB document shape, validation, and indexes.

Keeping the query in `dashboard.service.js` makes it reusable from future dashboard endpoints, tests, jobs, or scans without coupling those operations to Express request/response objects.

## Pending implementation work

1. Confirm the email API contract and the meaning of “last seen.”
2. Decide and document the dormancy threshold, for example 90 days, before implementing the calculation.
3. Add a stable mapping from email activity to a subscription/account record.
4. Add an `Account` model only if the domain requires a separate entity from `Subscription`; do not create duplicate models without a clear distinction.
5. Add breach model/source and calculate `knownBreaches`.
6. Define and document the privacy-health scoring formula before returning a score.
7. Add seed data and tests for multiple subscriptions belonging to one user.
8. Connect the React dashboard to `GET /api/dashboard` and handle loading, empty, unavailable, and error states.

## Data integrity rules

- Every subscription must have a valid `userId`.
- Every dashboard query must scope records to `request.auth.userId`.
- Empty data is valid for a new user.
- Unavailable signals must not be represented as fabricated counts or scores.
- A frontend-provided `userId` must never override the authenticated user ID.
