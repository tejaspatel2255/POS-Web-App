// File Path: d:/Projects/Web/Universal POS/src/App.tsx

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { lazy, Suspense } from 'react'

// Layout
import AppShell from './components/layout/AppShell'
import { ProtectedRoute } from './components/layout/ProtectedRoute'

// Lazy-loaded Pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'))
const CreateStorePage = lazy(() => import('./pages/auth/CreateStorePage'))
const SelectStorePage = lazy(() => import('./pages/auth/SelectStorePage'))

const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'))
const Billing = lazy(() => import('./pages/billing/BillingScreen'))
const MenuManagement = lazy(() => import('./pages/menu/MenuManagement'))
const OrderHistory = lazy(() => import('./pages/orders/OrderHistory'))
const Reports = lazy(() => import('./pages/reports/Reports'))
const Settings = lazy(() => import('./pages/settings/Settings'))

const queryClient = new QueryClient()

const PageLoader = () => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
    <div className="relative flex flex-col items-center gap-4">
      <img src="/logo.png" alt="Universal POS Logo" className="w-16 h-16 object-contain animate-pulse" />
      <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-xs font-bold text-muted-foreground tracking-wider uppercase">Loading Workspace...</p>
    </div>
  </div>
)

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Suspense fallback={<PageLoader />}>
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
          </Suspense>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}
