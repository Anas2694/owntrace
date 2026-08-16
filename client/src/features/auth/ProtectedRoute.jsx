import { Navigate, useLocation } from 'react-router-dom'
import useAuth from './useAuth.js'

function ProtectedRoute({ children }) {
  const { isLoading, restoreSession, sessionError, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <main className="auth-route-status" aria-busy="true">
        <span className="auth-spinner" aria-hidden="true" />
        <p>Restoring your session…</p>
      </main>
    )
  }

  if (sessionError) {
    return (
      <main className="auth-route-status" role="alert">
        <p>We could not verify your session.</p>
        <button type="button" onClick={restoreSession}>Try again</button>
      </main>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}

export default ProtectedRoute
