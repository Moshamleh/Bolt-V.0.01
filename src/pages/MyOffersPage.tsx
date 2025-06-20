import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, Loader2, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Offer, getSentOffers, getReceivedOffers } from '../lib/supabase_modules/offers';
import OfferItem from '../components/OfferItem';
import { extractErrorMessage } from '../lib/errorHandling';

type OfferTab = 'sent' | 'received';
type OfferFilter = 'all' | 'pending' | 'accepted' | 'rejected' | 'countered' | 'withdrawn';

const MyOffersPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<OfferTab>('received');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<OfferFilter>('all');

  useEffect(() => {
    const loadOffers = async () => {
      try {
        setLoading(true);
        
        const data = activeTab === 'sent' 
          ? await getSentOffers() 
          : await getReceivedOffers();
        
        setOffers(data);
      } catch (err) {
        console.error('Failed to load offers:', err);
        const errorMessage = extractErrorMessage(err);
        setError(`Failed to load offers: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    loadOffers();
  }, [activeTab]);

  const handleStatusChange = async () => {
    try {
      const data = activeTab === 'sent' 
        ? await getSentOffers() 
        : await getReceivedOffers();
      
      setOffers(data);
    } catch (err) {
      console.error('Failed to refresh offers:', err);
    }
  };

  const filteredOffers = offers.filter(offer => {
    if (statusFilter === 'all') return true;
    return offer.status === statusFilter;
  });

  const EmptyState = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center"
    >
      <div className="flex justify-center mb-4">
        <DollarSign className="h-16 w-16 text-gray-400 dark:text-gray-500" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        No offers {activeTab === 'sent' ? 'sent' : 'received'} yet
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {activeTab === 'sent' 
          ? 'Make offers on parts you\'re interested in to start negotiating with sellers' 
          : 'When buyers make offers on your parts, they will appear here'}
      </p>
      <button
        onClick={() => navigate('/marketplace')}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
      >
        Browse Marketplace
      </button>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Offers</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your sent and received offers
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
          <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-700">
            <button
              onClick={() => setActiveTab('received')}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'received'
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Offers Received
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'sent'
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Offers Sent
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <Filter className="h-5 w-5" />
              <span>Filter by Status</span>
              {showFilters ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            
            {statusFilter !== 'all' && (
              <button
                onClick={() => setStatusFilter('all')}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Clear Filter
              </button>
            )}
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1.5 text-sm rounded-full ${
                      statusFilter === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setStatusFilter('pending')}
                    className={`px-3 py-1.5 text-sm rounded-full ${
                      statusFilter === 'pending'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setStatusFilter('accepted')}
                    className={`px-3 py-1.5 text-sm rounded-full ${
                      statusFilter === 'accepted'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Accepted
                  </button>
                  <button
                    onClick={() => setStatusFilter('rejected')}
                    className={`px-3 py-1.5 text-sm rounded-full ${
                      statusFilter === 'rejected'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Rejected
                  </button>
                  <button
                    onClick={() => setStatusFilter('countered')}
                    className={`px-3 py-1.5 text-sm rounded-full ${
                      statusFilter === 'countered'
                        ? 'bg-amber-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Countered
                  </button>
                  <button
                    onClick={() => setStatusFilter('withdrawn')}
                    className={`px-3 py-1.5 text-sm rounded-full ${
                      statusFilter === 'withdrawn'
                        ? 'bg-gray-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Withdrawn
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Offers List */}
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-200 p-4 rounded-lg">
            {error}
          </div>
        ) : filteredOffers.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {filteredOffers.length} {filteredOffers.length === 1 ? 'Offer' : 'Offers'} {statusFilter !== 'all' ? `(${statusFilter})` : ''}
            </h2>
            
            <AnimatePresence initial={false}>
              {filteredOffers.map((offer) => (
                <OfferItem
                  key={offer.id}
                  offer={offer}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOffersPage;