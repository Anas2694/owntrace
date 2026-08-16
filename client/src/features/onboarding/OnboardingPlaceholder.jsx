import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../auth/useAuth.js'

function OnboardingPlaceholder() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [error, setError] = useState('')

  async function handleLogout() {
    setIsSigningOut(true)
    setError('')

    try {
      await logout()
      navigate('/login', { replace: true })
    } catch {
      setError('OwnTrace could not sign you out. Please try again.')
      setIsSigningOut(false)
    }
  }

  return (
    <main className="authenticated-placeholder">
      <section aria-labelledby="authenticated-title">
        <p className="auth-eyebrow">Authenticated workspace</p>
        <h1 id="authenticated-title">Welcome, {user.name}.</h1>
        <p>
          Your account is ready. The guided privacy and Gmail onboarding flow will be introduced
          in the next owned milestone; no provider access has been requested yet.
        </p>
        <dl>
          <div><dt>Email</dt><dd>{user.email}</dd></div>
          <div><dt>Onboarding</dt><dd>Not started</dd></div>
        </dl>
        {error ? <p className="authenticated-error" role="alert">{error}</p> : null}
        <button className="auth-submit" type="button" onClick={handleLogout} disabled={isSigningOut}>
          {isSigningOut ? 'Signing out…' : 'Sign out'}
        </button>
      </section>
    </main>
  )
}

export default OnboardingPlaceholder
