import React, { useState, useEffect } from 'react';
import { LogOut, Play, Square, User, Menu } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useShiftStore } from '../../store/useShiftStore';
import { useLayoutStore } from '../../store/useLayoutStore';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import FormField from '../ui/FormField';

export default function Topbar() {
  const { user, logout } = useAuthStore();
  const { currentShift, openShift, closeShift, fetchCurrentShift } = useShiftStore();
  const { toggleSidebar } = useLayoutStore();

  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCurrentShift();
    }
  }, [user]);

  const handleShiftAction = async (e) => {
    e.preventDefault();
    if (!cashAmount || isNaN(cashAmount) || Number(cashAmount) < 0) {
      return;
    }

    setModalLoading(true);
    try {
      if (!currentShift) {
        await openShift(Number(cashAmount));
      } else {
        await closeShift(Number(cashAmount));
      }
      setIsShiftModalOpen(false);
      setCashAmount('');
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  if (!user) return null;

  const outletName = user.outlet_id?.name || 'No Outlet';

  return (
    <>
      <header className="h-14 lg:h-16 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 lg:px-6 z-30 sticky top-0 shadow-sm">
        {/* Left Side Hamburger + Info */}
        <div className="flex items-center space-x-3 min-w-0">
          {/* Hamburger (mobile/tablet only) */}
          <button
            onClick={toggleSidebar}
            className="flex lg:hidden items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer shrink-0"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <span 
            className="text-xs lg:text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-900/30 truncate max-w-[150px] lg:max-w-none"
            title={outletName}
          >
            {outletName}
          </span>
          {user.outlet_id?.address && (
            <span className="text-xs font-semibold text-slate-400 hidden lg:inline truncate max-w-xs">
              {user.outlet_id.address}
            </span>
          )}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-2 lg:space-x-4 shrink-0">
          {/* Shift control button */}
          {currentShift ? (
            <Button
              variant="success"
              icon={Square}
              onClick={() => {
                setCashAmount('');
                setIsShiftModalOpen(true);
              }}
              className="!h-9 rounded-xl text-[10px] lg:text-xs px-2.5 lg:px-4 shrink-0"
            >
              <span className="hidden sm:inline">Shift Open (Clock Out)</span>
              <span className="inline sm:hidden">Clock Out</span>
            </Button>
          ) : (
            <Button
              variant="danger"
              icon={Play}
              onClick={() => {
                setCashAmount('');
                setIsShiftModalOpen(true);
              }}
              className="!h-9 rounded-xl text-[10px] lg:text-xs px-2.5 lg:px-4 animate-pulse shrink-0"
            >
              <span className="hidden sm:inline">Shift Closed (Clock In)</span>
              <span className="inline sm:hidden">Clock In</span>
            </Button>
          )}

          {/* User Profile Info */}
          <div className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-650 dark:text-slate-300 font-bold text-xs">
              {user.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <span className="text-xs lg:text-sm font-bold truncate max-w-[80px] lg:max-w-[120px] hidden sm:inline">
              {user.name}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          {/* Logout button */}
          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer shrink-0"
            title="Log Out"
          >
            <LogOut className="w-4.5 h-4.5 lg:w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Clock In / Clock Out Modal */}
      {isShiftModalOpen && (
        <Modal
          title={!currentShift ? 'Open Shift (Clock In)' : 'Close Shift (Clock Out)'}
          onClose={() => setIsShiftModalOpen(false)}
          size="sm"
        >
          <form onSubmit={handleShiftAction} className="space-y-4">
            <p className="text-xs sm:text-sm text-slate-505 dark:text-slate-400">
              {!currentShift
                ? 'Enter the starting cash amount currently in the register drawer to open the shift.'
                : 'Enter the actual final cash count currently in the drawer to close the shift.'}
            </p>
            <FormField
              label={!currentShift ? 'Opening Cash (₹)' : 'Actual Closing Cash (₹)'}
              required
            >
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                placeholder="0.00"
                className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </FormField>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => setIsShiftModalOpen(false)}
                disabled={modalLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant={!currentShift ? 'primary' : 'danger'}
                loading={modalLoading}
                className="flex-1"
              >
                {!currentShift ? 'Open Shift' : 'Close Shift'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
