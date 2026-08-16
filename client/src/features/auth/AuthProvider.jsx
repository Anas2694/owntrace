import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../../services/api.js'
import AuthContext from './auth-context.js'

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionError, setSessionError] = useState(false)

  const restoreSession = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) setIsLoading(true)
    setSessionError(false)

    try {
      const response = await api.get('/auth/session')
      setUser(response.data.user)
      return response.data.user
    } catch {
      setSessionError(true)
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    restoreSession()
  }, [restoreSession])

  const login = useCallback(async (credentials) => {
    const response = await api.post('/auth/login', credentials)
    setUser(response.data.user)
    setSessionError(false)
    return response.data.user
  }, [])

  const register = useCallback(async (details) => {
    const response = await api.post('/auth/register', details)
    setUser(response.data.user)
    setSessionError(false)
    return response.data.user
  }, [])

  const logout = useCallback(async () => {
    await api.post('/auth/logout')
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ isLoading, login, logout, register, restoreSession, sessionError, user }),
    [isLoading, login, logout, register, restoreSession, sessionError, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
