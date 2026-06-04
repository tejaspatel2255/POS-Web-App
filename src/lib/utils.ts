// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string, symbol: string = '₹'): string {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(numericAmount)) return `${symbol}0.00`
  
  // Format with thousands separator and 2 decimal places
  const formattedValue = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount)
  
  return `${symbol}${formattedValue}`
}

export function generateOrderNumber(): string {
  // Returns timestamp-based string, e.g. "1718012345" or similar
  const now = Date.now()
  return now.toString()
}
