import { Link } from 'react-router-dom'

function AuthLayout({ children, description, eyebrow, title }) {
  return (
    <div className="auth-page">
      <a className="skip-link" href="#auth-form">Skip to form</a>
      <header className="auth-header">
        <Link className="auth-brand" to="/" aria-label="OwnTrace home">
          <span className="auth-brand-mark" aria-hidden="true"><span /></span>
          OwnTrace
        </Link>
        <Link className="auth-back-link" to="/">Back to product</Link>
      </header>

      <main className="auth-main">
        <section className="auth-introduction" aria-labelledby="auth-title">
          <p className="auth-eyebrow">{eyebrow}</p>
          <h1 id="auth-title">{title}</h1>
          <p>{description}</p>
          <ul className="auth-principles" aria-label="Session protections">
            <li><span aria-hidden="true">01</span>Session stored in an httpOnly cookie</li>
            <li><span aria-hidden="true">02</span>Password protected with a one-way hash</li>
            <li><span aria-hidden="true">03</span>No authentication token in local storage</li>
          </ul>
        </section>

        <section id="auth-form" className="auth-card" aria-label={`${eyebrow} form`}>
          {children}
        </section>
      </main>
    </div>
  )
}

export default AuthLayout
