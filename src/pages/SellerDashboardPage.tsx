import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Package, MessageSquare, DollarSign, Plus, 
  User, Lightbulb, TrendingUp, Star, ShoppingBag, Loader2, 
  BarChart2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Part, getMyParts, getMyPartChats, getReceivedOffers } from '../lib/supabase';

interface Stats {
  activeListings: number;
  totalMessages: number;
  soldItems: number;
  totalViews: number;
  averageRating: number;
  pendingOffers: number;
}

const SellerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({
    activeListings: 0,
    totalMessages: 0,
    soldItems: 0,
    totalViews: 0,
    averageRating: 0,
    pendingOffers: 0
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        
        const [parts, chats, offers] = await Promise.all([
          getMyParts(),
          getMyPartChats(),
          getReceivedOffers()
        ]);

        setStats({
          activeListings: parts.filter(p => !p.sold).length,
          totalMessages: chats.length,
          soldItems: parts.filter(p => p.sold).length,
          totalViews: Math.floor(Math.random() * 1000), // Mock data
          averageRating: 4.8, // Mock data
          pendingOffers: offers.filter(o => o.status === 'pending').length
        });
      } catch (err) {
        console.error('Failed to load seller stats:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const StatCard: React.FC<{
    title: string;
    value: number | string;
    icon: React.ReactNode;
    description?: string;
  }> = ({ title, value, icon, description }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  );

  const SellingTip: React.FC<{
    title: string;
    description: string;
    icon: React.ReactNode;
  }> = ({ title, description, icon }) => (
    <div className="flex items-start gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
      <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
        {icon}
      </div>
      <div>
        <h4 className="font-medium text-blue-900 dark:text-blue-100">{title}</h4>
        <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">{description}</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/marketplace')}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Marketplace
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Seller Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track your sales and performance</p>
        </motion.div>

        {error ? (
          <div className="bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-200 p-4 rounded-lg mb-6">
            {error}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => navigate('/sell-part')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                List New Part
              </button>
              <button
                onClick={() => navigate('/account')}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <User className="h-5 w-5" />
                Edit Profile
              </button>
              <button
                onClick={() => navigate('/marketplace/messages')}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <MessageSquare className="h-5 w-5" />
                View Messages
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard
                title="Active Listings"
                value={stats.activeListings}
                icon={<Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
              />
              <StatCard
                title="Pending Offers"
                value={stats.pendingOffers}
                icon={<DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />}
              />
              <StatCard
                title="Messages"
                value={stats.totalMessages}
                icon={<MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
              />
              <StatCard
                title="Items Sold"
                value={stats.soldItems}
                icon={<ShoppingBag className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
              />
              <StatCard
                title="Total Views"
                value={stats.totalViews}
                icon={<TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
              />
              <StatCard
                title="Seller Rating"
                value={`${stats.averageRating} / 5.0`}
                icon={<Star className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
              />
            </div>

            {/* Offers Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <BarChart2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  Offer Activity
                </h2>
                <button
                  onClick={() => navigate('/marketplace/offers')}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  View All
                </button>
              </div>
              
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-blue-800 dark:text-blue-200">
                  You have <span className="font-bold">{stats.pendingOffers}</span> pending offers that need your attention.
                </p>
              </div>
            </div>

            {/* Selling Tips */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Tips for Better Selling
              </h2>
              <div className="grid gap-4">
                <SellingTip
                  title="High-Quality Photos"
                  description="Take clear, well-lit photos from multiple angles. Good images increase buyer trust and interest."
                  icon={<Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                />
                <SellingTip
                  title="Detailed Descriptions"
                  description="Include part numbers, compatibility info, and condition details. The more information, the better."
                  icon={<Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                />
                <SellingTip
                  title="Competitive Pricing"
                  description="Research similar listings to price your parts competitively. Consider offering bundle deals."
                  icon={<Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                />
                <SellingTip
                  title="Respond to Offers Quickly"
                  description="Buyers appreciate fast responses. Try to respond to offers within 24 hours to increase your chances of making a sale."
                  icon={<Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDashboardPage;