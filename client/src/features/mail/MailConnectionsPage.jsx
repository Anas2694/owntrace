import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../services/api.js'
import useAuth from '../auth/useAuth.js'
import PrivacyWorkspace from '../privacy/PrivacyWorkspace.jsx'
import '../google/google-connection.css'

const providers = [
  {
    description: 'Find account clues from senders, subject signals, and dates in Gmail. Message bodies are not stored.',
    label: 'Gmail',
    path: '/connect/gmail',
  },
  {
    description: 'Find account clues in your Microsoft Inbox using basic mail metadata, without message bodies or attachments.',
    label: 'Microsoft',
    path: '/connect/microsoft',
  },
]

function MailConnectionsPage() {
  const { user, restoreSession } = useAuth()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  async function skipConnection() {
    setSaving(true)
    setError('')
    try {
      await api.patch('/onboarding', { status: 'COMPLETED' })
      await restoreSession({ showLoading: false })
      navigate('/dashboard', { replace: true })
    } catch { setError('We could not save your choice. Please try again.') }
    finally { setSaving(false) }
  }
  return (
    <PrivacyWorkspace title="Mail connections">
    <main className="google-page">
      <div className="google-shell">
        <header className="google-header">
          <span className="google-brand">Mail connections</span>
          <Link to="/onboarding">Review privacy setup</Link>
        </header>

        <section className="google-intro" aria-labelledby="mail-connections-title">
          <p className="google-eyebrow">Mail connections</p>
          <h1 id="mail-connections-title">Choose the source you want to connect.</h1>
          <p>Each provider is optional. Review its exact permissions and privacy boundaries before continuing.</p>
        </section>
        {error ? <p className="google-notice" role="alert">{error}</p> : null}
        <div className="google-actions">
          {user.onboardingStatus === 'COMPLETED' ? <Link className="google-primary-action" to="/dashboard">Return to dashboard</Link> : <button type="button" disabled={saving} onClick={skipConnection}>{saving ? 'Saving…' : 'Continue without connecting'}</button>}
        </div>

        <section className="google-capabilities" aria-label="Available mail providers">
          <div className="google-capability-grid">
            {providers.map((provider) => (
              <article key={provider.path}>
                <span className="google-capability-label is-confirmed">Optional provider</span>
                <h2>{provider.label}</h2>
                <p>{provider.description}</p>
                <Link className="google-account-link" to={provider.path}>Review {provider.label} connection</Link>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
    </PrivacyWorkspace>
  )
}

export default MailConnectionsPage
