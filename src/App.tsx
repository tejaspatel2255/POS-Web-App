import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './contexts/AuthContext'

// Layout
import AppLayout from './components/layout/AppLayout'

// Pages
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Billing from './pages/Billing'
import MenuManagement from './pages/MenuManagement'
import OrderHistory from './pages/OrderHistory'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

const queryClient = new QueryClient()

function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) {
  const { user, profile, loading } = useAuth()

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background text-primary">Loading...</div>
  if (!user) return <Navigate to="/login" />
  
  if (requireAdmin && profile?.role !== 'admin') {
    return <Navigate to="/" />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Auth />} />
            
            <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="billing" element={<Billing />} />
              <Route path="history" element={<OrderHistory />} />
              
              {/* Admin only routes */}
              <Route path="menu" element={<ProtectedRoute requireAdmin><MenuManagement /></ProtectedRoute>} />
              <Route path="reports" element={<ProtectedRoute requireAdmin><Reports /></ProtectedRoute>} />
              <Route path="settings" element={<ProtectedRoute requireAdmin><Settings /></ProtectedRoute>} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}
