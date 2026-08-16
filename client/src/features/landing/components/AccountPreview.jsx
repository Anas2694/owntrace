function AccountPreview() {
  return (
    <section className="landing-section evidence-section" aria-labelledby="evidence-title">
      <div className="landing-container split-section evidence-layout">
        <div className="section-copy">
          <p className="section-kicker">Evidence, not guesswork</p>
          <h2 id="evidence-title">See why an account was discovered.</h2>
          <p>
            Instead of simply saying an account exists, OwnTrace aims to show the signals behind a
            finding—when it first appeared, how recently it was seen, and how confident the match is.
          </p>
          <div className="evidence-note">
            <span aria-hidden="true">i</span>
            Confidence is context for review, not a claim of absolute certainty.
          </div>
        </div>

        <article className="account-preview-card" aria-labelledby="sample-account-title">
          <header>
            <div className="sample-service-mark" aria-hidden="true">C</div>
            <div>
              <span className="sample-label">Example account preview</span>
              <h3 id="sample-account-title">Canva</h3>
            </div>
            <span className="sample-status">Possibly dormant</span>
          </header>

          <dl className="account-evidence-grid">
            <div>
              <dt>First evidence</dt>
              <dd>2021</dd>
            </div>
            <div>
              <dt>Last evidence</dt>
              <dd>2024</dd>
            </div>
            <div>
              <dt>Evidence</dt>
              <dd>17 signals</dd>
            </div>
            <div>
              <dt>Confidence</dt>
              <dd className="confidence-value">96%</dd>
            </div>
          </dl>

          <div className="confidence-track" aria-hidden="true">
            <span />
          </div>

          <footer>
            <div>
              <span>Recommendation</span>
              <strong>Review account</strong>
            </div>
            <span className="sample-action">Preview only</span>
          </footer>
        </article>
      </div>
    </section>
  )
}

export default AccountPreview
