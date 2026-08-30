import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api.js'
import PrivacyPageLayout, {
  EmptyState,
  ErrorState,
  LoadingState,
  StatusPill,
} from './PrivacyPageLayout.jsx'
import { formatDate, formatEnum } from './privacy-format.js'

function DashboardPage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const options = { signal: controller.signal }

    Promise.all([
      api.get('/accounts/summary', options),
      api.get('/accounts', { ...options, params: { limit: 5, page: 1 } }),
      api.get('/account-actions/summary', options),
      api.get('/account-actions', { ...options, params: { limit: 5, page: 1, status: 'OPEN' } }),
      api.get('/identity', options),
      api.get('/subscriptions', { ...options, params: { limit: 5, page: 1 } }),
      api.get('/privacy-health', options),
      api.get('/notifications', { ...options, params: { limit: 5, page: 1 } }),
    ]).then(([accountSummary, accounts, actionSummary, actions, identity, subscriptions, health, notifications]) => {
      setData({
        accountSummary: accountSummary.data.summary,
        accounts: accounts.data.accounts,
        actionSummary: actionSummary.data.summary,
        actions: actions.data.actions,
        health: health.data.health,
        identity: identity.data.graph,
        notifications: notifications.data.notifications,
        subscriptionTotal: subscriptions.data.pagination.total,
      })
    }).catch((requestError) => {
      if (requestError.code !== 'ERR_CANCELED') {
        setError(requestError.response?.data?.message || 'OwnTrace could not load your dashboard.')
      }
    })

    return () => controller.abort()
  }, [])

  return (
    <PrivacyPageLayout
      description="A current, evidence-based view assembled from your real OwnTrace account, identity, recommendation, subscription-signal, and notification APIs."
      eyebrow="Dashboard"
      title="Your digital footprint, without invented certainty."
    >
      {error ? <ErrorState>{error}</ErrorState> : null}
      {!data && !error ? <LoadingState>Assembling your workspace…</LoadingState> : null}
      {data ? (
        <>
          <div className="privacy-metric-grid" aria-label="Privacy overview">
            <Link className="privacy-metric" to="/accounts"><span>Discovered accounts</span><strong>{data.accountSummary.total}</strong></Link>
            <Link className="privacy-metric" to="/accounts"><span>Dormant signals</span><strong>{data.accountSummary.dormant}</strong></Link>
            <Link className="privacy-metric" to="/subscriptions"><span>Subscription signals</span><strong>{data.subscriptionTotal}</strong></Link>
            <Link className="privacy-metric" to="/privacy-inbox"><span>Open privacy actions</span><strong>{data.actionSummary.open}</strong></Link>
          </div>

          <div className="privacy-grid">
            <section className="privacy-card is-narrow" aria-labelledby="dashboard-health-title">
              <p className="privacy-card-label">Privacy Health</p>
              <h2 id="dashboard-health-title">Current estimate</h2>
              <div className="privacy-score" aria-label={data.health.score === null ? 'Privacy Health is not available yet' : `Privacy Health ${data.health.score} out of 100`}>
                {data.health.score ?? '—'}
              </div>
              <p>{data.health.summary}</p>
              <Link className="privacy-action" to="/privacy-health">Review factors</Link>
            </section>

            <section className="privacy-card is-wide" aria-labelledby="dashboard-actions-title">
              <div className="privacy-section-heading"><div><p>Privacy Inbox</p><h2 id="dashboard-actions-title">Recommended next steps</h2></div><Link to="/privacy-inbox">Open inbox</Link></div>
              {data.actions.length ? (
                <ul className="privacy-list">
                  {data.actions.map((action) => (
                    <li className="privacy-list-item" key={action.id}>
                      <div><strong>{action.title}</strong><p>{action.reason}</p></div>
                      <StatusPill tone={action.priority.toLowerCase()}>{formatEnum(action.priority)}</StatusPill>
                    </li>
                  ))}
                </ul>
              ) : <EmptyState title="No open recommendations">Current account evidence does not produce an open action.</EmptyState>}
            </section>

            <section className="privacy-card is-half" aria-labelledby="dashboard-accounts-title">
              <div className="privacy-section-heading"><div><p>Accounts API</p><h2 id="dashboard-accounts-title">Recently observed services</h2></div><Link to="/accounts">See accounts</Link></div>
              {data.accounts.length ? (
                <ul className="privacy-list">
                  {data.accounts.map((account) => (
                    <li className="privacy-list-item" key={account.id}>
                      <div><strong>{account.serviceName}</strong><p>{account.primaryDomain} · Last signal {formatDate(account.lastSeenAt)}</p></div>
                      <StatusPill>{formatEnum(account.confidenceLevel)}</StatusPill>
                    </li>
                  ))}
                </ul>
              ) : <EmptyState title="No discovered accounts">Connect a supported mail source and complete a metadata scan to begin.</EmptyState>}
            </section>

            <section className="privacy-card is-half" aria-labelledby="dashboard-identity-title">
              <div className="privacy-section-heading"><div><p>Identity API</p><h2 id="dashboard-identity-title">Identity relationships</h2></div><Link to="/identity">View graph</Link></div>
              <p>{data.identity.summary.accountCount} account relationships and {data.identity.summary.serviceCount} service relationships are represented in your current graph.</p>
              {data.identity.summary.truncated ? <p className="privacy-note">The visual graph is capped; the Accounts page remains the complete inventory.</p> : null}
              <Link className="privacy-action is-primary" to="/connect">Review mail connections</Link>
            </section>

            <section className="privacy-card is-full" aria-labelledby="dashboard-notifications-title">
              <div className="privacy-section-heading"><div><p>Notifications</p><h2 id="dashboard-notifications-title">Items needing attention</h2></div><Link to="/notifications">See all</Link></div>
              {data.notifications.length ? (
                <ul className="privacy-list">
                  {data.notifications.map((notification) => (
                    <li className="privacy-list-item" key={notification.id}>
                      <div><strong>{notification.title}</strong><p>{notification.message}</p></div>
                      <StatusPill tone={notification.priority.toLowerCase()}>{formatEnum(notification.kind)}</StatusPill>
                    </li>
                  ))}
                </ul>
              ) : <EmptyState title="Nothing needs attention">OwnTrace has no current account-action or privacy-request notification.</EmptyState>}
            </section>
          </div>
        </>
      ) : null}
    </PrivacyPageLayout>
  )
}

export default DashboardPage
