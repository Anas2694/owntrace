const previewStats = [
  { label: 'Accounts', value: '186' },
  { label: 'Dormant', value: '47' },
  { label: 'Subscriptions', value: '12' },
  { label: 'Breaches', value: '7' },
  { label: 'Connected apps', value: '31' },
  { label: 'Actions', value: '9' },
]

const previewActions = [
  { label: 'Review old Google connection', level: 'Medium' },
  { label: 'Secure breached account', level: 'High' },
  { label: 'Review unused subscription', level: 'Low' },
]

function ProductPreview() {
  return (
    <div
      id="product"
      className="product-preview-wrap"
    >
      <div className="preview-orbit preview-orbit-one" aria-hidden="true" />
      <div className="preview-orbit preview-orbit-two" aria-hidden="true" />
      <article className="product-preview" aria-labelledby="product-preview-title">
        <header className="preview-header">
          <div>
            <p className="preview-kicker">Illustrative preview</p>
            <h2 id="product-preview-title" className="preview-greeting">Your privacy overview</h2>
          </div>
          <span className="preview-demo-label">Sample data</span>
        </header>

        <div className="preview-overview">
          <div className="health-score-card">
            <div className="health-score-ring" aria-label="Sample privacy health score: 72 out of 100">
              <div>
                <strong>72</strong>
                <span>/100</span>
              </div>
            </div>
            <div>
              <p>Privacy Health</p>
              <span>Illustrative score</span>
            </div>
          </div>

          <dl className="preview-stats">
            {previewStats.map((stat) => (
              <div key={stat.label}>
                <dt>{stat.label}</dt>
                <dd>{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="preview-actions-panel">
          <div className="preview-panel-heading">
            <h3>Recommended actions</h3>
            <span>3 of 9 shown</span>
          </div>
          <ul>
            {previewActions.map((action) => (
              <li key={action.label}>
                <span className={`action-indicator level-${action.level.toLowerCase()}`} aria-hidden="true" />
                <span>{action.label}</span>
                <small>{action.level}</small>
              </li>
            ))}
          </ul>
        </div>

        <footer className="preview-footer">
          <span className="preview-live-dot" aria-hidden="true" />
          Concept UI — not a live account scan
        </footer>
      </article>
    </div>
  )
}

export default ProductPreview
