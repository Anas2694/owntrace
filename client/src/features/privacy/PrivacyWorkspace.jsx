import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../auth/useAuth.js'
import './privacy-workspace.css'

const navigationGroups = [
  {
    label: 'Overview',
    links: [
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Accounts', to: '/accounts' },
      { label: 'Identity', to: '/identity' },
    ],
  },
  {
    label: 'Privacy',
    links: [
      { label: 'Subscriptions', to: '/subscriptions' },
      { label: 'Breaches', to: '/breaches' },
      { label: 'Exposures', to: '/exposures' },
      { label: 'Privacy Health', to: '/privacy-health' },
      { label: 'Privacy Inbox', to: '/privacy-inbox' },
      { label: 'Privacy requests', to: '/privacy-requests' },
      { label: 'Notifications', to: '/notifications' },
    ],
  },
  {
    label: 'Connections',
    links: [
      { label: 'Gmail', to: '/connect/gmail' },
      { label: 'Microsoft', to: '/connect/microsoft' },
      { label: 'Settings', to: '/settings' },
    ],
  },
]

function useMobileLayout() {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 48rem)').matches)

  useEffect(() => {
    const query = window.matchMedia('(max-width: 48rem)')
    const update = () => setIsMobile(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return isMobile
}

function PrivacyWorkspace({ children, title }) {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useMobileLayout()
  const [isOpen, setIsOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const menuButtonRef = useRef(null)
  const sidebarRef = useRef(null)

  function closeNavigation({ restoreFocus = true } = {}) {
    setIsOpen(false)
    if (restoreFocus) window.setTimeout(() => menuButtonRef.current?.focus(), 0)
  }

  useEffect(() => {
    setIsOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!isMobile || !isOpen) return undefined
    const sidebar = sidebarRef.current
    const focusable = sidebar?.querySelectorAll('a[href], button:not([disabled])') || []
    focusable[0]?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeNavigation()
        return
      }
      if (event.key !== 'Tab' || !focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMobile, isOpen])

  async function handleLogout() {
    setIsSigningOut(true)
    setLogoutError('')
    try {
      await logout()
      navigate('/', { replace: true })
    } catch {
      setLogoutError('OwnTrace could not sign you out. Try again.')
      setIsSigningOut(false)
    }
  }

  const initial = user?.name?.trim().charAt(0).toUpperCase() || '?'

  return (
    <div className={`privacy-workspace${isOpen ? ' has-open-navigation' : ''}`}>
      {isMobile && isOpen ? (
        <button
          aria-label="Close navigation"
          className="privacy-navigation-backdrop"
          onClick={() => closeNavigation()}
          type="button"
        />
      ) : null}
      <aside
        aria-label="OwnTrace product navigation"
        aria-hidden={isMobile && !isOpen ? 'true' : undefined}
        aria-modal={isMobile && isOpen ? 'true' : undefined}
        className={`privacy-sidebar${isOpen ? ' is-open' : ''}`}
        id="owntrace-privacy-sidebar"
        inert={isMobile && !isOpen ? true : undefined}
        ref={sidebarRef}
        role={isMobile ? 'dialog' : undefined}
      >
        <div className="privacy-sidebar-brand-row">
          <NavLink className="privacy-brand" to="/dashboard">OwnTrace</NavLink>
          <button aria-label="Close navigation" className="privacy-sidebar-close" onClick={() => closeNavigation()} type="button">×</button>
        </div>
        <nav aria-label="OwnTrace workspace">
          {navigationGroups.map((group) => (
            <div className="privacy-nav-group" key={group.label}>
              <p>{group.label}</p>
              {group.links.map((link) => (
                <NavLink key={link.to} to={link.to}>{link.label}</NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="privacy-sidebar-account">
          <span aria-hidden="true">{initial}</span>
          <div><strong>{user?.name || 'OwnTrace user'}</strong><small>{user?.email}</small></div>
        </div>
        <button className="privacy-sign-out" disabled={isSigningOut} onClick={handleLogout} type="button">
          {isSigningOut ? 'Signing out…' : 'Sign out'}
        </button>
        {logoutError ? <p className="privacy-sidebar-error" role="alert">{logoutError}</p> : null}
      </aside>

      <div className="privacy-workspace-frame">
        <header className="privacy-mobile-header">
          <button
            aria-controls="owntrace-privacy-sidebar"
            aria-expanded={isOpen}
            aria-label="Open navigation"
            onClick={() => setIsOpen(true)}
            ref={menuButtonRef}
            type="button"
          >
            <span aria-hidden="true">☰</span>
          </button>
          <strong>{title}</strong>
          <span aria-hidden="true">{initial}</span>
        </header>
        {children}
      </div>
    </div>
  )
}

export default PrivacyWorkspace
