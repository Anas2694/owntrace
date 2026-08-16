import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import LoginPage from './features/auth/LoginPage.jsx'
import ProtectedRoute from './features/auth/ProtectedRoute.jsx'
import PublicOnlyRoute from './features/auth/PublicOnlyRoute.jsx'
import RegisterPage from './features/auth/RegisterPage.jsx'
import DashboardPlaceholder from './features/dashboard/DashboardPlaceholder.jsx'
import LandingPage from './features/landing/LandingPage.jsx'
import OnboardingPlaceholder from './features/onboarding/OnboardingPlaceholder.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
      <Route
        path="/onboarding"
        element={<ProtectedRoute><OnboardingPlaceholder /></ProtectedRoute>}
      />
      <Route path="/dashboard" element={<DashboardPlaceholder />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
