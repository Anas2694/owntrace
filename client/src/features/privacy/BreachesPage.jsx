import { useEffect, useState } from 'react'
import api from '../../services/api.js'
import PrivacyPageLayout, { EmptyState, ErrorState, LoadingState, Pagination, StatusPill } from './PrivacyPageLayout.jsx'
import { formatDate, formatEnum } from './privacy-format.js'

function BreachesPage() {
  const [page, setPage] = useState(1)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    api.get('/breaches', { params: { limit: 12, page }, signal: controller.signal })
      .then((response) => setResult(response.data))
      .catch((requestError) => {
        if (requestError.code !== 'ERR_CANCELED') setError(requestError.response?.data?.message || 'OwnTrace could not load security signals.')
      })
    return () => controller.abort()
  }, [page])

  return (
    <PrivacyPageLayout
      description="OwnTrace separates verified breach records from security-related account metadata so a password-reset or alert email is never misrepresented as proof of a breach."
      eyebrow="Breaches"
      title="No breach claim without a verified source."
    >
      {result ? <p className="privacy-note">{result.provider.message} Verified breach records: {result.breaches.length}.</p> : null}
      {error ? <ErrorState>{error}</ErrorState> : null}
      {!result && !error ? <LoadingState>Loading breach and security status…</LoadingState> : null}
      {result?.securitySignals.length ? (
        <section className="privacy-card" aria-labelledby="security-signals-title">
          <div className="privacy-section-heading"><div><p>Not verified breaches</p><h2 id="security-signals-title">Security-related signals</h2></div><StatusPill tone="medium">Review only</StatusPill></div>
          <ul className="privacy-list">
            {result.securitySignals.map((signal) => (
              <li className="privacy-list-item" key={signal.accountId}>
                <div><strong>{signal.serviceName}</strong><p>{signal.primaryDomain} · Last signal {formatDate(signal.lastSeenAt)}</p><small>Observed classes: {signal.basis.map(formatEnum).join(', ')}</small></div>
                <StatusPill tone="medium">Unverified</StatusPill>
              </li>
            ))}
          </ul>
          <Pagination label="Security signal pages" onPageChange={setPage} pagination={result.pagination} />
        </section>
      ) : result ? <EmptyState title="No security-related metadata signals">This does not prove that no breach exists; no verified breach provider is connected.</EmptyState> : null}
    </PrivacyPageLayout>
  )
}

export default BreachesPage
