import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/useAuthStore';
import { useLayoutStore } from './store/useLayoutStore';
import { supabase } from './utils/supabaseClient';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PosTerminal from './pages/PosTerminal';
import OrdersLog from './pages/OrdersLog';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';

// Protected Route Wrapper Layout Component
function MainLayout() {
  const { user } = useAuthStore();
  const { sidebarOpen, setSidebarOpen } = useLayoutStore();
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Backdrop overlay for mobile drawer */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-30 lg:hidden cursor-pointer"
        />
      )}
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();

    // Set up auth state change listener to synchronize with Zustand
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session) {
          useAuthStore.setState({ session });
          const currentUser = useAuthStore.getState().user;
          if (!currentUser || currentUser.id !== session.user.id) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*, outlet_id(*)')
              .eq('id', session.user.id)
              .maybeSingle();
            if (profileData) {
              useAuthStore.setState({ user: profileData });
            }
          }
        }
      } else if (event === 'SIGNED_OUT') {
        useAuthStore.setState({ user: null, session: null });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 space-y-4">
        <svg className="animate-spin h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-sm font-semibold text-slate-400">Verifying session credentials...</span>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {/* Toast Notification Container */}
      <Toaster
        position="top-right"
        toastOptions={{
          className: '!bg-slate-900 !text-white !border !border-slate-800 !rounded-2xl !px-4 !py-3 !text-sm',
          duration: 3500,
        }}
      />

      <Routes>
        {/* Public auth route */}
        <Route path="/login" element={<Login />} />

        {/* Scoped protected workspace routes */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pos" element={<PosTerminal />} />
          <Route path="/orders" element={<OrdersLog />} />
          <Route path="/products" element={<Products />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Fallbacks */}
        <Route
          path="*"
          element={
            user ? (
              user.role === 'cashier' ? (
                <Navigate to="/pos" replace />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
