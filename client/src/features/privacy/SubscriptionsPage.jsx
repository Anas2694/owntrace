import { useEffect, useState } from 'react'
import api from '../../services/api.js'
import PrivacyPageLayout, { EmptyState, ErrorState, LoadingState, Pagination, StatusPill } from './PrivacyPageLayout.jsx'
import { formatDate, formatEnum, formatMoney } from './privacy-format.js'

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
      description="Explainable recurring-service detections derived from minimized Gmail sender, subject, and date metadata. OwnTrace never reads message bodies."
      eyebrow="Subscriptions"
      title="Recurring services, without pretending certainty."
    >
      <p className="privacy-note">Amounts and renewal dates appear only when supported by metadata. Renewal dates are estimates, and no detection proves that a subscription is currently active. Verify billing directly with each service.</p>
      {error ? <ErrorState>{error}</ErrorState> : null}
      {!result && !error ? <LoadingState>Loading subscription signals…</LoadingState> : null}
      {result?.subscriptions.length ? (
        <section className="privacy-card" aria-labelledby="subscription-list-title">
          <div className="privacy-section-heading"><div><p>Deterministic metadata detection</p><h2 id="subscription-list-title">Services to review</h2></div><StatusPill>{result.pagination.total} total</StatusPill></div>
          <ul className="privacy-list">
            {result.subscriptions.map((subscription) => (
              <li className="privacy-list-item" key={subscription.id}>
                <div>
                  <strong>{subscription.serviceName}</strong>
                  <p>{subscription.primaryDomain} · Last evidence {formatDate(subscription.lastSeenAt)}</p>
                  <small>Basis: {subscription.basis.map(formatEnum).join(', ')}</small>
                  <dl className="privacy-subscription-facts">
                    <div><dt>Amount</dt><dd>{formatMoney(subscription.amountMinor, subscription.currency)}</dd></div>
                    <div><dt>Billing cycle</dt><dd>{formatEnum(subscription.billingCycle)}</dd></div>
                    <div><dt>Last payment</dt><dd>{formatDate(subscription.lastPaymentAt)}</dd></div>
                    <div><dt>Estimated renewal</dt><dd>{formatDate(subscription.nextRenewalAt)}</dd></div>
                  </dl>
                </div>
                <StatusPill tone={subscription.confidenceLevel === 'LIKELY' ? 'good' : 'medium'}>{formatEnum(subscription.confidenceLevel)}</StatusPill>
              </li>
            ))}
          </ul>
          <Pagination label="Subscription signal pages" onPageChange={setPage} pagination={result.pagination} />
        </section>
      ) : result ? <EmptyState title="No recurring services detected">A service appears here only when minimized metadata contains non-marketing subscription or payment evidence.</EmptyState> : null}
    </PrivacyPageLayout>
  )
}

export default SubscriptionsPage
