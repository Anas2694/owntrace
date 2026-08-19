import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell.jsx'
import api from '../../services/api.js'
import useAuth from '../auth/useAuth.js'
import Icon from '../../components/ui/Icon.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import { dashboardData } from './dashboard.data.js'
import './dashboard.css'
import './dashboard-sentry.css'

function HealthScore({ privacyHealth }) {
  const hasScore = Number.isFinite(privacyHealth)

  return (
    <section className="health-card dashboard-card" aria-labelledby="health-title">
      <div className="card-heading-row"><div><p className="section-eyebrow">Privacy health</p><h2 id="health-title">Your score</h2></div><Icon name="shield" size={22} /></div>
      <div className="health-body">
        <div className="score-ring" aria-label={hasScore ? `Privacy Health score: ${privacyHealth} out of 100` : 'Privacy Health score is not available yet'}><svg viewBox="0 0 120 120" role="img"><circle className="score-ring-track" cx="60" cy="60" r="49" /><circle className="score-ring-value" cx="60" cy="60" r="49" /></svg><strong>{hasScore ? privacyHealth : '—'}</strong><span>/100</span></div>
        <div className="health-copy"><StatusBadge tone={hasScore ? 'good' : 'neutral'}>{hasScore ? 'Good start' : 'Awaiting scan'}</StatusBadge><p>{hasScore ? 'Your privacy baseline is healthy, but a few actions could make a big difference.' : 'Privacy Health will be calculated after the first privacy scan.'}</p><Link to="/privacy-inbox" className="text-link">View recommendations <span aria-hidden="true">→</span></Link></div>
      </div>
      <div className="health-meter" aria-hidden="true"><span /></div>
      <div className="health-scale"><span>Needs attention</span><span>Strong</span></div>
    </section>
  )
}

function StatCard({ stat }) {
  return <Link className={`stat-card dashboard-card stat-card--${stat.tone}`} to={stat.label === 'Subscriptions' ? '/subscriptions' : stat.label === 'Known breaches' ? '/breaches' : '/accounts'}><div className="stat-icon"><Icon name={stat.icon} size={19} /></div><div className="stat-content"><span>{stat.label}</span><strong>{stat.value}</strong><small>{stat.detail}</small></div><span className="stat-arrow" aria-hidden="true">↗</span></Link>
}

function SubscriptionPanel({ subscriptions, isPreview }) {
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5
  const items = isPreview
    ? dashboardData.activity
    : subscriptions?.map((subscription) => ({
      title: subscription.serviceName,
      source: subscription.category || 'Subscription',
      time: subscription.status,
      tone: subscription.status === 'dormant' ? 'medium' : 'lime',
      icon: 'subscription',
    })) || []
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const pageStart = (currentPage - 1) * pageSize
  const pageItems = items.slice(pageStart, pageStart + pageSize)

  useEffect(() => {
    setCurrentPage(1)
  }, [isPreview, subscriptions?.length])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const firstVisibleItem = items.length ? pageStart + 1 : 0
  const lastVisibleItem = Math.min(pageStart + pageItems.length, items.length)

  return <section className="dashboard-card activity-card" aria-labelledby="subscriptions-panel-title"><div className="card-heading-row"><div><p className="section-eyebrow">{isPreview ? 'Preview data' : 'Connected data'}</p><h2 id="subscriptions-panel-title">{isPreview ? 'Recent activity' : 'Your subscriptions'}</h2></div><Link to="/subscriptions" className="card-link">See all <span aria-hidden="true">→</span></Link></div>{items.length ? <><div className="activity-list">{pageItems.map((item) => <div className="activity-item" key={`${item.title}-${item.source}`}><div className={`activity-icon activity-icon--${item.tone}`}><Icon name={item.icon} size={17} /></div><div className="activity-copy"><strong>{item.title}</strong><span>{item.source}</span></div><time>{item.time}</time></div>)}</div>{totalPages > 1 ? <div className="pagination-controls" aria-label="Subscription pagination"><span>Showing {firstVisibleItem}–{lastVisibleItem} of {items.length}</span><div className="pagination-buttons"><button type="button" onClick={() => setCurrentPage((page) => page - 1)} disabled={currentPage === 1} aria-label="Previous subscriptions">Previous</button><span aria-live="polite">Page {currentPage} of {totalPages}</span><button type="button" onClick={() => setCurrentPage((page) => page + 1)} disabled={currentPage === totalPages} aria-label="Next subscriptions">Next</button></div></div> : null}</> : <p className="dashboard-empty-state">Your subscriptions will appear here once they are connected.</p>}</section>
}

