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
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export default function Sidebar() {
  const { user } = useAuthStore();
  const location = useLocation();

  if (!user) return null;

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'manager'],
    },
    {
      name: 'POS Terminal',
      path: '/pos',
      icon: MonitorPlay,
      roles: ['admin', 'manager', 'cashier'],
    },
    {
      name: 'Orders Log',
      path: '/orders',
      icon: FileText,
      roles: ['admin', 'manager', 'cashier'],
    },
    {
      name: 'Products',
      path: '/products',
      icon: ShoppingBag,
      roles: ['admin', 'manager'],
    },
    {
      name: 'Categories',
      path: '/categories',
      icon: FolderOpen,
      roles: ['admin', 'manager'],
    },
    {
      name: 'Inventory',
      path: '/inventory',
      icon: Boxes,
      roles: ['admin', 'manager'],
    },
    {
      name: 'Customers CRM',
      path: '/customers',
      icon: Users,
      roles: ['admin', 'manager', 'cashier'],
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: BarChart3,
      roles: ['admin', 'manager'],
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: Settings,
      roles: ['admin', 'manager', 'cashier'],
    },
  ];

  const allowedItems = menuItems.filter((item) => item.roles.includes(user.role));

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-500/20">
            A
          </div>
          <span className="font-extrabold text-lg text-white tracking-tight">
            Antigravity<span className="text-indigo-400">POS</span>
          </span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {allowedItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 h-12 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-5 h-5 mr-3 shrink-0" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Profile Mini-card */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center space-x-3 bg-slate-850 p-3 rounded-xl">
          <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
            {user.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-100 truncate leading-tight">
              {user.name}
            </p>
            <p className="text-xs font-medium text-slate-450 capitalize truncate">
              {user.role} ({user.outlet_id?.name || 'No Outlet'})
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
