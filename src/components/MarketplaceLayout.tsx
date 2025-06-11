import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import MarketplaceSidebar from './MarketplaceSidebar';

const MarketplaceLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <AnimatePresence>
        <MarketplaceSidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
        />
      </AnimatePresence>

      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
};

export default MarketplaceLayout;