function FootprintTrend({ isPreview }) {
  if (!isPreview) return <section className="dashboard-card footprint-card" aria-labelledby="footprint-title"><div className="card-heading-row"><div><p className="section-eyebrow">Digital footprint</p><h2 id="footprint-title">Growing with context</h2></div><StatusBadge tone="neutral">Awaiting scan</StatusBadge></div><p className="dashboard-empty-state">Your footprint trend will appear after account-discovery data is connected.</p></section>

  return <section className="dashboard-card footprint-card" aria-labelledby="footprint-title"><div className="card-heading-row"><div><p className="section-eyebrow">Digital footprint</p><h2 id="footprint-title">Growing with context</h2></div><StatusBadge tone="neutral">Last 6 months</StatusBadge></div><div className="trend-summary"><strong>+28</strong><span>new signals found</span></div><div className="trend-chart"><svg viewBox="0 0 620 170" preserveAspectRatio="none" role="img" aria-label="Digital footprint trend rising over the last six months"><defs><linearGradient id="trend-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--ot-accent-violet)" stopOpacity=".28" /><stop offset="100%" stopColor="var(--ot-accent-violet)" stopOpacity="0" /></linearGradient></defs><path className="trend-area" d="M0 150 C55 143 70 135 112 139 S180 110 220 120 S280 104 324 100 S390 76 430 83 S510 45 552 54 S595 23 620 28 V170 H0 Z" /><path className="trend-line" d="M0 150 C55 143 70 135 112 139 S180 110 220 120 S280 104 324 100 S390 76 430 83 S510 45 552 54 S595 23 620 28" /></svg><div className="chart-labels"><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span></div></div></section>
}

function ActionList({ isPreview }) {
  const [expanded, setExpanded] = useState(false)
  if (!isPreview) return <section className="dashboard-card actions-card" aria-labelledby="actions-title"><div className="card-heading-row"><div><p className="section-eyebrow">Privacy inbox</p><h2 id="actions-title">Recommended actions</h2></div><StatusBadge tone="neutral">Awaiting scan</StatusBadge></div><p className="dashboard-empty-state">Recommendations will appear when connected privacy data is available.</p></section>

  const actions = expanded ? dashboardData.actions : dashboardData.actions.slice(0, 2)
  return <section className="dashboard-card actions-card" aria-labelledby="actions-title"><div className="card-heading-row"><div><p className="section-eyebrow">Privacy inbox</p><h2 id="actions-title">Recommended actions <span className="count-badge">9</span></h2></div><Link to="/privacy-inbox" className="card-link">Open inbox <span aria-hidden="true">→</span></Link></div><div className="action-list">{actions.map((item) => <article className="action-item" key={item.title}><div className={`priority-dot priority-dot--${item.tone}`} aria-hidden="true" /><div className="action-copy"><div className="action-title-row"><StatusBadge tone={item.tone}>{item.tone}</StatusBadge><strong>{item.title}</strong></div><p>{item.description}</p></div><button type="button" className="action-button">{item.action} <span aria-hidden="true">→</span></button></article>)}</div><button type="button" className="show-more" onClick={() => setExpanded((value) => !value)}>{expanded ? 'Show fewer actions' : 'Show all 9 actions'} <span aria-hidden="true">{expanded ? '↑' : '↓'}</span></button></section>
}

function DashboardPage({ previewUser = null, variant = 'sentry' }) {
  const { user: sessionUser } = useAuth()
  const [dashboard, setDashboard] = useState(null)
  const [dashboardError, setDashboardError] = useState('')
  const user = previewUser || sessionUser
  const isPreview = Boolean(previewUser)

  useEffect(() => {
    if (isPreview || !sessionUser) return

    let isCurrent = true
    api.get('/dashboard')
      .then((response) => {
        if (isCurrent) setDashboard(response.data.dashboard)
      })
      .catch(() => {
        if (isCurrent) setDashboardError('We could not load your dashboard data.')
      })

    return () => { isCurrent = false }
  }, [isPreview, sessionUser])

  const stats = isPreview ? dashboardData.stats : [
    { label: 'Accounts found', value: dashboard?.metrics.accountsFound ?? '—', detail: 'Available after account scan', tone: 'violet', icon: 'user' },
    { label: 'Dormant accounts', value: dashboard?.metrics.dormantAccounts ?? '—', detail: 'Available after activity scan', tone: 'pink', icon: 'lock' },
    { label: 'Subscriptions', value: dashboard?.metrics.subscriptions ?? '—', detail: 'Tracked services', tone: 'lime', icon: 'subscription' },
    { label: 'Known breaches', value: dashboard?.metrics.knownBreaches ?? '—', detail: 'Available after breach scan', tone: 'danger', icon: 'breach' },
  ]

  return <AppShell user={user} variant={variant}><div className="dashboard-heading"><div><p className="section-eyebrow">Tuesday, August 18, 2026</p><h1>Good afternoon, {user?.name?.split(' ')[0] || 'Megh'}.</h1><p className="dashboard-subtitle">Here’s the latest view of your digital identity.</p></div><button className="primary-button" type="button"><Icon name="spark" size={17} /> Scan for updates</button></div>{dashboardError ? <p className="dashboard-inline-error" role="alert">{dashboardError}</p> : null}<div className="stats-grid">{stats.map((stat) => <StatCard key={stat.label} stat={stat} />)}</div><div className="dashboard-grid dashboard-grid--top"><HealthScore privacyHealth={isPreview ? 68 : dashboard?.privacyHealth} /><FootprintTrend isPreview={isPreview} /></div><div className="dashboard-grid dashboard-grid--bottom"><ActionList isPreview={isPreview} /><SubscriptionPanel isPreview={isPreview} subscriptions={dashboard?.subscriptions} /></div></AppShell>
}

export default DashboardPage
