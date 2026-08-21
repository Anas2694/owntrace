import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import AccountActionsPage from './features/account-actions/AccountActionsPage.jsx'
import AccountDetailPage from './features/accounts/AccountDetailPage.jsx'
import AccountsPage from './features/accounts/AccountsPage.jsx'
import LoginPage from './features/auth/LoginPage.jsx'
import ProtectedRoute from './features/auth/ProtectedRoute.jsx'
import PublicOnlyRoute from './features/auth/PublicOnlyRoute.jsx'
import RegisterPage from './features/auth/RegisterPage.jsx'
import GmailConnectionPage from './features/google/GmailConnectionPage.jsx'
import IdentityPage from './features/identity/IdentityPage.jsx'
import LandingPage from './features/landing/LandingPage.jsx'
import OnboardingPage from './features/onboarding/OnboardingPage.jsx'
import BreachesPage from './features/privacy/BreachesPage.jsx'
import DashboardPage from './features/privacy/DashboardPage.jsx'
import ExposuresPage from './features/privacy/ExposuresPage.jsx'
import NotificationsPage from './features/privacy/NotificationsPage.jsx'
import PrivacyHealthPage from './features/privacy/PrivacyHealthPage.jsx'
import PrivacyInboxPage from './features/privacy/PrivacyInboxPage.jsx'
import PrivacyRequestsPage from './features/privacy/PrivacyRequestsPage.jsx'
import SubscriptionsPage from './features/privacy/SubscriptionsPage.jsx'
import AccountSettingsPage from './features/settings/AccountSettingsPage.jsx'

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
      <Route path="/settings" element={<ProtectedRoute><AccountSettingsPage /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/subscriptions" element={<ProtectedRoute><SubscriptionsPage /></ProtectedRoute>} />
      <Route path="/breaches" element={<ProtectedRoute><BreachesPage /></ProtectedRoute>} />
      <Route path="/exposures" element={<ProtectedRoute><ExposuresPage /></ProtectedRoute>} />
      <Route path="/privacy-health" element={<ProtectedRoute><PrivacyHealthPage /></ProtectedRoute>} />
      <Route path="/privacy-inbox" element={<ProtectedRoute><PrivacyInboxPage /></ProtectedRoute>} />
      <Route path="/privacy-requests" element={<ProtectedRoute><PrivacyRequestsPage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
