import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Package, MessageSquare, Plus, ShoppingBag, Heart,
  Settings, AlertCircle, X
} from 'lucide-react';
import { motion } from 'framer-motion';

interface MarketplaceSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const MarketplaceSidebar: React.FC<MarketplaceSidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
        />
      )}

      {/* Sidebar */}
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: isOpen ? 0 : "-100%" }}
        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
        className={`fixed left-0 top-0 h-full w-64 bg-neutral-100 dark:bg-gray-800 shadow-lg z-50 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:z-0`}
      >
        <div className="p-4 border-b border-neutral-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Marketplace</h2>
            <button
              onClick={onClose}
              className="p-2 text-neutral-500 hover:text-neutral-700 dark:text-gray-400 dark:hover:text-gray-300 md:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          <NavLink
            to="/marketplace/my-listings"
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-2 rounded-lg transition-colors
              ${isActive 
                ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' 
                : 'text-neutral-700 dark:text-gray-300 hover:bg-neutral-200 dark:hover:bg-gray-700'
              }
            `}
          >
            <Package className="h-5 w-5" />
            <span>My Listings</span>
          </NavLink>

          <NavLink
            to="/marketplace/messages"
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-2 rounded-lg transition-colors
              ${isActive 
                ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' 
                : 'text-neutral-700 dark:text-gray-300 hover:bg-neutral-200 dark:hover:bg-gray-700'
              }
            `}
          >
            <MessageSquare className="h-5 w-5" />
            <span>Messages</span>
          </NavLink>

          <NavLink
            to="/sell-part"
            className="flex items-center gap-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Create New Listing</span>
          </NavLink>

          <NavLink
            to="/marketplace/saved"
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-2 rounded-lg transition-colors
              ${isActive 
                ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' 
                : 'text-neutral-700 dark:text-gray-300 hover:bg-neutral-200 dark:hover:bg-gray-700'
              }
            `}
          >
            <Heart className="h-5 w-5" />
            <span>Saved Listings</span>
          </NavLink>

          <NavLink
            to="/marketplace/seller-dashboard"
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-2 rounded-lg transition-colors
              ${isActive 
                ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' 
                : 'text-neutral-700 dark:text-gray-300 hover:bg-neutral-200 dark:hover:bg-gray-700'
              }
            `}
          >
            <Settings className="h-5 w-5" />
            <span>Seller Dashboard</span>
          </NavLink>

          <NavLink
            to="/help"
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-2 rounded-lg transition-colors
              ${isActive 
                ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' 
                : 'text-neutral-700 dark:text-gray-300 hover:bg-neutral-200 dark:hover:bg-gray-700'
              }
            `}
          >
            <AlertCircle className="h-5 w-5" />
            <span>Help & FAQ</span>
          </NavLink>
        </nav>
      </motion.div>
    </>
  );
};

export default MarketplaceSidebar;