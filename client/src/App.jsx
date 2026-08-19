import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import LoginPage from './features/auth/LoginPage.jsx'
import ProtectedRoute from './features/auth/ProtectedRoute.jsx'
import PublicOnlyRoute from './features/auth/PublicOnlyRoute.jsx'
import RegisterPage from './features/auth/RegisterPage.jsx'
import DashboardPage from './features/dashboard/DashboardPage.jsx'
import LandingPage from './features/landing/LandingPage.jsx'
import GmailConnectionHandoff from './features/onboarding/GmailConnectionHandoff.jsx'
import OnboardingPage from './features/onboarding/OnboardingPage.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
      <Route
        path="/onboarding"
        element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>}
      />
      <Route
        path="/connect/gmail"
        element={<ProtectedRoute><GmailConnectionHandoff /></ProtectedRoute>}
      />
      <Route
        path="/dashboard"
        element={<ProtectedRoute><DashboardPage variant="sentry" /></ProtectedRoute>}
      />
      <Route
        path="/dashboard-preview-sentry"
        element={<DashboardPage previewUser={{ name: 'Megh Mayur', email: 'preview@owntrace.local' }} variant="sentry" />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
