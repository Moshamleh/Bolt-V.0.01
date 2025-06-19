import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Settings, Trash2, Car, MapPin, Loader2, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Part, getMyParts, deletePart, boostPart } from '../lib/supabase';
import BoostListingModal from '../components/BoostListingModal';

const MyListingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedPartForBoost, setSelectedPartForBoost] = useState<Part | null>(null);
  const [isBoostModalOpen, setIsBoostModalOpen] = useState(false);

  useEffect(() => {
    const loadParts = async () => {
      try {
        const data = await getMyParts();
        setParts(data);
      } catch (err) {
        console.error('Failed to load parts:', err);
        setError('Failed to load your listings');
      } finally {
        setLoading(false);
      }
    };

    loadParts();
  }, []);

  const handleAddPart = () => {
    navigate('/sell-part');
  };

  const handleEditPart = (partId: string) => {
    navigate(`/edit-part/${partId}`);
  };

  const handleDeletePart = async (partId: string) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) {
      return;
    }

    setDeletingId(partId);
    try {
      await deletePart(partId);
      setParts(prev => prev.filter(part => part.id !== partId));
    } catch (err) {
      console.error('Failed to delete part:', err);
      setError('Failed to delete listing');
    } finally {
      setDeletingId(null);
    }
  };

  const handleBoostPart = (part: Part) => {
    setSelectedPartForBoost(part);
    setIsBoostModalOpen(true);
  };

  const handleBoostComplete = () => {
    // Update the local state to show the part as boosted
    if (selectedPartForBoost) {
      setParts(prev => 
        prev.map(part => 
          part.id === selectedPartForBoost.id 
            ? { ...part, is_boosted: true } 
            : part
        )
      );
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="aspect-video bg-gray-200 dark:bg-gray-700"></div>
          <div className="p-4">
            <div className="flex justify-between items-start mb-4">
              <div className="w-2/3">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
            <div className="flex gap-2">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const EmptyState = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center"
    >
      <div className="flex justify-center mb-4">
        <Car className="h-16 w-16 text-gray-400 dark:text-gray-500" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        No parts listed yet
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Start selling by listing your first part
      </p>
      <button
        onClick={handleAddPart}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
      >
        <Plus className="h-5 w-5 mr-2" />
        List a Part
      </button>
    </motion.div>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error}
          </h2>
          <button
            onClick={() => window.location.reload()}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            Try Again
          </button>
        </div>
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
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Listings</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your marketplace listings</p>
          </div>

          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={handleAddPart}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            List a Part
          </motion.button>
        </motion.div>

        {loading ? (
          <LoadingSkeleton />
        ) : parts.length === 0 ? (
          <EmptyState />
        ) : (
          <AnimatePresence>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {parts.map((part, index) => (
                <motion.div
                  key={part.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
                >
                  <div className="relative pb-[66%]">
                    <img
                      src={part.image_url}
                      alt={part.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <span className={`
                        px-2 py-1 rounded-full text-xs font-medium
                        ${part.condition === 'new' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                          part.condition === 'used' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'}
                      `}>
                        {part.condition.charAt(0).toUpperCase() + part.condition.slice(1)}
                      </span>
                    </div>
                    
                    {/* Boosted Badge */}
                    {part.is_boosted && (
                      <div className="absolute top-2 left-2 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full text-xs font-medium shadow-lg flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5" />
                        <span>Boosted</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                        {part.title}
                      </h3>
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {formatPrice(part.price)}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Car className="h-4 w-4 mr-1" />
                        {part.year} {part.make} {part.model}
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="h-4 w-4 mr-1" />
                        {part.location}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        Listed {formatDistanceToNow(new Date(part.created_at), { addSuffix: true })}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {!part.is_boosted && (
                        <button
                          onClick={() => handleBoostPart(part)}
                          className="flex-1 flex items-center justify-center px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-colors"
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          Boost
                        </button>
                      )}
                      <button
                        onClick={() => handleEditPart(part.id)}
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePart(part.id)}
                        disabled={deletingId === part.id}
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === part.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Boost Modal */}
      <BoostListingModal
        isOpen={isBoostModalOpen}
        onClose={() => setIsBoostModalOpen(false)}
        partId={selectedPartForBoost?.id || ''}
        partTitle={selectedPartForBoost?.title || ''}
        onBoostComplete={handleBoostComplete}
      />
    </div>
  );
};

export default MyListingsPage;