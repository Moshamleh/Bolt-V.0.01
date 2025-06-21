import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-neutral-100 dark:from-gray-900 dark:to-gray-800">
      <Outlet />
    </div>
  );
};

export default AuthLayout;