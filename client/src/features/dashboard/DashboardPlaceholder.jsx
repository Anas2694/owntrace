import { Link } from 'react-router-dom'

function DashboardPlaceholder() {
  return (
    <div className="site-shell">
      <main className="placeholder-main">
        <section className="placeholder-card" aria-labelledby="dashboard-title">
          <p className="eyebrow">Shared routing placeholder</p>
          <h1 id="dashboard-title">Dashboard — Raphael-owned feature</h1>
          <p>
            This route is intentionally limited to a placeholder. Dashboard product work remains
            with Raphael and is not part of the project-foundation scope.
          </p>
          <Link className="secondary-link" to="/">
            Back to landing page
          </Link>
        </section>
      </main>
    </div>
  )
}

export default DashboardPlaceholder
