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
import WorkspaceIcon from './WorkspaceIcon.jsx'

function getNextStep(data) {
  if (!data.accountSummary.total) {
    return {
      description: 'Connect Gmail or Microsoft, review the requested permission, then run a metadata scan to build your first account inventory.',
      label: 'Review mail connections',
      title: 'Connect a source when you are ready',
      to: '/connect',
    }
  }

  if (data.actionSummary.open) {
    return {
      description: `${data.actionSummary.open} evidence-based ${data.actionSummary.open === 1 ? 'recommendation is' : 'recommendations are'} waiting for your review. OwnTrace will explain the reason before you act.`,
      label: 'Open privacy inbox',
      title: 'Review the next recommended action',
      to: '/privacy-inbox',
    }
  }

  return {
    description: 'Your current recommendations are clear. Review recently observed services or check for new provider metadata when it suits you.',
    label: 'Review discovered accounts',
    title: 'Keep your account inventory current',
    to: '/accounts',
  }
}

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

  const nextStep = data ? getNextStep(data) : null

  return (
    <PrivacyPageLayout
      description="See what OwnTrace has observed, what needs attention, and the clearest next step—without overstating what the evidence proves."
      eyebrow="Dashboard"
      title="Your privacy overview."
    >
      {error ? <ErrorState>{error}</ErrorState> : null}
      {!data && !error ? <LoadingState>Assembling your workspace…</LoadingState> : null}
      {data ? (
        <>
          <section className="privacy-next-step" aria-labelledby="dashboard-next-step-title">
            <div className="privacy-next-step-marker" aria-hidden="true">Next</div>
            <div>
              <p>Recommended focus</p>
              <h2 id="dashboard-next-step-title">{nextStep.title}</h2>
              <span>{nextStep.description}</span>
            </div>
            <Link className="privacy-action is-primary" to={nextStep.to}>
              {nextStep.label}
              <WorkspaceIcon className="privacy-action-icon" name="arrow" />
            </Link>
          </section>

          <div className="privacy-metric-grid" aria-label="Privacy overview">
            <Link className="privacy-metric" to="/accounts"><span><WorkspaceIcon name="accounts" />Discovered accounts</span><strong>{data.accountSummary.total}</strong><small>Review evidence</small></Link>
            <Link className="privacy-metric" to="/accounts"><span><WorkspaceIcon name="exposures" />Dormant signals</span><strong>{data.accountSummary.dormant}</strong><small>Check activity</small></Link>
            <Link className="privacy-metric" to="/subscriptions"><span><WorkspaceIcon name="subscriptions" />Subscription signals</span><strong>{data.subscriptionTotal}</strong><small>Verify billing</small></Link>
            <Link className="privacy-metric" to="/privacy-inbox"><span><WorkspaceIcon name="inbox" />Open actions</span><strong>{data.actionSummary.open}</strong><small>Choose what to do</small></Link>
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
              <div className="privacy-section-heading"><div><p>Recent evidence</p><h2 id="dashboard-accounts-title">Recently observed services</h2></div><Link to="/accounts">See accounts</Link></div>
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
              <div className="privacy-section-heading"><div><p>Identity map</p><h2 id="dashboard-identity-title">Identity relationships</h2></div><Link to="/identity">View graph</Link></div>
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
