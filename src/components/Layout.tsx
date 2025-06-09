import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Zap, Store, UsersRound, Settings, Wrench } from 'lucide-react';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      <main className="pb-20 pt-4 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-2 px-4 md:hidden">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <NavLink
            to="/diagnostic"
            className={({ isActive }) => `
              flex flex-col items-center gap-1 min-w-[64px]
              ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}
            `}
          >
            <Zap className="h-6 w-6" />
            <span className="text-[10px]">Bolt Chat</span>
          </NavLink>

          <NavLink
            to="/mechanic-support"
            className={({ isActive }) => `
              flex flex-col items-center gap-1 min-w-[64px]
              ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}
            `}
          >
            <Wrench className="h-6 w-6" />
            <span className="text-[10px]">Live Help</span>
          </NavLink>

          <NavLink
            to="/marketplace"
            className={({ isActive }) => `
              flex flex-col items-center gap-1 min-w-[64px]
              ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}
            `}
          >
            <Store className="h-6 w-6" />
            <span className="text-[10px]">Marketplace</span>
          </NavLink>

          <NavLink
            to="/clubs"
            className={({ isActive }) => `
              flex flex-col items-center gap-1 min-w-[64px]
              ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}
            `}
          >
            <UsersRound className="h-6 w-6" />
            <span className="text-[10px]">Clubs</span>
          </NavLink>

          <NavLink
            to="/account"
            className={({ isActive }) => `
              flex flex-col items-center gap-1 min-w-[64px]
              ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}
            `}
          >
            <Settings className="h-6 w-6" />
            <span className="text-[10px]">Settings</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}

export default Layout;