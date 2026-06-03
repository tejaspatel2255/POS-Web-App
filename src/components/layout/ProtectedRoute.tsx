// File Path: d:/Projects/Web/Universal POS/src/components/layout/ProtectedRoute.tsx

import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import type { UserRole } from '../../types'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, activeStore, activeMember, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // 1. If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // 2. Determine if the user is currently on store setup pages
  const pathname = window.location.pathname
  const isSetupPage = pathname === '/select-store' || pathname === '/create-store'

  // If the user has no active store selected, and is trying to access a dashboard/POS screen,
  // redirect them to the store selection flow.
  if (!activeStore && !isSetupPage) {
    return <Navigate to="/select-store" replace />
  }

  // 3. Check role authorization if specified
  if (requiredRole && activeMember) {
    const roleHierarchy: Record<UserRole, number> = {
      owner: 3,
      admin: 2,
      cashier: 1
    }

    const userRoleValue = roleHierarchy[activeMember.role] || 0
    const requiredRoleValue = roleHierarchy[requiredRole] || 0

    if (userRoleValue < requiredRoleValue) {
      alert(`Access denied. You need "${requiredRole}" privileges to access this section.`)
      return <Navigate to="/dashboard" replace />
    }
  }

  return <>{children}</>
}
