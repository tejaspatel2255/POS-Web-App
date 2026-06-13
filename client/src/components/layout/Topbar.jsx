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
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
  const displayOutletName = outletName.length > 15 ? outletName.substring(0, 15) + '...' : outletName;

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
            {displayOutletName}
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

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          {/* User Profile Info Dropdown Trigger */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-200 hover:opacity-80 cursor-pointer focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs">
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <span className="text-xs lg:text-sm font-bold truncate max-w-[80px] lg:max-w-[120px] hidden sm:inline">
                {user.name}
              </span>
            </button>

            {/* Dropdown Menu (Desktop) */}
            {dropdownOpen && (
              <div className="hidden md:block absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-50 py-2">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-805">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{user.name}</p>
                  <p className="text-[10px] text-slate-500 capitalize">{user.role}</p>
                </div>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>

          {/* Bottom Sheet Menu (Mobile) */}
          {dropdownOpen && (
            <>
              <div 
                onClick={() => setDropdownOpen(false)}
                className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-40 md:hidden"
              />
              <div className="fixed inset-x-0 bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-850 rounded-t-2xl shadow-2xl z-50 p-5 md:hidden space-y-4 pb-8 transition-transform duration-300">
                <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-2" />
                <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{user.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{user.role} &bull; {outletName}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full h-11 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-semibold flex items-center justify-center space-x-2"
                >
                  <LogOut className="w-4.5 h-4.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </>
          )}
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
