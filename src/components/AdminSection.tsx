import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Users, MessageSquare, BarChart2, Package, Flag } from 'lucide-react';

const AdminSection: React.FC = () => {
  const navigate = useNavigate();

  const adminLinks = [
    {
      title: 'User Management',
      description: 'Manage users and permissions',
      icon: <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      href: '/admin/users'
    },
    {
      title: 'Parts Management',
      description: 'Manage marketplace listings',
      icon: <Package className="h-5 w-5 text-green-600 dark:text-green-400" />,
      href: '/admin/parts'
    },
    {
      title: 'Reported Parts',
      description: 'Review flagged marketplace listings',
      icon: <Flag className="h-5 w-5 text-red-600 dark:text-red-400" />,
      href: '/admin/reported-parts'
    },
    {
      title: 'AI Feedback',
      description: 'Review AI diagnostic feedback',
      icon: <MessageSquare className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
      href: '/admin/ai-feedback'
    },
    {
      title: 'AI Performance',
      description: 'Monitor AI diagnostic metrics',
      icon: <BarChart2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />,
      href: '/admin/ai-performance'
    }
  ];

  return (
    <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
          <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Admin Dashboard</h2>
      </div>

      <div className="grid gap-4">
        {adminLinks.map((link) => (
          <button
            key={link.href}
            onClick={() => navigate(link.href)}
            className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
          >
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              {link.icon}
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">{link.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{link.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AdminSection;