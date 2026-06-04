// src/lib/permissions.ts
import { UserRole } from '../types'

export const canManageMenu = (role: UserRole): boolean => ['owner', 'admin'].includes(role)
export const canViewReports = (role: UserRole): boolean => ['owner', 'admin'].includes(role)
export const canManageStaff = (role: UserRole): boolean => role === 'owner'
export const canViewAllOrders = (role: UserRole): boolean => ['owner', 'admin'].includes(role)
