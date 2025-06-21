import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Menu } from 'lucide-react';
import ClubSidebar from './ClubSidebar';

const ClubLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex flex-1">
      <AnimatePresence>
        <ClubSidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
        />
      </AnimatePresence>

      <div className="flex-1">
        <div className="p-4 md:hidden flex items-center">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-neutral-600 dark:text-gray-400 hover:text-neutral-900 dark:hover:text-white"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-white ml-2">
            Clubs
          </h1>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default ClubLayout;