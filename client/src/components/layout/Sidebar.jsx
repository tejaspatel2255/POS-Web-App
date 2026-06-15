import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  MonitorPlay,
  FileText,
  ShoppingBag,
  FolderOpen,
  Boxes,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useLayoutStore } from '../../store/useLayoutStore';
import { useTranslation } from 'react-i18next';

import { useMediaQuery } from '../../hooks/useMediaQuery';
import { PendingBadge } from '../offline/PendingBadge';

export default function Sidebar() {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const location = useLocation();
  const { sidebarOpen, sidebarCollapsed, toggleCollapse } = useLayoutStore();
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');

  if (!user) return null;

  const menuItems = [
    {
      name: t('nav.dashboard'),
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'manager'],
    },
    {
      name: t('nav.pos'),
      path: '/pos',
      icon: MonitorPlay,
      roles: ['admin', 'manager', 'cashier'],
    },
    {
      name: t('nav.orders'),
      path: '/orders',
      icon: FileText,
      roles: ['admin', 'manager', 'cashier'],
    },
    {
      name: t('nav.products'),
      path: '/products',
      icon: ShoppingBag,
      roles: ['admin', 'manager', 'cashier'],
    },
    {
      name: t('nav.categories'),
      path: '/categories',
      icon: FolderOpen,
      roles: ['admin', 'manager', 'cashier'],
    },
    {
      name: t('nav.inventory'),
      path: '/inventory',
      icon: Boxes,
      roles: ['admin', 'manager', 'cashier'],
    },
    {
      name: t('nav.customers'),
      path: '/customers',
      icon: Users,
      roles: ['admin', 'manager', 'cashier'],
    },
    {
      name: t('nav.reports'),
      path: '/reports',
      icon: BarChart3,
      roles: ['admin', 'manager'],
    },
    {
      name: t('nav.settings'),
      path: '/settings',
      icon: Settings,
      roles: ['admin', 'manager', 'cashier'],
    },
  ];

  const allowedItems = menuItems.filter((item) => item.roles.includes(user.role));
  const isCollapsed = sidebarCollapsed && !sidebarOpen;

  // Build classes dynamically
  let sidebarClasses = "fixed top-0 bottom-0 left-0 z-40 h-screen bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 ";
  
  if (sidebarOpen) {
    sidebarClasses += "translate-x-0 w-[280px] ";
  } else {
    sidebarClasses += "-translate-x-full ";
  }

  if (isTablet) {
    sidebarClasses += "md:translate-x-0 ";
    if (isCollapsed) {
      sidebarClasses += "md:sticky md:w-16 ";
    } else {
      sidebarClasses += "md:fixed md:w-60 md:shadow-2xl ";
    }
  } else {
    sidebarClasses += "lg:translate-x-0 lg:static lg:w-60 ";
  }

  return (
    <aside className={sidebarClasses}>
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        <div className="flex items-center space-x-2 overflow-hidden">
          <img
            src="/logo.png"
            alt="TejasPOS"
            className="w-8 h-8 rounded-lg object-cover shadow-md shadow-indigo-550/20 shrink-0"
            onError={(e) => {
              e.target.style.display = 'none';
              const fallback = e.target.parentElement.querySelector('.logo-fallback');
              if (fallback) fallback.classList.remove('hidden');
            }}
          />
          <div className="logo-fallback hidden w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-500/20 shrink-0">
            T
          </div>
          {!isCollapsed && (
            <span className="font-extrabold text-lg text-white tracking-tight truncate">
              Tejas<span className="text-indigo-400">POS</span>
            </span>
          )}
        </div>
        {/* Toggle Collapse Button (hidden on mobile) */}
        <button
          onClick={toggleCollapse}
          className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {allowedItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`group relative flex items-center h-12 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                isCollapsed ? 'justify-center px-0 w-10 mx-auto' : 'px-4'
              } ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
              {!isCollapsed && <span>{item.name}</span>}
              {!isCollapsed && item.path === '/orders' && (
                <div className="ml-auto">
                  <PendingBadge />
                </div>
              )}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-slate-950 text-white text-xs font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150 whitespace-nowrap shadow-xl border border-slate-800 z-50">
                  {item.name}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Profile Mini-card */}
      <div className="p-3 border-t border-slate-800">
        <div className={`flex items-center bg-slate-850 p-2.5 rounded-xl ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
          <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
            {user.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-100 truncate leading-tight">
                {user.name}
              </p>
              <p className="text-[10px] font-medium text-slate-400 capitalize truncate">
                {user.role} ({user.outlet_id?.name || 'No Outlet'})
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
