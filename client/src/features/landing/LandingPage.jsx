import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './landing.css'

const IdentityCore3D = lazy(() => import('./components/IdentityCore3D.jsx'))

function Mark() {
  return <span className="q-mark" aria-hidden="true"><i /><i /><i /></span>
}

function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [entrance, setEntrance] = useState('pending')
  const menuButtonRef = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setEntrance('done')
      return undefined
    }

    let cancelled = false
    let settleTimer
    const fallbackTimer = window.setTimeout(() => {
      if (!cancelled) setEntrance('run')
    }, 1200)

    Promise.resolve(document.fonts?.ready).then(() => {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (cancelled) return
        window.clearTimeout(fallbackTimer)
        setEntrance('run')
        settleTimer = window.setTimeout(() => setEntrance('done'), 2200)
      }))
    })

    return () => {
      cancelled = true
      window.clearTimeout(fallbackTimer)
      window.clearTimeout(settleTimer)
    }
  }, [])

  useEffect(() => {
    if (!menuOpen) return undefined
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        menuButtonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="q-home" data-enter={entrance}>
      <a className="q-skip" href="#main-content">Skip to main content</a>

      <nav className={`q-nav${menuOpen ? ' is-open' : ''}`} aria-label="Primary navigation">
        <a className="q-brand" href="#top" aria-label="OwnTrace home"><Mark /><span>OwnTrace</span></a>
        <div className="q-nav-links">
          <a href="#product">Product</a>
          <a href="#privacy">Privacy</a>
          <a href="https://github.com/Anas2694/owntrace">GitHub</a>
          <Link to="/login">Sign in</Link>
        </div>
        <Link className="q-nav-cta" to="/register">Create account</Link>
        <button
          aria-controls="q-mobile-menu"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          className="q-burger"
          onClick={() => setMenuOpen((value) => !value)}
          ref={menuButtonRef}
          type="button"
        >
          <span /><span />
        </button>
        <div className="q-mobile-menu" id="q-mobile-menu" hidden={!menuOpen}>
          <a href="#product" onClick={closeMenu}>Product</a>
          <a href="#privacy" onClick={closeMenu}>Privacy</a>
          <a href="https://github.com/Anas2694/owntrace" onClick={closeMenu}>GitHub</a>
          <Link to="/login" onClick={closeMenu}>Sign in</Link>
          <Link className="q-mobile-cta" to="/register" onClick={closeMenu}>Create account</Link>
        </div>
      </nav>

      <main id="main-content">
        <section className="q-hero" id="top" aria-labelledby="q-title">
          <p className="q-kicker">Your digital footprint, made explainable</p>
          <h1 id="q-title">Find forgotten accounts.<br /> See why they matter.</h1>
          <p className="q-subcopy">Turn supported metadata into a private, reviewable account inventory.<br />You decide what is true and what happens next.</p>
          <Link className="q-hero-cta" to="/register">Get started</Link>
        </section>

        <section className="q-band" id="product" aria-label="OwnTrace product preview">
          <div className="q-band-grid" aria-hidden="true" />
          <Suspense fallback={<div className="identity-core-shell is-loading" aria-hidden="true" />}>
            <IdentityCore3D />
          </Suspense>

          <article className="q-product-card" aria-labelledby="q-card-title">
            <header className="q-card-header">
              <div><p># Sample evidence / account review</p><h2 id="q-card-title">Canva account trace</h2></div>
              <span>Illustrative</span>
            </header>
            <div className="q-card-meta">
              <span className="q-avatar-stack" aria-hidden="true"><i /><i /><i /></span>
              <span>17 signals</span><b>•</b><span>Last observed 2024</span><b>•</b><span>Review required</span>
            </div>
            <div className="q-tabs" role="tablist" aria-label="Sample account evidence views">
              <button aria-selected="true" role="tab" type="button">Evidence</button>
              <button aria-selected="false" role="tab" type="button">Activity</button>
              <button aria-selected="false" role="tab" type="button">Exposure</button>
              <button aria-selected="false" role="tab" type="button">Actions</button>
            </div>
            <section className="q-evidence-panel" aria-label="Sample supporting evidence">
              <h3>Why OwnTrace surfaced this account</h3>
              <div className="q-evidence-row is-confirmed"><span aria-hidden="true">✓</span><div><strong>Supported mail metadata matched canva.com</strong><small>Sender domain and account-language signals · no message body stored</small></div></div>
              <div className="q-evidence-row is-review"><span aria-hidden="true">?</span><div><strong>Account may be dormant</strong><small>Last supporting signal is older than 12 months · confirm before acting</small></div></div>
            </section>
          </article>

          <aside className="q-boundary" id="privacy">
            <span><i /> Metadata only</span>
            <p>OwnTrace shows the evidence before suggesting an action.</p>
          </aside>
          <footer className="q-footer"><span>Early development</span><Link to="/privacy-policy">Privacy</Link><Link to="/terms">Terms</Link><span>© {new Date().getFullYear()} OwnTrace</span></footer>
        </section>
      </main>
    </div>
  )
}

export default LandingPage
