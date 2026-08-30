import { useState } from 'react'
import api from '../../services/api.js'
import WorkspaceHeader from '../workspace/WorkspaceHeader.jsx'
import './account-settings.css'

function AccountSettingsPage() {
  const [values, setValues] = useState({ confirmation: '', password: '' })
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')

  function updateField(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setError('')
  }

  async function handleDelete(event) {
    event.preventDefault()
    setIsDeleting(true)
    setError('')

    try {
      const response = await api.delete('/auth/account', { data: values })
      const revocation = response.data.providerRevocation === 'FAILED' ? 'failed' : 'complete'
      window.location.replace(`/login?account=deleted&providerRevocation=${revocation}`)
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'OwnTrace could not delete your account. Your data has not been reported as deleted.',
      )
      setIsDeleting(false)
    }
  }

  const canDelete = values.confirmation === 'DELETE' && Boolean(values.password) && !isDeleting

  return (
    <main className="settings-page">
      <div className="settings-shell">
        <WorkspaceHeader />

        <section className="settings-intro" aria-labelledby="settings-title">
          <div>
            <p className="settings-eyebrow">Account settings</p>
            <h1 id="settings-title">Control your OwnTrace data.</h1>
          </div>
          <p>
            Review the account-level privacy controls that belong to OwnTrace. External services
            keep their own data and account settings.
          </p>
        </section>

        <section className="settings-data-card" aria-labelledby="stored-data-title">
          <div>
            <p className="settings-eyebrow">Stored by OwnTrace</p>
            <h2 id="stored-data-title">Your current workspace data</h2>
          </div>
          <ul>
            <li>OwnTrace profile and password hash</li>
            <li>Encrypted Google connection credentials, when connected</li>
            <li>Minimized Gmail signals, derived account evidence, accounts, and actions</li>
          </ul>
        </section>

        <section className="settings-danger-card" aria-labelledby="delete-account-title">
          <div className="settings-danger-copy">
            <p className="settings-eyebrow">Permanent action</p>
            <h2 id="delete-account-title">Delete your OwnTrace account</h2>
            <p>
              OwnTrace will attempt to revoke its Google access, then permanently remove your
              profile and all of your OwnTrace workspace data. This does not delete accounts or data
              held by Google or other services.
            </p>
          </div>

          {error ? <p className="settings-error" role="alert">{error}</p> : null}

          <form className="settings-delete-form" onSubmit={handleDelete} aria-busy={isDeleting}>
            <label htmlFor="delete-confirmation">
              Type <strong>DELETE</strong> to confirm
            </label>
            <input
              id="delete-confirmation"
              name="confirmation"
              value={values.confirmation}
              onChange={updateField}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck="false"
              required
            />

            <label htmlFor="delete-password">Current password</label>
            <input
              id="delete-password"
              name="password"
              type="password"
              value={values.password}
              onChange={updateField}
              autoComplete="current-password"
              maxLength="128"
              required
            />

            <button type="submit" disabled={!canDelete}>
              {isDeleting ? 'Deleting account…' : 'Delete OwnTrace account'}
            </button>
          </form>

          <p className="settings-provider-note">
            If Google cannot confirm revocation, OwnTrace still removes its local copy and tells
            you to review access directly in your Google Account.
          </p>
        </section>
      </div>
    </main>
  )
}

export default AccountSettingsPage
