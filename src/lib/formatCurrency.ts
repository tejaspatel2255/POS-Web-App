// File Path: d:/Projects/Web/Universal POS/src/lib/formatCurrency.ts

/**
 * Formats a numeric amount with a currency symbol.
 * Example: formatCurrency(1234, '₹') => "₹1,234.00"
 */
export function formatCurrency(amount: number, symbol: string = '₹'): string {
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  
  return `${symbol}${formattedAmount}`;
}
