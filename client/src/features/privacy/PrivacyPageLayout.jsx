import PrivacyWorkspace from './PrivacyWorkspace.jsx'
import './privacy-pages.css'

function PrivacyPageLayout({ children, description, eyebrow, title }) {
  return (
    <PrivacyWorkspace title={eyebrow}>
      <main className="privacy-page">
        <div className="privacy-page-shell">
          <header className="privacy-page-intro">
            <p>{eyebrow}</p>
            <h1>{title}</h1>
            <span>{description}</span>
          </header>
          {children}
        </div>
      </main>
    </PrivacyWorkspace>
  )
}

function LoadingState({ children = 'Loading your privacy data…' }) {
  return <div className="privacy-state" role="status"><span className="privacy-spinner" aria-hidden="true" />{children}</div>
}

function EmptyState({ children, title }) {
  return <div className="privacy-state is-empty"><strong>{title}</strong><p>{children}</p></div>
}

function ErrorState({ children }) {
  return <p className="privacy-error" role="alert">{children}</p>
}

function Pagination({ label, onPageChange, pagination }) {
  if (!pagination || pagination.pages <= 1) return null
  return (
    <nav aria-label={label} className="privacy-pagination">
      <button disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)} type="button">Previous</button>
      <span>Page {pagination.page} of {pagination.pages}</span>
      <button disabled={pagination.page >= pagination.pages} onClick={() => onPageChange(pagination.page + 1)} type="button">Next</button>
    </nav>
  )
}

function StatusPill({ children, tone = 'neutral' }) {
  return <span className={`privacy-status is-${tone}`}>{children}</span>
}

export { EmptyState, ErrorState, LoadingState, Pagination, StatusPill }
export default PrivacyPageLayout
