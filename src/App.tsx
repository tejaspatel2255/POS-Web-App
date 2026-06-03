// File Path: d:/Projects/Web/Universal POS/src/App.tsx

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'

// Layout
import AppShell from './components/layout/AppShell'
import { ProtectedRoute } from './components/layout/ProtectedRoute'

// Pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import CreateStorePage from './pages/auth/CreateStorePage'
import SelectStorePage from './pages/auth/SelectStorePage'

import Dashboard from './pages/dashboard/Dashboard'
import Billing from './pages/billing/BillingScreen'
import MenuManagement from './pages/menu/MenuManagement'
import OrderHistory from './pages/orders/OrderHistory'
import Reports from './pages/reports/Reports'
import Settings from './pages/settings/Settings'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Authentication Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Store Selection and Creation (Required: Logged In, Allowed: No Active Store) */}
            <Route 
              path="/select-store" 
              element={
                <ProtectedRoute>
                  <SelectStorePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/create-store" 
              element={
                <ProtectedRoute>
                  <CreateStorePage />
                </ProtectedRoute>
              } 
            />

            {/* Protected Workspace POS Routes */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="billing" element={<Billing />} />
              <Route path="history" element={<OrderHistory />} />
              
              {/* Admin & Owner level routes */}
              <Route 
                path="menu" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <MenuManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="reports" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Reports />
                  </ProtectedRoute>
                } 
              />
              
              {/* Owner only routes */}
              <Route 
                path="settings" 
                element={
                  <ProtectedRoute requiredRole="owner">
                    <Settings />
                  </ProtectedRoute>
                } 
              />
            </Route>

            {/* Fallback Catch-all Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}
