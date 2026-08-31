import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../../services/api.js'
import useAuth from '../auth/useAuth.js'
import PrivacyWorkspace from '../privacy/PrivacyWorkspace.jsx'
import '../google/google-connection.css'

const callbackMessages = {
  connected: 'Microsoft connected successfully. OwnTrace can now prepare a metadata-only scan.',
  denied: 'Microsoft access was not granted. Nothing was connected.',
  invalid_callback: 'Microsoft returned an incomplete connection response. Please try again.',
  invalid_oauth_state: 'The connection request expired or could not be verified. Please try again.',
  oauth_user_mismatch: 'The Microsoft response did not match this OwnTrace session.',
  microsoft_refresh_token_missing: 'Microsoft did not provide offline access. Reconnect and approve consent again.',
  microsoft_scope_missing: 'Basic mail metadata access was not granted. OwnTrace left the account disconnected.',
  connection_failed: 'Microsoft connection could not be completed. Please try again.',
}

const syncNotes = {
  MESSAGE_LIMIT_REACHED: 'The configured message limit was reached. Saved clues remain available, and a later scan can check newer messages.',
}

function getSyncTitle(sync, isSyncing) {
  if (isSyncing) return 'Scanning Microsoft metadata…'
  if (!sync) return 'Ready to scan'
  if (sync.status === 'COMPLETED') return sync.lastErrorCode === 'MESSAGE_LIMIT_REACHED'
    ? 'Scan completed at the configured limit'
    : 'Scan completed'
  if (sync.status === 'CANCELLED') return 'Scan cancelled'
  if (sync.status === 'FAILED') return 'Scan needs attention'
  return 'Scan paused and ready to continue'
}

function formatDate(value) {
  return value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Not yet'
}

function MicrosoftMark() {
  return <span className="google-mark" aria-hidden="true" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}><i style={{ background: '#f35325' }} /><i style={{ background: '#81bc06' }} /><i style={{ background: '#05a6f0' }} /><i style={{ background: '#ffba08' }} /></span>
}

