import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Car, MapPin, Tag, MessageSquare, Loader2, 
  Heart, Share2, AlertCircle, ChevronLeft, ChevronRight,
  User, FileText, Flag, CheckCircle, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { Part, getPartById, getOrCreatePartChat, isPartSaved, savePart, unsavePart, boostPart } from '../lib/supabase';
import ReportPartModal from '../components/ReportPartModal';
import BoostListingModal from '../components/BoostListingModal';
import BlurImage from '../components/BlurImage';
import { extractErrorMessage } from '../lib/errorHandling';

const PartDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [part, setPart] = useState<Part & { seller_email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMessagingLoading, setIsMessagingLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isBoostModalOpen, setIsBoostModalOpen] = useState(false);
  const [isCurrentUserSeller, setIsCurrentUserSeller] = useState(false);

  useEffect(() => {
    const loadPart = async () => {
      if (!id) return;

      try {
        const [partData, savedStatus] = await Promise.all([
          getPartById(id),
          isPartSaved(id)
        ]);
        setPart(partData);
        setIsSaved(savedStatus);
        
        // Check if current user is the seller
        const { data: { user } } = await supabase.auth.getUser();
        if (user && partData.seller_id === user.id) {
          setIsCurrentUserSeller(true);
        }
      } catch (err) {
        console.error('Failed to load part:', err);
        const errorMessage = extractErrorMessage(err);
        setError(`Failed to load part details: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    loadPart();
  }, [id]);

  const handleMessageSeller = async () => {
    if (!part) return;
    
    setIsMessagingLoading(true);
    try {
      const chatId = await getOrCreatePartChat(part.id, part.seller_id);
      navigate(`/marketplace/messages/${chatId}`);
    } catch (err) {
      console.error('Failed to create chat:', err);
      const errorMessage = extractErrorMessage(err);
      toast.error(`Failed to start chat: ${errorMessage}`);
    } finally {
      setIsMessagingLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: part?.title,
        text: `Check out this ${part?.title} on Bolt Auto`,
        url: window.location.href
      });
    } catch (err) {
      // Fallback to copying link
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  const handleSaveToggle = async () => {
    if (!part || isSaving) return;

    setIsSaving(true);
    try {
      if (isSaved) {
        await unsavePart(part.id);
        toast.success('Part removed from saved items');
      } else {
        await savePart(part.id);
        toast.success('Part saved successfully');
      }
      setIsSaved(!isSaved);
    } catch (err) {
      console.error('Failed to save/unsave part:', err);
      const errorMessage = extractErrorMessage(err);
      toast.error(isSaved ? `Failed to remove from saved items: ${errorMessage}` : `Failed to save part: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReportPart = () => {
    setIsReportModalOpen(true);
  };

  const handleBoostListing = () => {
    setIsBoostModalOpen(true);
  };

  const handleBoostComplete = () => {
    // Update the local part state to show as boosted
    if (part) {
      setPart({
        ...part,
        is_boosted: true
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const LoadingSkeleton = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-8"></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery Skeleton */}
          <div className="animate-pulse">
            <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          </div>

          {/* Details Skeleton */}
          <div className="space-y-6 animate-pulse">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
              <div className="space-y-4">
                <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-6 w-1/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="space-y-2">
                  <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="flex gap-3 pt-4">
                  <div className="h-10 flex-1 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                </div>
              </div>
            </div>

            {/* Seller Info Skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            </div>

            {/* Description Skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
              <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 w-4/6 bg-gray-200 dark:bg-gray-700 rounded"></div>
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

  if (error || !part) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error || 'Part not found'}
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

  // Mock multiple images for demonstration
  const images = [
    part.image_url,
    'https://images.pexels.com/photos/2244746/pexels-photo-2244746.jpeg',
    'https://images.pexels.com/photos/3806249/pexels-photo-3806249.jpeg'
  ];

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative aspect-square bg-white dark:bg-gray-800 rounded-xl overflow-hidden"
          >
            <BlurImage
              src={images[currentImageIndex]}
              alt={part.title}
              className="w-full h-full"
              objectFit="cover"
              priority={true}
            />
            
            {/* Boosted Badge */}
            {part.is_boosted && (
              <div className="absolute top-4 left-4 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full text-sm font-medium shadow-lg flex items-center gap-1.5">
                <Zap className="h-4 w-4" />
                <span>Boosted</span>
              </div>
            )}
            
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIndex(i => (i > 0 ? i - 1 : images.length - 1))}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-white/80 dark:bg-gray-800/80 rounded-full text-gray-900 dark:text-white hover:bg-white dark:hover:bg-gray-800 transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={() => setCurrentImageIndex(i => (i < images.length - 1 ? i + 1 : 0))}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-white/80 dark:bg-gray-800/80 rounded-full text-gray-900 dark:text-white hover:bg-white dark:hover:bg-gray-800 transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
                
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentImageIndex
                          ? 'bg-white'
                          : 'bg-white/50 hover:bg-white/75'
                      }`}
                      aria-label={`View image ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </motion.div>

          {/* Part Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {part.title}
                    </h1>
                    {part.seller_is_trusted && (
                      <div 
                        className="group flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium group-hover:shadow-glow group-hover:scale-105 transition-all duration-300"
                        title="Verified seller – 3+ approved listings + KYC passed"
                      >
                        <CheckCircle className="h-3 w-3" />
                        <span>Verified Seller</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`
                      px-2 py-1 rounded-full text-sm font-medium
                      ${part.condition === 'new' 
                        ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                        : part.condition === 'used'
                        ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300'
                        : 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300'
                      }
                    `}>
                      {part.condition.charAt(0).toUpperCase() + part.condition.slice(1)}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Listed {formatDistanceToNow(new Date(part.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {formatPrice(part.price)}
                </div>
              </div>

              {/* Part Numbers */}
              {(part.part_number || part.oem_number) && (
                <div className="flex flex-col gap-2 py-2 border-y border-gray-100 dark:border-gray-700">
                  {part.part_number && (
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <FileText className="h-5 w-5 mr-2" />
                      <span className="font-medium mr-2">Part Number:</span>
                      <span>{part.part_number}</span>
                    </div>
                  )}
                  {part.oem_number && (
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <FileText className="h-5 w-5 mr-2" />
                      <span className="font-medium mr-2">OEM Number:</span>
                      <span>{part.oem_number}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Car className="h-5 w-5 mr-2" />
                  <span>
                    {part.year} {part.make} {part.model}
                    {part.trim && ` ${part.trim}`}
                  </span>
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <MapPin className="h-5 w-5 mr-2" />
                  <span>{part.location}</span>
                </div>
              </div>

              {/* Boost Listing Button (only for seller) */}
              {isCurrentUserSeller && !part.is_boosted && (
                <button
                  onClick={handleBoostListing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 transition-colors shadow-md"
                >
                  <Zap className="h-5 w-5" />
                  🔥 Boost Listing – $2.99
                </button>
              )}

              {/* Boosted Status (if boosted) */}
              {isCurrentUserSeller && part.is_boosted && (
                <div className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-700 dark:text-amber-300 rounded-lg font-medium border border-amber-200 dark:border-amber-800">
                  <Zap className="h-5 w-5" />
                  Listing Boosted – Showing at the top of search results
                </div>
              )}

              <div className="flex gap-3">
                {!isCurrentUserSeller && (
                  <button
                    onClick={handleMessageSeller}
                    disabled={isMessagingLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isMessagingLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <MessageSquare className="h-5 w-5" />
                        Message Seller
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={handleSaveToggle}
                  disabled={isSaving}
                  className={`p-2 rounded-lg transition-colors ${
                    isSaved
                      ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700'
                  }`}
                  aria-label={isSaved ? "Remove from saved" : "Save part"}
                >
                  <Heart className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={handleShare}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700 rounded-lg transition-colors"
                  aria-label="Share part"
                >
                  <Share2 className="h-5 w-5" />
                </button>
                <button
                  onClick={handleReportPart}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors"
                  title="Report this listing"
                  aria-label="Report part"
                >
                  <Flag className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Seller Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <User className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {part.seller_email.split('@')[0]}
                    </h3>
                    {part.seller_is_trusted && (
                      <div 
                        className="group flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium group-hover:shadow-glow group-hover:scale-105 transition-all duration-300"
                        title="Verified seller – 3+ approved listings + KYC passed"
                      >
                        <CheckCircle className="h-3 w-3" />
                        <span>Verified</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Member since {formatDistanceToNow(new Date(2023, 0, 1), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Description
              </h2>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                  {part.description}
                </p>
              </div>
            </div>

            {/* Safety Tips */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">
                    Safety Tips
                  </h3>
                  <ul className="mt-2 space-y-1 text-sm text-blue-800 dark:text-blue-200">
                    <li>• Meet in a safe, public location</li>
                    <li>• Verify the part's condition before purchase</li>
                    <li>• Use our secure messaging system</li>
                    <li>• Report suspicious behavior</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Report Modal */}
      <ReportPartModal 
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        partId={part.id}
      />

      {/* Boost Modal */}
      <BoostListingModal
        isOpen={isBoostModalOpen}
        onClose={() => setIsBoostModalOpen(false)}
        partId={part.id}
        partTitle={part.title}
        onBoostComplete={handleBoostComplete}
      />
    </div>
  );
};

export default PartDetailPage;