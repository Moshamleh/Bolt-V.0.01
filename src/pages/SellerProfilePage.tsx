import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, MapPin, Calendar, Star, 
  Package, Loader2, MessageSquare, ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { supabase, Part, SellerRatingStats, getSellerRatingStats } from '../lib/supabase';
import SellerRatingStars from '../components/SellerRatingStars';
import SellerReviewsPanel from '../components/SellerReviewsPanel';

interface SellerProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  created_at: string;
}

const SellerProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [sellerParts, setSellerParts] = useState<Part[]>([]);
  const [ratingStats, setRatingStats] = useState<SellerRatingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'listings' | 'reviews'>('listings');

  useEffect(() => {
    const loadSellerData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Load seller profile
        const { data: sellerData, error: sellerError } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, bio, location, created_at')
          .eq('id', id)
          .single();
        
        if (sellerError) throw sellerError;
        setSeller(sellerData);
        
        // Load seller's parts
        const { data: partsData, error: partsError } = await supabase
          .from('parts')
          .select('*')
          .eq('seller_id', id)
          .eq('approved', true)
          .eq('sold', false)
          .order('created_at', { ascending: false });
        
        if (partsError) throw partsError;
        setSellerParts(partsData || []);
        
        // Load seller rating stats
        const stats = await getSellerRatingStats(id);
        setRatingStats(stats);
      } catch (err) {
        console.error('Failed to load seller data:', err);
        setError('Failed to load seller profile');
      } finally {
        setLoading(false);
      }
    };
    
    loadSellerData();
  }, [id]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error || 'Seller not found'}
          </h2>
          <button
            onClick={() => navigate('/marketplace')}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            Back to Marketplace
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
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </motion.button>

        {/* Seller Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
              {seller.avatar_url ? (
                <img
                  src={seller.avatar_url}
                  alt={seller.full_name || 'Seller'}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="h-12 w-12 text-gray-400 dark:text-gray-500" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {seller.full_name || seller.username || 'Anonymous Seller'}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 mb-4">
                {ratingStats && (
                  <div className="flex items-center gap-2">
                    <SellerRatingStars rating={ratingStats.average_rating} />
                    <span className="text-gray-700 dark:text-gray-300">
                      {ratingStats.average_rating} ({ratingStats.review_count} {ratingStats.review_count === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                )}
                
                {seller.location && (
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{seller.location}</span>
                  </div>
                )}
                
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Member since {formatDistanceToNow(new Date(seller.created_at), { addSuffix: true })}</span>
                </div>
              </div>

              {seller.bio && (
                <p className="text-gray-700 dark:text-gray-300">
                  {seller.bio}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 md:text-right">
              <div className="flex flex-col">
                <span className="text-sm text-gray-500 dark:text-gray-400">Active Listings</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{sellerParts.length}</span>
              </div>
              
              <button
                onClick={() => navigate(`/marketplace/messages/new?seller=${seller.id}`)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <MessageSquare className="h-5 w-5" />
                Contact Seller
              </button>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
          <div className="flex">
            <button
              onClick={() => setActiveTab('listings')}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === 'listings'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Package className="h-5 w-5" />
                <span>Listings</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('reviews')}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === 'reviews'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Star className="h-5 w-5" />
                <span>Reviews</span>
                {ratingStats && ratingStats.review_count > 0 && (
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                    {ratingStats.review_count}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'listings' ? (
            <motion.div
              key="listings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {sellerParts.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
                  <ShoppingBag className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No active listings
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    This seller doesn't have any active listings at the moment.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {sellerParts.map(part => (
                    <div
                      key={part.id}
                      onClick={() => navigate(`/parts/${part.id}`)}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="aspect-video relative">
                        <img
                          src={part.image_url || 'https://images.pexels.com/photos/2244746/pexels-photo-2244746.jpeg'}
                          alt={part.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <span className={`
                            px-2 py-1 rounded-full text-xs font-medium shadow-sm backdrop-blur-sm
                            ${part.condition === 'new' 
                              ? 'bg-green-100/90 text-green-800' 
                              : part.condition === 'used' 
                              ? 'bg-yellow-100/90 text-yellow-800' 
                              : 'bg-blue-100/90 text-blue-800'}
                          `}>
                            {part.condition.charAt(0).toUpperCase() + part.condition.slice(1)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                            {part.title}
                          </h3>
                          <span className="flex-shrink-0 text-lg font-bold text-blue-600 dark:text-blue-400">
                            {formatPrice(part.price)}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {part.year} {part.make} {part.model}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="reviews"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <SellerReviewsPanel sellerId={seller.id} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SellerProfilePage;