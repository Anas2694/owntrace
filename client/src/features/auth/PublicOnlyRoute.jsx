import { Navigate } from 'react-router-dom'
import useAuth from './useAuth.js'

function PublicOnlyRoute({ children }) {
  const { isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <main className="auth-route-status" aria-busy="true">
        <span className="auth-spinner" aria-hidden="true" />
        <p>Checking your session…</p>
      </main>
    )
  }

  return user ? <Navigate to="/onboarding" replace /> : children
}

export default PublicOnlyRoute
