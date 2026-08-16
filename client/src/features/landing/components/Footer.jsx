function Footer() {
  return (
    <footer className="landing-footer">
      <div className="landing-container footer-main">
        <div className="footer-brand-column">
          <a className="landing-brand" href="#top" aria-label="OwnTrace home">
            <span className="landing-brand-mark" aria-hidden="true"><span /></span>
            <span>OwnTrace</span>
          </a>
          <p>Own your digital footprint.</p>
          <span className="footer-status"><span aria-hidden="true" /> Status: Early development</span>
        </div>
        <nav className="footer-links" aria-label="Footer navigation">
          <div>
            <h2>Explore</h2>
            <a href="#product">Product</a>
            <a href="#how-it-works">How it works</a>
            <a href="#privacy">Privacy</a>
          </div>
          <div>
            <h2>Project</h2>
            <a href="https://github.com/Anas2694/owntrace">GitHub</a>
            <a href="#development-status">Development status</a>
          </div>
        </nav>
      </div>
      <div className="landing-container footer-bottom">
        <p>© {new Date().getFullYear()} OwnTrace. Built openly by Anas and Raphael.</p>
        <p>Public project · No private contact details published</p>
      </div>
    </footer>
  )
}

export default Footer
