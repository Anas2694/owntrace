import AccountPreview from './components/AccountPreview.jsx'
import ActionPreview from './components/ActionPreview.jsx'
import FeaturesSection from './components/FeaturesSection.jsx'
import FinalCTA from './components/FinalCTA.jsx'
import Footer from './components/Footer.jsx'
import Hero from './components/Hero.jsx'
import HowItWorks from './components/HowItWorks.jsx'
import Navbar from './components/Navbar.jsx'
import PrivacySection from './components/PrivacySection.jsx'
import ProblemSection from './components/ProblemSection.jsx'
import './landing.css'

function LandingPage() {
  return (
    <div className="landing-page">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <Navbar />
      <main id="main-content">
        <Hero />
        <ProblemSection />
        <FeaturesSection />
        <HowItWorks />
        <PrivacySection />
        <AccountPreview />
        <ActionPreview />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}

export default LandingPage
