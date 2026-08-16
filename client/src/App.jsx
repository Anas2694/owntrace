import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import DashboardPlaceholder from './features/dashboard/DashboardPlaceholder.jsx'
import LandingPage from './features/landing/LandingPage.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<DashboardPlaceholder />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
