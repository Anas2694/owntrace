import { NavLink, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import GradualBlur from '../GradualBlur/GradualBlur.jsx'
import Icon from '../ui/Icon.jsx'

const navigation = [
  { label: 'Overview', to: '/dashboard', icon: 'grid' },
  { label: 'Accounts', to: '/accounts', icon: 'user' },
  { label: 'Subscriptions', to: '/subscriptions', icon: 'subscription' },
  { label: 'Breaches', to: '/breaches', icon: 'breach', badge: '7' },
  { label: 'Privacy Inbox', to: '/privacy-inbox', icon: 'spark', badge: '9' },
]

function AppShell({ children, user, variant = 'bugatti' }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [theme, setTheme] = useState(() => window.localStorage.getItem('owntrace-theme') || 'dark')
  const location = useLocation()

  useEffect(() => {
    window.localStorage.setItem('owntrace-theme', theme)
  }, [theme])

  return (
    <div className={`dashboard-app dashboard-app--${variant}${isSidebarOpen ? ' is-sidebar-open' : ''}`} data-theme={theme}>
      <button
        className={`sidebar-backdrop${isSidebarOpen ? ' is-visible' : ''}`}
        type="button"
        aria-label="Close navigation"
        onClick={() => setSidebarOpen(false)}
      />
      <aside className={`app-sidebar${isSidebarOpen ? ' is-open' : ''}`} aria-label="Primary navigation">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true"><Icon name="shield" size={19} strokeWidth={2.2} /></span>
          <span>OwnTrace</span>
        </div>
        <div className="sidebar-label">Your digital life</div>
        <nav>
          {navigation.map((item) => (
            <NavLink
              className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}
              end={item.to === '/dashboard'}
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
              {item.badge && <span className="sidebar-badge">{item.badge}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <NavLink className="sidebar-link" to="/settings" onClick={() => setSidebarOpen(false)}>
            <Icon name="lock" size={18} /><span>Privacy settings</span>
          </NavLink>
          <div className="sidebar-account">
            <span className="account-avatar">{(user?.name || 'M').slice(0, 1).toUpperCase()}</span>
            <span className="account-copy"><strong>{user?.name || 'Megh Mayur'}</strong><small>{user?.email || 'Your account'}</small></span>
            <Icon name="chevron" size={16} />
          </div>
        </div>
      </aside>

      <div className="dashboard-frame">
        <header className="dashboard-topbar">
          <button className="icon-button menu-button" type="button" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}>
            <Icon name="menu" />
          </button>
          <div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>{location.pathname === '/dashboard' ? 'Overview' : 'Dashboard'}</strong></div>
          <div className="topbar-actions">
            <button className="theme-toggle" type="button" onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
            <button className="icon-button" type="button" aria-label="Search"><Icon name="search" /></button>
            <button className="icon-button notification-button" type="button" aria-label="Notifications"><Icon name="bell" /><span aria-hidden="true" /></button>
            <div className="topbar-avatar" aria-label={`Signed in as ${user?.name || 'Megh Mayur'}`}>{(user?.name || 'M').slice(0, 1).toUpperCase()}</div>
          </div>
        </header>
        <main className="dashboard-main">{children}</main>
      </div>
      {variant === 'sentry' ? (
        <div className="sentry-bottom-blur" aria-hidden="true">
          <GradualBlur exponential />
        </div>
      ) : null}
    </div>
  )
}

export default AppShell
