import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'

const navItems = [
  { href: '#product', label: 'Product' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#privacy', label: 'Privacy' },
]

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return undefined

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        menuButtonRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="landing-header">
      <nav className="landing-container landing-nav" aria-label="Primary navigation">
        <a className="landing-brand" href="#top" aria-label="OwnTrace home">
          <span className="landing-brand-mark" aria-hidden="true">
            <span />
          </span>
          <span>OwnTrace</span>
        </a>

        <div className="desktop-navigation">
          <ul className="nav-links">
            {navItems.map((item) => (
              <li key={item.href}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
          <div className="nav-actions">
            <Link className="nav-sign-in" to="/login">
              Sign in
            </Link>
            <Link className="button button-small button-primary" to="/register">
              Get Started
            </Link>
          </div>
        </div>

        <button
          ref={menuButtonRef}
          className="mobile-menu-button"
          type="button"
          aria-controls="mobile-navigation"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setMenuOpen((isOpen) => !isOpen)}
        >
          <Icon name={menuOpen ? 'close' : 'menu'} className="menu-icon" />
        </button>

        <div
          id="mobile-navigation"
          className={`mobile-navigation${menuOpen ? ' is-open' : ''}`}
        >
          <ul>
            {navItems.map((item) => (
              <li key={item.href}>
                <a href={item.href} onClick={closeMenu}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mobile-nav-actions">
            <Link to="/login" onClick={closeMenu}>
              Sign in
            </Link>
            <Link className="button button-primary" to="/register" onClick={closeMenu}>
              Get Started
            </Link>
          </div>
        </div>
      </nav>
    </header>
  )
}

export default Navbar