function MicrosoftConnectionPage() {
  const { restoreSession } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const titleRef = useRef(null)
  const stopSyncRef = useRef(false)
  const [callbackStatus] = useState(() => searchParams.get('microsoft'))
  const [microsoftState, setMicrosoftState] = useState({ available: false, connection: null, syncPolicy: { batchSize: 25, messageLimit: null } })
  const [sync, setSync] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState('')
  const activeSync = ['QUEUED', 'SCANNING', 'PROCESSING'].includes(sync?.status)

  useEffect(() => {
    if (!searchParams.has('microsoft')) return
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.delete('microsoft')
    setSearchParams(nextSearchParams, { replace: true })
  }, [searchParams, setSearchParams])

  async function loadConnection() {
    setIsLoading(true)
    setError('')
    try {
      const [connectionResult, syncResult] = await Promise.allSettled([api.get('/microsoft/connection'), api.get('/microsoft/sync')])
      if (connectionResult.status === 'fulfilled') setMicrosoftState(connectionResult.value.data.microsoft)
      if (syncResult.status === 'fulfilled') setSync(syncResult.value.data.sync)
      const failedResult = connectionResult.status === 'rejected' ? connectionResult : syncResult.status === 'rejected' ? syncResult : null
      if (failedResult) setError(failedResult.reason.response?.data?.message || 'OwnTrace could not load all Microsoft connection details. Try again.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'OwnTrace could not load the Microsoft connection. Try again.')
    } finally { setIsLoading(false) }
  }

  useEffect(() => { titleRef.current?.focus(); loadConnection() }, [])

  useEffect(() => {
    if (!activeSync || isSyncing) return undefined
    const timer = window.setInterval(() => { loadConnection() }, 2500)
    return () => window.clearInterval(timer)
  }, [activeSync, isSyncing])

  async function handleDisconnect() {
    stopSyncRef.current = true
    setIsDisconnecting(true)
    setError('')
    try { await api.delete('/microsoft/connection'); setMicrosoftState({ available: true, connection: null }); setSync(null); await restoreSession({ showLoading: false }) }
    catch (requestError) { setError(requestError.response?.data?.message || 'OwnTrace could not disconnect Microsoft. Try again.') }
    finally { setIsDisconnecting(false); await loadConnection() }
  }

  async function runSyncBatches(initialSync) {
    let currentSync = initialSync
    stopSyncRef.current = false
    setIsSyncing(true)
    setError('')
    try {
      while (currentSync?.status === 'QUEUED' && !stopSyncRef.current) {
        const response = await api.post('/microsoft/sync/next')
        currentSync = response.data.sync
        setSync(currentSync)
      }
      await loadConnection()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'OwnTrace could not continue the metadata scan. Your saved progress is preserved.')
      await loadConnection()
    } finally { setIsSyncing(false) }
  }

  async function handleStartSync() {
    setIsSyncing(true)
    setError('')
    try { const response = await api.post('/microsoft/sync'); setSync(response.data.sync); await runSyncBatches(response.data.sync) }
    catch (requestError) { setError(requestError.response?.data?.message || 'OwnTrace could not start the metadata scan. Try again.'); setIsSyncing(false) }
  }

  async function handleCancelSync() {
    stopSyncRef.current = true
    try { const response = await api.delete('/microsoft/sync'); setSync(response.data.sync); await loadConnection() }
    catch (requestError) { setError(requestError.response?.data?.message || 'OwnTrace could not cancel the scan. Try again.') }
  }

  const connection = microsoftState.connection
  const isConnected = Boolean(connection)

  return <PrivacyWorkspace title="Microsoft connection"><main className="google-page"><div className="google-shell">
    <section className="google-intro" aria-labelledby="microsoft-title"><p className="google-eyebrow">Microsoft connection</p><h1 ref={titleRef} id="microsoft-title" tabIndex="-1">Connect Microsoft with clear boundaries.</h1><p>OwnTrace requests basic mail metadata for account discovery—not permission to read message bodies, send, modify, or delete mail.</p></section>
    {callbackStatus && callbackMessages[callbackStatus] ? <p className={`google-notice ${callbackStatus === 'connected' ? 'is-success' : ''}`} role="status">{callbackMessages[callbackStatus]}</p> : null}
    {error ? <p className="google-notice" role="alert">{error}</p> : null}
    <section className="google-connection-card" aria-labelledby="connection-title" aria-busy={isLoading}>
      <div><p className="google-card-kicker">Connection status</p><h2 id="connection-title">{isLoading ? 'Checking connection…' : isConnected ? connection.status.replace('_', ' ') : 'Not connected'}</h2><p>{isConnected ? `Connected as ${connection.email}. Tokens remain encrypted on the server.` : 'No Microsoft account or basic mail metadata permission is currently linked to this OwnTrace account.'}</p></div>
      {isConnected ? <dl className="google-connection-details"><div><dt>Connected</dt><dd>{formatDate(connection.connectedAt)}</dd></div><div><dt>Last metadata sync</dt><dd>{formatDate(connection.lastSyncAt)}</dd></div><div><dt>Mail access</dt><dd>Metadata only</dd></div></dl> : null}
      <div className="google-actions">{isConnected ? <><a className="google-provider-action" href="/api/microsoft/oauth/start"><MicrosoftMark />Continue with Microsoft</a><button type="button" onClick={handleDisconnect} disabled={isDisconnecting}>{isDisconnecting ? 'Disconnecting…' : 'Disconnect Microsoft'}</button></> : microsoftState.available ? <a className="google-provider-action" href="/api/microsoft/oauth/start"><MicrosoftMark />Continue with Microsoft</a> : <button type="button" disabled>Microsoft connection unavailable</button>}</div>
      {!isConnected && !isLoading && !microsoftState.available ? <p className="google-configuration-note">Microsoft OAuth has not been configured for this environment. No access can be requested yet.</p> : null}
    </section>
    {isConnected ? <section className="google-sync-card" aria-labelledby="sync-title" aria-busy={isSyncing}><div><p className="google-card-kicker">Metadata scan</p><h2 id="sync-title" aria-live="polite">{getSyncTitle(sync, isSyncing)}</h2><p>OwnTrace checks up to {microsoftState.syncPolicy?.messageLimit?.toLocaleString() || 'the configured limit'} Inbox metadata records per scan, {microsoftState.syncPolicy?.batchSize || 25} at a time, and can finish sooner when no more results remain. It safely deduplicates messages already seen. A saved clue represents one message—not one discovered account.</p></div><dl><div><dt>Email metadata checked</dt><dd>{sync?.processedCount ?? 0}</dd></div><div><dt>New clues saved</dt><dd>{sync?.storedCount ?? 0}</dd></div></dl>{sync?.lastErrorCode ? <p className="google-configuration-note">{syncNotes[sync.lastErrorCode] || 'The scan finished with a provider note. Your saved progress is safe.'}</p> : null}<div className="google-actions google-sync-actions">{sync?.status === 'COMPLETED' ? <Link className="google-primary-action" to="/dashboard">View dashboard</Link> : null}{sync?.status === 'QUEUED' && !isSyncing ? <button className="google-primary-action" type="button" onClick={() => runSyncBatches(sync)}>Resume scan</button> : <button className="google-primary-action" type="button" onClick={handleStartSync} disabled={isSyncing}>{isSyncing ? 'Scanning metadata…' : sync?.status === 'COMPLETED' ? 'Check for newer messages' : 'Start metadata scan'}</button>}{activeSync ? <button type="button" onClick={handleCancelSync}>Cancel scan</button> : null}</div></section> : null}
    <section className="google-boundaries" aria-labelledby="boundaries-title"><div><p className="google-eyebrow">Before you connect</p><h2 id="boundaries-title">What this permission means</h2></div><ul><li><strong>Read selected metadata</strong><span>Sender, normalized subject signal, and received date needed for account and subscription evidence.</span></li><li><strong>No message bodies or attachments</strong><span>Mail.ReadBasic does not grant full message body access.</span></li><li><strong>Disconnect when you choose</strong><span>OwnTrace removes locally derived Microsoft data when you disconnect.</span></li></ul></section>
  </div></main></PrivacyWorkspace>
}

export default MicrosoftConnectionPage
