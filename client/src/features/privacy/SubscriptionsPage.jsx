import { useEffect, useState } from 'react'
import api from '../../services/api.js'
import PrivacyPageLayout, { EmptyState, ErrorState, LoadingState, Pagination, StatusPill } from './PrivacyPageLayout.jsx'
import { formatDate, formatEnum } from './privacy-format.js'

function SubscriptionsPage() {
  const [page, setPage] = useState(1)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    setError('')
    api.get('/subscriptions', { params: { limit: 12, page }, signal: controller.signal })
      .then((response) => setResult(response.data))
      .catch((requestError) => {
        if (requestError.code !== 'ERR_CANCELED') setError(requestError.response?.data?.message || 'OwnTrace could not load subscription signals.')
      })
    return () => controller.abort()
  }, [page])

  return (
    <PrivacyPageLayout
      description="Services with subscription or payment language in minimized Gmail metadata. OwnTrace does not read message bodies and cannot infer a price or renewal date from the stored data."
      eyebrow="Subscriptions"
      title="Subscription signals, with their limits visible."
    >
      <p className="privacy-note">These are detected signals, not confirmed active charges. Verify billing directly with each service.</p>
      {error ? <ErrorState>{error}</ErrorState> : null}
      {!result && !error ? <LoadingState>Loading subscription signals…</LoadingState> : null}
      {result?.subscriptions.length ? (
        <section className="privacy-card" aria-labelledby="subscription-list-title">
          <div className="privacy-section-heading"><div><p>Detected metadata</p><h2 id="subscription-list-title">Services to review</h2></div><StatusPill>{result.pagination.total} total</StatusPill></div>
          <ul className="privacy-list">
            {result.subscriptions.map((subscription) => (
              <li className="privacy-list-item" key={subscription.accountId}>
                <div><strong>{subscription.serviceName}</strong><p>{subscription.primaryDomain} · Last signal {formatDate(subscription.lastSeenAt)}</p><small>Basis: {subscription.basis.map(formatEnum).join(', ')}</small></div>
                <StatusPill tone="medium">Price unavailable</StatusPill>
              </li>
            ))}
          </ul>
          <Pagination label="Subscription signal pages" onPageChange={setPage} pagination={result.pagination} />
        </section>
      ) : result ? <EmptyState title="No subscription signals found">A service appears here only when minimized metadata contains subscription or payment language.</EmptyState> : null}
    </PrivacyPageLayout>
  )
}

export default SubscriptionsPage
