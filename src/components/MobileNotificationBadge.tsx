import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { getUnreadNotificationCount } from '../lib/supabase';

interface MobileNotificationBadgeProps {
  onClick: () => void;
}

const MobileNotificationBadge: React.FC<MobileNotificationBadgeProps> = ({ onClick }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const count = await getUnreadNotificationCount();
        setUnreadCount(count);
      } catch (error) {
        console.error('Failed to load unread notification count:', error);
      }
    };

    loadUnreadCount();

    // Set up interval to refresh count every minute
    const interval = setInterval(loadUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <button
      onClick={onClick}
      className="relative p-2 text-neutral-600 dark:text-gray-400 hover:text-neutral-900 dark:hover:text-white"
      aria-label="Notifications"
    >
      <Bell className="h-6 w-6" />
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default MobileNotificationBadge;