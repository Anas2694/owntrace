import { Link } from 'react-router-dom'
import '../google/google-connection.css'
import PrivacyWorkspace from '../privacy/PrivacyWorkspace.jsx'

const providers = [
  {
    description: 'Use Gmail sender, subject-signal, and date metadata through the gmail.metadata scope.',
    label: 'Gmail',
    path: '/connect/gmail',
  },
  {
    description: 'Use Microsoft Inbox sender, normalized subject-signal, and date metadata through Mail.ReadBasic.',
    label: 'Microsoft',
    path: '/connect/microsoft',
  },
]

function MailConnectionsPage() {
  return (
    <PrivacyWorkspace title="Mail connections">
      <main className="google-page">
        <div className="google-shell">
        <section className="google-intro" aria-labelledby="mail-connections-title">
          <p className="google-eyebrow">Mail connections</p>
          <h1 id="mail-connections-title">Choose the source you want to connect.</h1>
          <p>Each provider is optional. Review its exact permissions and privacy boundaries before continuing.</p>
        </section>

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
