// src/components/layout/ProtectedRoute.tsx
import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export default function ProtectedRoute() {
  const { user, activeStore } = useAuthStore()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!activeStore) {
    return <Navigate to="/select-store" replace />
  }

  return <Outlet />
}
