const sampleActions = [
  { level: 'High', title: 'Secure breached account', detail: 'Known exposure detected' },
  { level: 'High', title: 'Review old connected application', detail: 'Access may no longer be needed' },
  { level: 'Medium', title: 'Review unused subscription', detail: 'No recent activity signal' },
  { level: 'Low', title: 'Consider deleting dormant account', detail: 'Last evidence over three years ago' },
]

function ActionPreview() {
  return (
    <section className="landing-section action-first-section" aria-labelledby="action-first-title">
      <div className="landing-container split-section action-first-layout">
        <div className="section-copy action-copy">
          <p className="section-kicker">Action first</p>
          <h2 id="action-first-title">Know what to do next.</h2>
          <p>
            A privacy dashboard should not leave people with hundreds of warnings. OwnTrace aims
            to prioritize supported findings and explain the next useful step—without hiding the
            evidence behind the recommendation.
          </p>
          <ul className="action-benefits">
            <li><strong>Priority</strong><span>What deserves attention first</span></li>
            <li><strong>Context</strong><span>Why the action is being suggested</span></li>
            <li><strong>Control</strong><span>The user decides what happens next</span></li>
          </ul>
        </div>

        <div className="action-inbox-preview">
          <header>
            <div>
              <span className="sample-label">Illustrative action preview</span>
              <h3>9 actions need your attention</h3>
            </div>
            <span className="inbox-count">9</span>
          </header>
          <ul>
            {sampleActions.map((action) => (
              <li key={action.title}>
                <span className={`priority-pill priority-${action.level.toLowerCase()}`}>
                  {action.level}
                </span>
                <div>
                  <strong>{action.title}</strong>
                  <span>{action.detail}</span>
                </div>
                <span className="row-arrow" aria-hidden="true">→</span>
              </li>
            ))}
          </ul>
          <p>Sample data — this is not the product&apos;s Privacy Inbox.</p>
        </div>
      </div>
    </section>
  )
}

export default ActionPreview
