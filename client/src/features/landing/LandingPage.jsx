import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Lenis from '../../vendor/lenis.mjs'
import './landing.css'

const SignalGlobe = lazy(() => import('./components/SignalGlobe.jsx'))

const values = [
  ['01', 'Trace what matters', 'Turn supported Gmail and Microsoft metadata into a bounded inventory of accounts, subscriptions, and security signals without storing message bodies.'],
  ['02', 'Explain every signal', 'See why an account or subscription was detected, how confident OwnTrace is, and where its evidence came from before you take action.'],
  ['03', 'Keep control', 'Disconnect providers, remove derived records, or delete your OwnTrace account through explicit user-scoped lifecycle controls.'],
]

const blindSpots = [
  ['01', 'Forgotten accounts', 'Old sign-ups remain scattered across years of inbox activity.'],
  ['02', 'Recurring services', 'Payments and renewal signals are easy to overlook in routine mail.'],
  ['03', 'Security warnings', 'Password resets and alerts disappear into ordinary messages.'],
  ['04', 'Identity overlap', 'Aliases and providers make one identity look like disconnected fragments.'],
  ['05', 'Privacy work', 'Findings need a review path—not another pile of notifications.'],
]

const processSteps = [
  ['01', 'Connect', 'Approve a narrow provider permission with clear boundaries.'],
  ['02', 'Discover', 'Process selected metadata in bounded, resumable batches.'],
  ['03', 'Review', 'Inspect derived accounts, risks, subscriptions, and next steps.'],
]

const capabilities = [
  ['Account inventory', 'Organize discovered services into a user-scoped, evidence-backed inventory.'],
  ['Subscription signals', 'Surface payment and renewal evidence without claiming a subscription is active.'],
  ['Verified breach checks', 'Run a consent-gated check and keep verified results separate from inbox signals.'],
  ['Privacy Health', 'Use an explainable bounded score to prioritize the evidence already available.'],
  ['Gmail + Microsoft', 'Connect either provider through metadata-only access and independent lifecycle controls.'],
]

const useCases = [
  ['01', 'Find old accounts', 'See which services still appear across your connected inbox evidence.'],
  ['02', 'Review recurring costs', 'Group deterministic subscription and payment signals by service.'],
  ['03', 'Respond to breaches', 'Separate verified findings from unverified security-alert metadata.'],
  ['04', 'Reduce account sprawl', 'Turn dormant and low-confidence discoveries into careful actions.'],
]

const footerGroups = [
  ['Platform', [['Overview', '#overview'], ['Capabilities', '#capabilities'], ['How it works', '#process'], ['Dashboard', '/dashboard']]],
  ['Workspace', [['Accounts', '/accounts'], ['Subscriptions', '/subscriptions'], ['Breaches', '/breaches'], ['Identity graph', '/identity']]],
  ['Privacy', [['Privacy Health', '/privacy-health'], ['Privacy inbox', '/privacy-inbox'], ['Privacy requests', '/privacy-requests'], ['Notifications', '/notifications']]],
  ['Providers', [['Connect Gmail', '/connect/gmail'], ['Connect Microsoft', '/connect/microsoft'], ['Account actions', '/account-actions'], ['Settings', '/settings']]],
  ['Principles', [['Owner-scoped records', '#privacy'], ['Minimized collection', '#privacy'], ['Explainable signals', '#privacy'], ['Explicit lifecycle controls', '#privacy']]],
  ['Resources', [['Privacy policy', '/privacy-policy'], ['Terms of service', '/terms'], ['GitHub', 'https://github.com/Anas2694/owntrace']]],
  ['Account', [['Create account', '/register'], ['Sign in', '/login']]],
]

