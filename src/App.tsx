import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import FilteredDashboard from './pages/FilteredDashboard'
import ApiTokens from './pages/ApiTokens'
import ExtensionGuide from './pages/ExtensionGuide'
import Settings from './pages/Settings'
import MyLinks from './pages/MyLinks'
import SystemOverview from './pages/SystemOverview'
import ServiceManage from './pages/ServiceManage'
import CalendarPage from './pages/CalendarPage'

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
        <Route path="/my-links" element={<MyLinks />} />
        <Route path="/tokens" element={<ApiTokens />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/system-overview" element={<SystemOverview />} />
        <Route path="/system/services" element={<ServiceManage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/chrome-ext" element={<ExtensionGuide />} />
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
