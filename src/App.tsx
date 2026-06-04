// File Path: d:/Projects/Web/Universal POS/src/App.tsx

import React, { Suspense, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { startSyncEngine } from './lib/syncEngine'
import { useAuthStore } from './store/authStore'
import { supabase } from './lib/supabaseClient'

// Layout
import AppShell from './components/layout/AppShell'
import { ProtectedRoute } from './components/layout/ProtectedRoute'

// Lazy loaded page components
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage'))
const CreateStorePage = React.lazy(() => import('./pages/auth/CreateStorePage'))
const SelectStorePage = React.lazy(() => import('./pages/auth/SelectStorePage'))

const Dashboard = React.lazy(() => import('./pages/dashboard/Dashboard'))
const Billing = React.lazy(() => import('./pages/billing/BillingScreen'))
const MenuManagement = React.lazy(() => import('./pages/menu/MenuManagement'))
const OrderHistory = React.lazy(() => import('./pages/orders/OrderHistory'))
const Reports = React.lazy(() => import('./pages/reports/Reports'))
const Settings = React.lazy(() => import('./pages/settings/Settings'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
})

export default function App() {
  const { logout } = useAuthStore()

  useEffect(() => {
    const cleanup = startSyncEngine()

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        logout()
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_OUT') {
          logout()
        }
      }
    )

    return () => {
      cleanup()
      subscription.unsubscribe()
    }
  }, [logout])

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Suspense fallback={
            <div className="flex items-center justify-center h-screen">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
            </div>
          }>
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
