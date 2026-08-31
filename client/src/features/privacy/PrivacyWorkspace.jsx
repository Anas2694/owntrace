import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../auth/useAuth.js'
import WorkspaceIcon from './WorkspaceIcon.jsx'
import './privacy-workspace.css'

const navigationGroups = [
  {
    label: 'Overview',
    links: [
      { icon: 'dashboard', label: 'Dashboard', to: '/dashboard' },
    ],
  },
  {
    label: 'Discover',
    links: [
      { icon: 'accounts', label: 'Accounts', to: '/accounts' },
      { icon: 'identity', label: 'Identity map', to: '/identity' },
      { icon: 'subscriptions', label: 'Subscriptions', to: '/subscriptions' },
    ],
  },
  {
    label: 'Protect',
    links: [
      { icon: 'breaches', label: 'Breaches', to: '/breaches' },
      { icon: 'exposures', label: 'Exposure review', to: '/exposures' },
      { icon: 'health', label: 'Privacy health', to: '/privacy-health' },
      { icon: 'inbox', label: 'Privacy inbox', to: '/privacy-inbox' },
      { icon: 'requests', label: 'Privacy requests', to: '/privacy-requests' },
      { icon: 'notifications', label: 'Notifications', to: '/notifications' },
    ],
  },
  {
    label: 'Manage',
    links: [
      { icon: 'connections', label: 'Mail connections', to: '/connect' },
      { icon: 'settings', label: 'Settings', to: '/settings' },
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
          <NavLink aria-label="OwnTrace dashboard" className="privacy-brand" to="/dashboard">
            <span className="privacy-brand-mark" aria-hidden="true"><span /></span>
            <span><strong>OwnTrace</strong><small>Private workspace</small></span>
          </NavLink>
          <button aria-label="Close navigation" className="privacy-sidebar-close" onClick={() => closeNavigation()} type="button">×</button>
        </div>
        <nav aria-label="OwnTrace workspace">
          {navigationGroups.map((group) => (
            <div className="privacy-nav-group" key={group.label}>
              <p>{group.label}</p>
              {group.links.map((link) => (
                <NavLink key={link.to} to={link.to}>
                  <WorkspaceIcon className="privacy-nav-icon" name={link.icon} />
                  <span>{link.label}</span>
                </NavLink>
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
