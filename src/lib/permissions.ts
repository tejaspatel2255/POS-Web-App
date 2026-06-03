// File Path: d:/Projects/Web/Universal POS/src/lib/permissions.ts

import type { UserRole } from '../types';

/**
 * Checks if a user role is allowed to manage the menu (categories/products).
 * Allowed: owner, admin
 */
export function canManageMenu(role: UserRole | null | undefined): boolean {
  return role === 'owner' || role === 'admin';
}

/**
 * Checks if a user role is allowed to view reports.
 * Allowed: owner, admin
 */
export function canViewReports(role: UserRole | null | undefined): boolean {
  return role === 'owner' || role === 'admin';
}

/**
 * Checks if a user role is allowed to manage staff members.
 * Allowed: owner only
 */
export function canManageStaff(role: UserRole | null | undefined): boolean {
  return role === 'owner';
}

/**
 * Checks if a user role is allowed to view all orders.
 * Allowed: owner, admin (cashiers only view their own)
 */
export function canViewAllOrders(role: UserRole | null | undefined): boolean {
  return role === 'owner' || role === 'admin';
}
