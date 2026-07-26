import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import FilteredDashboard from './pages/FilteredDashboard'
import ExtensionGuide from './pages/ExtensionGuide'
import SettingsAccount from './pages/SettingsAccount'
import SettingsData from './pages/SettingsData'
import SettingsPlugin from './pages/SettingsPlugin'
import SettingsOther from './pages/SettingsOther'
import Moment from './pages/Moment'
import ClientCerts from './pages/ClientCerts'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/bookmarks/:categoryId" element={<FilteredDashboard />} />
        <Route path="/settings" element={<Navigate to="/settings/account" replace />} />
        <Route path="/settings/account" element={<SettingsAccount />} />
        <Route path="/settings/data" element={<SettingsData />} />
        <Route path="/settings/plugin" element={<SettingsPlugin />} />
        <Route path="/settings/other" element={<SettingsOther />} />
        <Route path="/moments" element={<Moment />} />
        <Route path="/chrome-ext" element={<ExtensionGuide />} />
        <Route path="/settings/certificates" element={<ClientCerts />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
