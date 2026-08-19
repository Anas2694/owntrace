import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import useAuth from '../auth/useAuth.js'

function AccountsHeader() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [error, setError] = useState('')

  async function handleLogout() {
    setIsSigningOut(true)
    setError('')
    try {
      await logout()
      navigate('/', { replace: true })
    } catch {
      setError('OwnTrace could not sign you out. Try again.')
      setIsSigningOut(false)
    }
  }

  return (
    <header className="accounts-header">
      <Link className="accounts-brand" to="/">OwnTrace</Link>
      <nav aria-label="Account workspace">
        <NavLink to="/accounts">Accounts</NavLink>
        <NavLink to="/connect/gmail">Gmail connection</NavLink>
      </nav>
      <button type="button" onClick={handleLogout} disabled={isSigningOut}>
        {isSigningOut ? 'Signing out…' : 'Sign out'}
      </button>
      {error ? <p className="accounts-header-error" role="alert">{error}</p> : null}
    </header>
  )
}

export default AccountsHeader
