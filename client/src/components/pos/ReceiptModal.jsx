import { X, Printer, Store } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../ui/Button';

export function ReceiptModal({ isOpen, onClose, onPrint, receipt }) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const cs = receipt.currencySymbol || '₹';
  // Shorten receipt ID — show last 8 chars only, uppercase
  const shortReceiptId = receipt.receiptId ? receipt.receiptId.slice(-8).toUpperCase() : 'UNKNOWN';

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-slate-800">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 
                        border-b border-slate-150 dark:border-slate-850 bg-gradient-to-r 
                        from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-slate-900 no-print">
          <div>
            <h2 className="text-sm font-black text-slate-850 dark:text-slate-100">{t('pos.completed_title') || 'Order Complete'}</h2>
            <p className="text-[10px] font-bold text-slate-400">Receipt #{shortReceiptId}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        {/* Receipt body — scrollable */}
        <div className="px-4 sm:px-6 py-5 max-h-[65vh] overflow-y-auto">

          {/* Receipt card with torn-edge effect */}
          <div className="relative bg-amber-50/25 dark:bg-amber-950/5 rounded-lg border 
                          border-amber-100/50 dark:border-amber-950/20 overflow-hidden receipt-printable">

            {/* Top zigzag edge */}
            <div 
              className="h-3 w-full bg-white dark:bg-slate-900 no-print"
              style={{
                background: `repeating-linear-gradient(
                  -45deg,
                  transparent,
                  transparent 4px,
                  #fff 4px,
                  #fff 8px
                )`,
                maskImage: 'linear-gradient(to bottom, black, transparent)',
              }}
            />
            <div className="h-2 w-full bg-white dark:bg-slate-900 no-print" 
                 style={{
                   maskImage: `repeating-linear-gradient(-45deg, transparent, transparent 4px, black 4px, black 8px)`,
                 }} 
            />

            <div className="px-5 py-6">

              {/* Store header */}
              <div className="text-center mb-5">
                <div className="w-10 h-10 bg-indigo-650 rounded-xl flex items-center 
                                justify-center mx-auto mb-2 text-white">
                  <Store size={18} />
                </div>
                <h3 className="text-base font-black text-slate-850 dark:text-slate-100 tracking-wide">
                  {receipt.storeName}
                </h3>
                <p className="text-xs text-slate-505 mt-0.5">{receipt.storeAddress}</p>
                {receipt.storePhone && (
                  <p className="text-xs text-slate-505">{receipt.storePhone}</p>
                )}
                {receipt.storeGST && (
                  <p className="text-[10px] text-slate-400 mt-1">GSTIN: {receipt.storeGST}</p>
                )}
              </div>

              {/* Meta info row */}
              <div className="flex justify-between items-center text-xs 
                              text-slate-505 mb-4 pb-4 border-b border-dashed 
                              border-slate-200 dark:border-slate-800">
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Receipt</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    #{shortReceiptId}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">{t('reports.date') || 'Date & Time'}</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{receipt.date}</span>
                </div>
              </div>

              {receipt.cashierName && (
                <p className="text-xs text-slate-400 mb-4">
                  {t('pos.served_by') || 'Served by'} <span className="text-slate-650 dark:text-slate-305 font-bold">{receipt.cashierName}</span>
                </p>
              )}

              {/* Items table */}
              <div className="font-mono text-xs">
                <div className="flex justify-between text-[10px] text-slate-400 
                                font-bold uppercase tracking-wider mb-2 pb-2 
                                border-b border-slate-250 dark:border-slate-800">
                  <span>{t('pos.item') || 'Item'}</span>
                  <span>{t('pos.amount') || 'Amount'}</span>
                </div>

                <div className="space-y-2.5">
                  {receipt.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-baseline gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-800 dark:text-slate-200 font-semibold truncate">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {cs}{item.unitPrice.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                      <span className="text-slate-950 dark:text-slate-50 font-bold flex-shrink-0">
                        {cs}{item.lineTotal.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals section */}
              <div className="mt-5 pt-4 border-t border-dashed border-slate-250 dark:border-slate-800
                              space-y-2 text-xs">
                <div className="flex justify-between text-slate-505">
                  <span>{t('pos.subtotal')}</span>
                  <span className="font-mono font-semibold">{cs}{receipt.subtotal.toFixed(2)}</span>
                </div>

                {receipt.discount !== undefined && receipt.discount > 0 && (
                  <div className="flex justify-between text-rose-500 font-semibold">
                    <span>{t('pos.discount')}</span>
                    <span className="font-mono">-{cs}{receipt.discount.toFixed(2)}</span>
                  </div>
                )}

                {receipt.taxAmount !== undefined && receipt.taxAmount > 0 && (
                  <div className="flex justify-between text-slate-505">
                    <span>{receipt.taxLabel || t('pos.tax') || 'Tax'}</span>
                    <span className="font-mono font-semibold">{cs}{receipt.taxAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Grand total — highlighted */}
              <div className="mt-3 pt-3 border-t-2 border-slate-850 dark:border-slate-700
                              flex justify-between items-center">
                <span className="text-xs font-black text-slate-850 dark:text-slate-100 uppercase tracking-wider">
                  {t('pos.total') || 'Total Amount'}
                </span>
                <span className="text-lg font-black text-indigo-650 dark:text-indigo-400 font-mono">
                  {cs}{receipt.total.toFixed(2)}
                </span>
              </div>

              {/* Payment summary */}
              <div className="mt-5 pt-4 border-t border-dashed border-slate-250 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase 
                              tracking-wider mb-2">
                  {t('pos.payment_method')}{receipt.payments.length > 1 ? 's' : ''}
                </p>
                <div className="space-y-1.5">
                  {receipt.payments.map((p, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-slate-655 dark:text-slate-350 capitalize flex items-center gap-2 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        {p.method}
                      </span>
                      <span className="font-mono font-bold text-slate-850 dark:text-slate-200">
                        {cs}{p.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {receipt.changeAmount !== undefined && receipt.changeAmount > 0 && (
                  <div className="flex justify-between text-xs mt-2.5 pt-2.5 
                                  border-t border-slate-150 dark:border-slate-805">
                    <span className="text-green-600 dark:text-green-400 font-bold">{t('pos.change_return') || 'Change Returned'}</span>
                    <span className="font-mono font-extrabold text-green-600 dark:text-green-400">
                      {cs}{receipt.changeAmount.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Customer Info (if present) */}
              {receipt.customer && (
                <div className="mt-4 pt-3 border-t border-slate-150 dark:border-slate-805 text-[10px] text-slate-400 text-center font-semibold">
                  <span>{t('customers.customer') || 'Customer'}: {receipt.customer.name} ({receipt.customer.phone})</span>
                </div>
              )}

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-dashed border-slate-250 dark:border-slate-800 
                              text-center">
                <p className="text-xs font-black text-slate-700 dark:text-slate-350">
                  {t('pos.thank_you_footer') || 'Thank you for shopping with us!'}
                </p>
                <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                  {t('pos.visit_again') || 'Visit again soon'} 🛍️
                </p>
              </div>
            </div>

            {/* Bottom zigzag edge */}
            <div className="h-2 w-full bg-white dark:bg-slate-900 no-print" 
                 style={{
                   maskImage: `repeating-linear-gradient(45deg, transparent, transparent 4px, black 4px, black 8px)`,
                 }} 
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 no-print">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1 rounded-xl !h-11 font-bold text-xs"
          >
            {t('common.cancel') || 'Close'}
          </Button>
          <Button
            variant="primary"
            onClick={onPrint}
            className="flex-1 rounded-xl !h-11 font-bold text-xs flex items-center justify-center gap-1.5"
          >
            <Printer size={14} />
            {t('pos.print_receipt')}
          </Button>
        </div>

      </div>
    </div>
  );
}