function BracketLink({ children, className = '', to }) {
  const label = typeof children === 'string' ? children : ''
  const [displayLabel, setDisplayLabel] = useState(label)
  const frameRef = useRef(0)
  const scramble = () => {
    if (!label || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    cancelAnimationFrame(frameRef.current)
    const start = performance.now()
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const animate = (now) => {
      const progress = Math.min(1, (now - start) / 1750)
      const revealProgress = Math.max(0, (progress - 0.15) / 0.85)
      const revealed = Math.floor(revealProgress * label.length)
      setDisplayLabel([...label].map((character, index) => character === ' ' || index < revealed ? character : letters[Math.floor(Math.random() * letters.length)]).join(''))
      if (progress < 1) frameRef.current = requestAnimationFrame(animate)
      else setDisplayLabel(label)
    }
    frameRef.current = requestAnimationFrame(animate)
  }
  useEffect(() => () => cancelAnimationFrame(frameRef.current), [])
  const classes = `ot-bracket-link ${className}`.trim()
  const content = <><span>[</span><span aria-hidden={Boolean(label)} className="ot-scramble-text">{label ? displayLabel : children}</span><b aria-hidden="true">→</b><span>]</span></>
  const shared = { className: classes, onMouseEnter: scramble, onFocus: scramble, 'aria-label': label || undefined }
  return to.startsWith('/') ? <Link {...shared} to={to}>{content}</Link> : <a {...shared} href={to}>{content}</a>
}

function FooterLink({ children, to }) {
  if (to.startsWith('#')) return <a href={to}>{children}</a>
  if (to.startsWith('http')) return <a href={to} target="_blank" rel="noreferrer">{children}</a>
  return <Link to={to}>{children}</Link>
}

function Reveal({ as: Tag = 'div', children, className = '', delay = 0, ...props }) {
  return <Tag className={`ot-reveal ${className}`.trim()} style={{ '--reveal-delay': `${delay}ms` }} {...props}>{children}</Tag>
}

function PixelMark() {
  return <span className="ot-pixel-mark" aria-hidden="true"><i /><i /><i /><i /></span>
}

function GlobeStage() {
  return <Suspense fallback={<img className="ot-globe-loading" src="/images/spur-earth-fallback.webp" alt="Abstract globe of connected digital signals" />}><SignalGlobe /></Suspense>
}

const valueVisuals = [
  { label: 'Signal inventory', metric: '186', unit: 'accounts', nodes: ['GMAIL', 'MICROSOFT', 'BILLING', 'SECURITY'] },
  { label: 'Evidence trace', metric: '94%', unit: 'explained', nodes: ['SOURCE', 'RULE', 'CONFIDENCE', 'RESULT'] },
  { label: 'Lifecycle controls', metric: '03', unit: 'controls', nodes: ['DISCONNECT', 'REMOVE', 'DELETE', 'CONFIRM'] },
]

function InstrumentSurface({ index, mode = 'value' }) {
  const visual = mode === 'value'
    ? valueVisuals[index]
    : { label: processSteps[index][1], metric: processSteps[index][0], unit: 'stage', nodes: ['PROVIDER', 'QUEUE', 'EVIDENCE', 'WORKSPACE'] }

  return (
    <div className={`ot-instrument ot-instrument-${mode} is-state-${index + 1}`} key={`${mode}-${index}`} aria-hidden="true">
      <div className="ot-instrument-grid" />
      <div className="ot-instrument-scan" />
      <div className="ot-instrument-cross cross-a">＋</div>
      <div className="ot-instrument-cross cross-b">＋</div>
      <div className="ot-instrument-cross cross-c">＋</div>
      <div className="ot-instrument-route route-a" />
      <div className="ot-instrument-route route-b" />
      {visual.nodes.map((node, nodeIndex) => <span className={`ot-instrument-node node-${nodeIndex + 1}`} key={node}>{node}</span>)}
      <div className="ot-instrument-focus"><i /><i /><i /><i /><b>OT</b></div>
      <div className="ot-instrument-card">
        <small>{visual.label}</small>
        <strong>{visual.metric}</strong>
        <span>{visual.unit}</span>
      </div>
      <div className="ot-instrument-status"><i /> Verified owner scope</div>
    </div>
  )
}

function CapabilityInstrument({ index }) {
  const labels = ['Inventory graph', 'Renewal evidence', 'Verified findings', 'Risk factors', 'Provider boundary']
  return (
    <div className={`ot-capability-instrument is-state-${index + 1}`} key={`capability-visual-${index}`} aria-hidden="true">
      <div className="ot-capability-map">
        {Array.from({ length: 72 }, (_, dot) => <i key={dot} />)}
      </div>
      <span className="ot-capability-target target-a" />
      <span className="ot-capability-target target-b" />
      <span className="ot-capability-target target-c" />
      <div className="ot-capability-readout"><small>{labels[index]}</small><strong>{String(32_703 + index * 8_411).toLocaleString('en-US')}</strong><span>derived records</span></div>
      <div className="ot-capability-chip">OWNER / 01</div>
    </div>
  )
}

function LandingPage() {
  const menuButtonRef = useRef(null)
  const navPanelRef = useRef(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [valueIndex, setValueIndex] = useState(0)
  const [processIndex, setProcessIndex] = useState(0)
  const [capabilityIndex, setCapabilityIndex] = useState(0)
  const [lightNavigation, setLightNavigation] = useState(false)
  const [signalCount, setSignalCount] = useState(24186)

  useEffect(() => {
    if (!menuOpen) return undefined
    const panel = navPanelRef.current
    const focusable = [...(panel?.querySelectorAll('a, button') || [])]
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    focusable[0]?.focus({ preventScroll: true })
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        requestAnimationFrame(() => menuButtonRef.current?.focus())
        return
      }
      if (event.key !== 'Tab' || focusable.length === 0) return
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
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  useEffect(() => {
    let tick = 0
    const interval = window.setInterval(() => {
      tick += 1
      setSignalCount((count) => count + 7 + (tick % 11))
    }, 1400)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const lenis = new Lenis({
      anchors: false,
      lerp: 0.12,
      smoothWheel: true,
      stopInertiaOnNavigate: false,
    })
    const handleAnchor = (event) => {
      const anchor = event.currentTarget
      const target = anchor.getAttribute('href')
      if (!target?.startsWith('#')) return
      event.preventDefault()
      setMenuOpen(false)
      lenis.scrollTo(target, {
        offset: 0,
        onComplete: () => window.history.replaceState(null, '', target),
      })
    }
    const anchors = [...document.querySelectorAll('.ot-landing a[href^="#"]')]
    anchors.forEach((anchor) => anchor.addEventListener('click', handleAnchor))
    let frame = 0
    const animate = (time) => {
      lenis.raf(time)
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => {
      cancelAnimationFrame(frame)
      anchors.forEach((anchor) => anchor.removeEventListener('click', handleAnchor))
      lenis.destroy()
    }
  }, [])

  useEffect(() => {
    const track = document.querySelector('.ot-marquee > div')
    if (!track || window.matchMedia('(prefers-reduced-motion: reduce)').matches || typeof track.animate !== 'function') return undefined
    const duration = 22000
    const marquee = track.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }], { duration, iterations: Infinity, easing: 'linear' })
    marquee.currentTime = duration
    marquee.playbackRate = -0.8
    let settleFrame = 0
    let settleTimer = 0

    const settle = (startRate, endRate) => {
      const start = performance.now()
      const tick = (now) => {
        const progress = Math.min(1, (now - start) / 1000)
        marquee.playbackRate = startRate + (endRate - startRate) * progress
        if (progress < 1) settleFrame = requestAnimationFrame(tick)
      }
      settleFrame = requestAnimationFrame(tick)
    }
    const onWheel = (event) => {
      cancelAnimationFrame(settleFrame)
      clearTimeout(settleTimer)
      const direction = event.deltaY > 0 ? -1 : 1
      marquee.playbackRate = direction * 5
      settleTimer = window.setTimeout(() => settle(direction * 5, direction * 0.8), 200)
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    return () => {
      window.removeEventListener('wheel', onWheel)
      cancelAnimationFrame(settleFrame)
      clearTimeout(settleTimer)
      marquee.cancel()
    }
  }, [])

  useEffect(() => {
    const nodes = [...document.querySelectorAll('.ot-reveal')]
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.14, rootMargin: '0px 0px -7% 0px' })
    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let frame = 0
    const updateFromScroll = () => {
      frame = 0
      const progressIndex = (selector, count) => {
        const element = document.querySelector(selector)
        if (!element) return 0
        const rect = element.getBoundingClientRect()
        const travel = Math.max(1, rect.height - window.innerHeight * 0.45)
        const progress = Math.min(0.999, Math.max(0, (-rect.top + window.innerHeight * 0.32) / travel))
        return Math.floor(progress * count)
      }
      setValueIndex(progressIndex('.ot-values', values.length))
      setProcessIndex(progressIndex('.ot-process', processSteps.length))
      setCapabilityIndex(progressIndex('.ot-capabilities', capabilities.length))
      const activeSection = [...document.querySelectorAll('main section')].find((section) => {
        const rect = section.getBoundingClientRect()
        return rect.top <= 80 && rect.bottom > 80
      })
      setLightNavigation(Boolean(activeSection?.classList.contains('ot-light') || activeSection?.classList.contains('ot-final-cta')))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(updateFromScroll)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    updateFromScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div className="ot-landing">
      <a className="ot-skip" href="#main-content">Skip to main content</a>
      <header className="ot-header">
        <nav className={`ot-nav ${lightNavigation ? 'is-light' : ''}`} aria-label="Primary navigation">
          <Link className="ot-logo" to="/" aria-label="OwnTrace home"><span className="ot-logo-mark" aria-hidden="true">✣</span>OwnTrace</Link>
          <button ref={menuButtonRef} className="ot-menu-button" type="button" aria-expanded={menuOpen} aria-controls="ot-navigation" onClick={() => setMenuOpen((open) => !open)}>[ {menuOpen ? 'Close' : 'Menu'} ]</button>
          <div ref={navPanelRef} className={`ot-nav-panel ${menuOpen ? 'is-open' : ''}`} id="ot-navigation">
            <ul>
              <li><a href="#platform">Platform</a></li><li><a href="#process">How it works</a></li><li><a href="#capabilities">Capabilities</a></li><li><a href="#privacy">Privacy</a></li>
            </ul>
            <div className="ot-nav-actions"><Link to="/login">Login</Link><BracketLink to="/register">Start free</BracketLink><Link className="ot-demo-link" to="/register">Get started <i aria-hidden="true" /></Link></div>
          </div>
        </nav>
      </header>

      <main id="main-content">
        <section className="ot-hero ot-dark-grid" id="platform" aria-labelledby="ot-hero-title">
          <Reveal as="h1" aria-label="Own your digital trail hiding in plain sight" id="ot-hero-title" className="ot-hero-title">
            <span aria-hidden="true" className="ot-title-desktop"><i><b>Own Your</b><b>Digital Trail</b></i><i><b>Hiding In</b><b>Plain Sight</b></i></span>
            <span aria-hidden="true" className="ot-title-mobile"><b>Own Your</b><b>Digital Trail</b><b>Hiding In</b><b>Plain Sight</b></span>
          </Reveal>
          <div className="ot-hero-stage">
            <Reveal className="ot-hero-copy" delay={1800}>
              <p>OwnTrace turns supported inbox metadata into evidence you can inspect—accounts, subscriptions, security signals, and practical privacy actions in one place.</p>
              <div className="ot-hero-links"><BracketLink to="/register">Explore OwnTrace</BracketLink><BracketLink to="#process">See how it works</BracketLink></div>
              <a className="ot-scroll-cue" href="#overview">[ Scroll ↓ ]</a>
            </Reveal>
            <div className="ot-globe-wrap" aria-label="Animated network of derived digital identity signals"><GlobeStage /><div className="ot-live-signal"><span aria-hidden="true">◎</span> Minimized signals: <strong>{signalCount.toLocaleString('en-US')}</strong></div></div>
            <Reveal className="ot-featured" delay={1800}>
              <p className="ot-label">Current surface</p>
              <article><span>01</span><strong>Account discovery</strong><small>Provider metadata → evidence</small></article>
              <article><span>02</span><strong>Subscription review</strong><small>Deterministic, explainable signals</small></article>
              <article><span>03</span><strong>Privacy actions</strong><small>User-controlled next steps</small></article>
            </Reveal>
          </div>
        </section>

        <section className="ot-overview ot-light" id="overview">
          <Reveal className="ot-overview-lead"><p>Your online identity is fragmented across years of sign-ups, aliases, subscriptions, and security events.</p></Reveal>
          <div className="ot-overview-grid">
            <p className="ot-label">Overview</p>
            <Reveal as="p" className="ot-overview-copy" delay={80}>OwnTrace is a privacy-first workspace for understanding that sprawl. It derives bounded facts from supported provider metadata, keeps every record scoped to its owner, and labels uncertainty instead of turning guesses into claims.</Reveal>
            <Reveal className="ot-signal-map" delay={160} aria-hidden="true"><div className="ot-map-orbit orbit-a" /><div className="ot-map-orbit orbit-b" /><div className="ot-map-core">YOU</div>{['ACCOUNTS', 'BILLING', 'BREACHES', 'IDENTITY', 'ACTIONS'].map((label, index) => <span className={`ot-map-node node-${index + 1}`} key={label}>{label}</span>)}</Reveal>
          </div>
        </section>

        <section className="ot-values ot-dark-grid" aria-labelledby="value-title">
          <div className="ot-section-band"><p className="ot-label" id="value-title">Value proposition</p></div>
          <div className="ot-values-layout">
            <div className="ot-value-tabs" role="tablist" aria-label="OwnTrace value propositions">
              {values.map((item, index) => <button aria-controls="value-panel" aria-selected={valueIndex === index} className={valueIndex === index ? 'is-active' : ''} id={`value-tab-${index}`} key={item[0]} onClick={() => setValueIndex(index)} role="tab" type="button"><span>{item[0]}</span><i aria-hidden="true">{index === valueIndex ? '✣' : '＋'}</i><strong>{item[1]}</strong><span className="ot-value-mobile-copy">{item[2]}</span></button>)}
            </div>
            <Reveal className="ot-value-panel" id="value-panel" role="tabpanel" aria-labelledby={`value-tab-${valueIndex}`}>
              <InstrumentSurface index={valueIndex} /><div className="ot-value-panel-content" key={valueIndex}><p>{values[valueIndex][2]}</p><div className="ot-evidence-counter"><span>◎</span> Evidence remains owner-scoped</div></div>
            </Reveal>
          </div>
        </section>

        <section className="ot-blindspots ot-light" id="privacy" aria-labelledby="blindspots-title">
          <Reveal as="h2" id="blindspots-title">Why OwnTrace Exists. <span>Your Digital Life Is Connected — But Hard To See.</span></Reveal>
          <div className="ot-two-copy"><p>Every provider shows one slice of your activity. The gaps between them make forgotten accounts and recurring services hard to understand.</p><p>OwnTrace creates a reviewable evidence layer across supported sources while preserving provider boundaries and user ownership.</p></div>
          <div className="ot-blindspot-grid">{blindSpots.map(([number, title, copy], index) => <Reveal as="article" delay={index * 55} key={number}><span>{number}</span><PixelMark /><h3>{title}</h3><p>{copy}</p></Reveal>)}</div>
        </section>

        <div className="ot-marquee" aria-hidden="true"><div>{['Connect', 'Discover', 'Review', 'Act', 'Connect', 'Discover', 'Review', 'Act'].map((word, index) => <span key={`${word}-${index}`}>{word}<b>→</b></span>)}</div></div>

        <section className="ot-process ot-light ot-light-grid" id="process" aria-labelledby="process-title">
          <div className="ot-process-intro"><Reveal as="h2" id="process-title">How It Works. <span>From Minimized Signals To Clear Decisions.</span></Reveal><p>Connect a supported provider, process bounded metadata, and inspect the derived results. No message bodies are needed for the current discovery pipeline.</p></div>
          <div className="ot-process-stage">
            <div className="ot-process-list">{processSteps.map(([number, title, copy], index) => <button className={processIndex === index ? 'is-active' : ''} key={number} onClick={() => setProcessIndex(index)} type="button"><span>{number}</span><strong>{title}</strong><small>{copy}</small></button>)}</div>
            <div className="ot-process-visual"><InstrumentSurface index={processIndex} mode="process" /><div className="ot-process-caption" key={processIndex}><span>{processSteps[processIndex][0]}</span><strong>{processSteps[processIndex][1]}</strong><small>{processSteps[processIndex][2]}</small></div><div className="ot-checker" aria-hidden="true" /></div>
          </div>
        </section>

        <section className="ot-capabilities ot-dark-grid" id="capabilities" aria-labelledby="capabilities-title">
          <div className="ot-capability-heading"><p className="ot-label">Explore the workspace</p><h2 id="capabilities-title">Capabilities &amp; provider surfaces</h2></div>
          <div className="ot-capability-layout">
            <div className="ot-capability-tabs" role="tablist" aria-label="OwnTrace capabilities">{capabilities.map(([title], index) => <button aria-controls="capability-panel" aria-selected={capabilityIndex === index} className={capabilityIndex === index ? 'is-active' : ''} id={`capability-tab-${index}`} key={title} onClick={() => setCapabilityIndex(index)} role="tab" type="button">{title}</button>)}</div>
            <Reveal aria-labelledby={`capability-tab-${capabilityIndex}`} className="ot-capability-card" id="capability-panel" role="tabpanel"><CapabilityInstrument index={capabilityIndex} /><div className="ot-capability-content" key={capabilityIndex}><span>{String(capabilityIndex + 1).padStart(2, '0')}</span><h3>{capabilities[capabilityIndex][0]}</h3><p>{capabilities[capabilityIndex][1]}</p><BracketLink to="/register">Open OwnTrace</BracketLink></div></Reveal>
          </div>
        </section>

        <section className="ot-results ot-light" aria-labelledby="results-title">
          <p className="ot-label">Illustrative view</p><Reveal as="h2" id="results-title">One workspace for the evidence that usually disappears between products.</Reveal>
          <div className="ot-result-grid">{[['186', 'accounts organized'], ['12', 'subscription signals'], ['7', 'verified breaches'], ['9', 'actions to review']].map(([value, label], index) => <Reveal as="article" delay={index * 60} key={label}><strong>{value}</strong><p>{label}</p><small>Sample data</small></Reveal>)}</div>
        </section>

        <section className="ot-use-cases ot-light ot-light-grid" aria-labelledby="use-cases-title">
          <Reveal as="h2" id="use-cases-title">Where OwnTrace Makes Your Digital Footprint Easier To Act On.</Reveal>
          <div className="ot-use-case-list">{useCases.map(([number, title, copy]) => <Link key={number} to="/register"><span>{number}</span><h3>{title}</h3><p>{copy}</p><b>[ Review → ]</b></Link>)}</div>
        </section>

        <section className="ot-proof ot-light" aria-labelledby="proof-title">
          <p className="ot-label">Product principle</p><Reveal as="h2" id="proof-title">“Show the evidence. Bound the claim. Keep the user in control.”</Reveal><div className="ot-proof-meta"><span>OwnTrace product standard</span><span>Privacy-first by construction</span></div><BracketLink to="/privacy-policy">Read our privacy approach</BracketLink>
        </section>

        <section className="ot-workflows ot-light" aria-labelledby="workflows-title">
          <div className="ot-workflow-heading"><p className="ot-label">Focused workflows</p><Reveal as="h2" id="workflows-title">One evidence layer. Three ways to regain control.</Reveal></div>
          <div className="ot-workflow-grid">
            {[['Account hygiene', 'Review old and dormant account evidence without turning suggestions into automatic actions.', '＋'], ['Subscription clarity', 'Bring payment and renewal signals together while keeping estimates clearly labelled.', '×'], ['Breach response', 'Check verified findings, separate inbox alerts, and prioritize the next review.', '‹›']].map(([title, copy, mark], index) => <Reveal as="article" delay={index * 70} key={title}><span>{String(index + 1).padStart(2, '0')}</span><b aria-hidden="true">{mark}</b><h3>{title}</h3><p>{copy}</p><BracketLink to="/register">Open workflow</BracketLink></Reveal>)}
          </div>
        </section>

        <section className="ot-closing ot-dark-grid" aria-labelledby="closing-title">
          <Reveal><p className="ot-label">Evidence over assumptions</p><h2 id="closing-title">Private by default. Explainable by design.</h2><p>OwnTrace minimizes provider data, keeps derived records user-scoped, and exposes uncertainty wherever the evidence is incomplete.</p><BracketLink to="/privacy-policy">Review the privacy model</BracketLink></Reveal>
          <div className="ot-closing-raster" aria-hidden="true">{Array.from({ length: 96 }, (_, index) => <i key={index} />)}</div>
        </section>

        <section className="ot-final-cta" aria-labelledby="cta-title"><div className="ot-cta-pixels" aria-hidden="true" /><Reveal><p className="ot-label">Start with your own data</p><h2 id="cta-title">Bring your digital footprint into focus.</h2><BracketLink to="/register">Create your account</BracketLink></Reveal></section>
      </main>

      <footer className="ot-footer">
        <div className="ot-footer-directory">
          <section className="ot-footer-brand" aria-label="OwnTrace account links"><div className="ot-footer-logo"><span className="ot-logo-mark" aria-hidden="true">✣</span><span>OwnTrace</span></div><BracketLink to="/register">Get started</BracketLink><BracketLink to="/login">Sign in</BracketLink></section>
          {footerGroups.map(([label, links]) => <section className="ot-footer-group" key={label}><p className="ot-label">{label}</p>{links.map(([text, to]) => <FooterLink to={to} key={text}>{text}</FooterLink>)}</section>)}
        </div>
        <div className="ot-footer-signature" aria-hidden="true">OwnTrace</div>
        <div className="ot-footer-bottom"><div><Link to="/terms">Terms of service</Link><Link to="/privacy-policy">Privacy policy</Link><a href="#main-content">Back to top ↑</a></div><span>© 2026 OwnTrace. Early development.</span></div>
      </footer>
      <div className="ot-global-counter" aria-live="off"><span aria-hidden="true">◎</span> Observed signals: {signalCount.toLocaleString('en-US')}</div>
    </div>
  )
}

export default LandingPage
