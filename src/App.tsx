// src/App.tsx
import { useState, useEffect, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { supabase } from './lib/supabase'
import type { Store, StoreMember } from './types'
import FullPageSpinner from './components/shared/FullPageSpinner.tsx'
import { ToastContainer } from './components/shared/Toast'


// Lazy-loaded routes
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'))
const CreateStorePage = lazy(() => import('./pages/auth/CreateStorePage'))
const SelectStorePage = lazy(() => import('./pages/auth/SelectStorePage'))
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'))
const BillingScreen = lazy(() => import('./pages/billing/BillingScreen'))
const OrderHistory = lazy(() => import('./pages/orders/OrderHistory'))
const MenuManagement = lazy(() => import('./pages/menu/MenuManagement'))
const Reports = lazy(() => import('./pages/reports/Reports'))
const Settings = lazy(() => import('./pages/settings/Settings'))

// Layout / Route wrappers
const ProtectedRoute = lazy(() => import('./components/layout/ProtectedRoute'))
const AppShell = lazy(() => import('./components/layout/AppShell'))

export default function App() {
  const [authReady, setAuthReady] = useState(false)
  const { user, activeStore, setUser, setActiveStore, setActiveMember, logout } = useAuthStore()

  useEffect(() => {
    // Hard 5-second timeout so spinner NEVER gets stuck forever
    const timer = setTimeout(() => setAuthReady(true), 5000)

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        // If no activeStore in zustand yet, fetch it
        if (!activeStore) {
          const { data: memberships } = await supabase
            .from('store_members')
            .select('*, stores(*)')
            .eq('user_id', session.user.id)
            .eq('is_active', true) as any
            
          if (memberships?.length === 1) {
            setActiveStore(memberships[0].stores as Store)
            setActiveMember(memberships[0] as StoreMember)
          }
        }
      } else {
        logout()
      }
    }).catch(() => logout())
     .finally(() => {
       clearTimeout(timer)
       setAuthReady(true)
     })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_OUT') logout()
      }
    )
    return () => {
      subscription.unsubscribe()
      clearTimeout(timer)
    }
  }, [])

  if (!authReady) return <FullPageSpinner />

  return (
    <>
      <ToastContainer />
      <BrowserRouter>
        <Suspense fallback={<FullPageSpinner />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/create-store" element={<CreateStorePage />} />
            <Route path="/select-store" element={<SelectStorePage />} />
            <Route path="/" element={
              user ? (activeStore ? <Navigate to="/dashboard" replace /> : <Navigate to="/select-store" replace />)
                   : <Navigate to="/login" replace />
            } />
            
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/billing" element={<BillingScreen />} />
                <Route path="/orders" element={<OrderHistory />} />
                <Route path="/menu" element={<MenuManagement />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </>
  )
}
