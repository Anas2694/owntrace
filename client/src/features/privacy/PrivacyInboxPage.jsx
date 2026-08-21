import { useCallback, useEffect, useState } from 'react'
import api from '../../services/api.js'
import PrivacyPageLayout, { EmptyState, ErrorState, LoadingState, Pagination, StatusPill } from './PrivacyPageLayout.jsx'
import { formatEnum } from './privacy-format.js'

function PrivacyInboxPage() {
  const [page, setPage] = useState(1)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const loadInbox = useCallback((signal) => {
    setError('')
    return api.get('/account-actions', { params: { limit: 12, page, status: 'OPEN' }, signal })
      .then((response) => setResult(response.data))
      .catch((requestError) => {
        if (requestError.code !== 'ERR_CANCELED') setError(requestError.response?.data?.message || 'OwnTrace could not load the Privacy Inbox.')
      })
  }, [page])

  useEffect(() => {
    const controller = new AbortController()
    loadInbox(controller.signal)
    return () => controller.abort()
  }, [loadInbox, refreshKey])

  async function updateStatus(actionId, status) {
    setBusyId(actionId)
    setError('')
    try {
      await api.patch(`/account-actions/${actionId}`, { status })
      setRefreshKey((value) => value + 1)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'OwnTrace could not update this action.')
    } finally {
      setBusyId('')
    }
  }

  return (
    <PrivacyPageLayout
      description="A global workspace view over the real account-action API. Every recommendation is derived from minimized OwnTrace account evidence and remains scoped to your user."
      eyebrow="Privacy Inbox"
      title="Turn account evidence into clear next steps."
    >
      <p className="privacy-note">OwnTrace does not perform third-party account changes. Complete each step through the service’s official settings, then record your progress here.</p>
      {error ? <ErrorState>{error}</ErrorState> : null}
      {!result && !error ? <LoadingState>Preparing your Privacy Inbox…</LoadingState> : null}
      {result?.actions.length ? (
        <section className="privacy-card" aria-labelledby="privacy-inbox-list-title">
          <div className="privacy-section-heading"><div><p>Open recommendations</p><h2 id="privacy-inbox-list-title">Actions to review</h2></div><StatusPill>{result.pagination.total} open</StatusPill></div>
          <ul className="privacy-list">
            {result.actions.map((action) => (
              <li className="privacy-list-item" key={action.id}>
                <div><strong>{action.title}</strong><p>{action.description}</p><small>{action.account?.serviceName || 'Account evidence'} · {action.reason}</small></div>
                <div className="privacy-actions">
                  <StatusPill tone={action.priority.toLowerCase()}>{formatEnum(action.priority)}</StatusPill>
                  <button className="privacy-action is-primary" disabled={busyId === action.id} onClick={() => updateStatus(action.id, 'IN_PROGRESS')} type="button">Start</button>
                  <button className="privacy-action" disabled={busyId === action.id} onClick={() => updateStatus(action.id, 'COMPLETED')} type="button">Complete</button>
                  <button className="privacy-action" disabled={busyId === action.id} onClick={() => updateStatus(action.id, 'DISMISSED')} type="button">Dismiss</button>
                </div>
              </li>
            ))}
          </ul>
          <Pagination label="Privacy Inbox pages" onPageChange={setPage} pagination={result.pagination} />
        </section>
      ) : result ? <EmptyState title="No open privacy actions">Current account evidence does not produce an open recommendation.</EmptyState> : null}
    </PrivacyPageLayout>
  )
}

export default PrivacyInboxPage
