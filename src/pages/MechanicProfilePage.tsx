import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Star, MapPin, Globe, DollarSign, Calendar, 
  CheckCircle, User, Loader2, MessageSquare, Phone 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { Mechanic, getMechanicById, getOrCreateMechanicChat, supabase } from '../lib/supabase';

const MechanicProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [mechanic, setMechanic] = useState<Mechanic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    const loadMechanic = async () => {
      if (!id) return;

      try {
        const mechanicData = await getMechanicById(id);
        if (!mechanicData) {
          setError('Mechanic not found');
          return;
        }
        setMechanic(mechanicData);
      } catch (err) {
        console.error('Failed to load mechanic:', err);
        setError('Failed to load mechanic profile');
      } finally {
        setLoading(false);
      }
    };

    loadMechanic();
  }, [id]);

  const handleBookNow = async () => {
    if (!mechanic) return;
    
    setIsBooking(true);
    try {
      // Get current user session
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast.error('Please log in to book a session');
        navigate('/login');
        return;
      }

      // Create or get existing chat
      const chatId = await getOrCreateMechanicChat(user.id, mechanic.id);
      
      // Navigate to the chat page (this serves as our booking screen for now)
      navigate(`/mechanic-support/chat/${chatId}`);
      
      toast.success(`Starting session with ${mechanic.full_name}`);
    } catch (err) {
      console.error('Failed to book session:', err);
      toast.error('Failed to book session. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const LoadingSkeleton = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse">
          {/* Back Button Skeleton */}
          <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>

          {/* Profile Header Skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
              <div className="w-32 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || !mechanic) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error || 'Mechanic not found'}
          </h2>
          <button
            onClick={() => navigate('/mechanic-support')}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            Back to Mechanic Support
          </button>
        </div>
      </div>
    );
  }

  // Mock rating data since it's not in the database yet
  const rating = 4.8;
  const reviewCount = 127;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/mechanic-support')}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Mechanics
        </motion.button>

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
              <User className="h-12 w-12 text-gray-400 dark:text-gray-500" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {mechanic.full_name}
                </h1>
                {mechanic.is_certified && (
                  <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="font-medium text-gray-900 dark:text-white">{rating}</span>
                  <span className="text-gray-500 dark:text-gray-400">({reviewCount} reviews)</span>
                </div>
                {mechanic.is_certified && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-sm font-medium rounded-full">
                    Certified
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                {mechanic.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{mechanic.location}</span>
                  </div>
                )}
                {mechanic.hourly_rate && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    <span>${mechanic.hourly_rate}/hour</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Member since {formatDistanceToNow(new Date(mechanic.created_at), { addSuffix: true })}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBookNow}
                disabled={isBooking}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isBooking ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <MessageSquare className="h-5 w-5" />
                    Book Now
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">About</h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {mechanic.bio || 'This mechanic hasn\'t added a bio yet.'}
              </p>
            </motion.div>

            {/* Experience */}
            {mechanic.experience && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Experience</h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                  {mechanic.experience}
                </p>
              </motion.div>
            )}

            {/* Reviews Section (Placeholder) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Reviews</h2>
              <div className="text-center py-8">
                <Star className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Reviews coming soon</p>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Expertise */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Expertise</h3>
              {mechanic.specialties && mechanic.specialties.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {mechanic.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 text-sm font-medium rounded-full"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No specialties listed</p>
              )}
            </motion.div>

            {/* Languages */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Languages
              </h3>
              {mechanic.languages && mechanic.languages.length > 0 ? (
                <div className="space-y-2">
                  {mechanic.languages.map((language, index) => (
                    <div key={index} className="text-gray-600 dark:text-gray-400">
                      {language}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No languages listed</p>
              )}
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact</h3>
              <div className="space-y-3">
                {mechanic.phone && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Phone className="h-4 w-4" />
                    <span>{mechanic.phone}</span>
                  </div>
                )}
                {mechanic.location && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <MapPin className="h-4 w-4" />
                    <span>{mechanic.location}</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Pricing */}
            {mechanic.hourly_rate && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Pricing</h3>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    ${mechanic.hourly_rate}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">/hour</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MechanicProfilePage;