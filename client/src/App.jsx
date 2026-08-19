import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import AccountActionsPage from './features/account-actions/AccountActionsPage.jsx'
import AccountDetailPage from './features/accounts/AccountDetailPage.jsx'
import AccountsPage from './features/accounts/AccountsPage.jsx'
import LoginPage from './features/auth/LoginPage.jsx'
import ProtectedRoute from './features/auth/ProtectedRoute.jsx'
import PublicOnlyRoute from './features/auth/PublicOnlyRoute.jsx'
import RegisterPage from './features/auth/RegisterPage.jsx'
import DashboardPlaceholder from './features/dashboard/DashboardPlaceholder.jsx'
import GmailConnectionPage from './features/google/GmailConnectionPage.jsx'
import IdentityPage from './features/identity/IdentityPage.jsx'
import LandingPage from './features/landing/LandingPage.jsx'
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
        element={<ProtectedRoute><GmailConnectionPage /></ProtectedRoute>}
      />
      <Route path="/accounts" element={<ProtectedRoute><AccountsPage /></ProtectedRoute>} />
      <Route
        path="/accounts/:id"
        element={<ProtectedRoute><AccountDetailPage /></ProtectedRoute>}
      />
      <Route path="/identity" element={<ProtectedRoute><IdentityPage /></ProtectedRoute>} />
      <Route
        path="/account-actions"
        element={<ProtectedRoute><AccountActionsPage /></ProtectedRoute>}
      />
      <Route path="/dashboard" element={<DashboardPlaceholder />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
