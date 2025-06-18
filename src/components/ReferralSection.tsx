import React, { useState, useEffect } from 'react';
import { Share2, Award, Zap, Copy, Check, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { playPopSound } from '../lib/utils';

const ReferralSection: React.FC = () => {
  const [referralLink, setReferralLink] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [boostActive, setBoostActive] = useState(false);
  const [boostTimeRemaining, setBoostTimeRemaining] = useState<string | null>(null);

  useEffect(() => {
    const generateReferralLink = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Create a referral link with the user's ID
          const baseUrl = window.location.origin;
          setReferralLink(`${baseUrl}/login?invited_by=${user.id}`);
          
          // Check if user has an active boost
          const { data: profile } = await supabase
            .from('profiles')
            .select('listing_boost_until')
            .eq('id', user.id)
            .single();
            
          if (profile?.listing_boost_until) {
            const boostUntil = new Date(profile.listing_boost_until);
            const now = new Date();
            
            if (boostUntil > now) {
              setBoostActive(true);
              
              // Calculate time remaining
              const diffMs = boostUntil.getTime() - now.getTime();
              const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
              const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
              
              setBoostTimeRemaining(`${diffHrs}h ${diffMins}m`);
            }
          }
        }
      } catch (error) {
        console.error('Error generating referral link:', error);
      } finally {
        setLoading(false);
      }
    };

    generateReferralLink();
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Referral link copied to clipboard!');
    playPopSound();
    
    setTimeout(() => {
      setCopied(false);
    }, 3000);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Join me on Bolt Auto!',
          text: 'Check out Bolt Auto - your personal AI mechanic for car diagnostics and more!',
          url: referralLink
        });
      } else {
        handleCopyLink();
      }
    } catch (error) {
      console.error('Error sharing:', error);
      handleCopyLink();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
          <Share2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Invite Friends & Earn Rewards
        </h2>
      </div>

      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute -left-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-xl"></div>
        
        <div className="relative">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Award className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">
                🎁 Invite a friend → Unlock exclusive rewards!
              </h3>
              <p className="text-white/80">
                Share Bolt Auto with friends and both of you get special perks
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-5 w-5 text-yellow-300" />
                <h4 className="font-semibold">Street Starter Badge</h4>
              </div>
              <p className="text-sm text-white/80">
                Exclusive badge that shows up on your profile and marketplace listings
              </p>
            </div>
            
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-yellow-300" />
                <h4 className="font-semibold">Priority Listing Boost</h4>
              </div>
              <p className="text-sm text-white/80">
                Your parts appear at the top of search results for 24 hours
              </p>
              
              {boostActive && boostTimeRemaining && (
                <div className="mt-2 bg-green-500/30 rounded px-2 py-1 text-xs font-medium">
                  Active boost: {boostTimeRemaining} remaining
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="font-medium text-gray-900 dark:text-white mb-4">
          Share your referral link
        </h3>
        
        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 relative">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10"
            />
            <AnimatePresence>
              {copied ? (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500"
                >
                  <Check className="h-5 w-5" />
                </motion.div>
              ) : (
                <button
                  onClick={handleCopyLink}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <Copy className="h-5 w-5" />
                </button>
              )}
            </AnimatePresence>
          </div>
          
          <button
            onClick={handleShare}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            Share
          </button>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {/* Social sharing buttons */}
          <a
            href={`https://twitter.com/intent/tweet?text=Check%20out%20Bolt%20Auto%20-%20your%20personal%20AI%20mechanic!&url=${encodeURIComponent(referralLink)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 bg-[#1DA1F2] text-white rounded-lg text-sm hover:bg-opacity-90 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              window.open(
                `https://twitter.com/intent/tweet?text=Check%20out%20Bolt%20Auto%20-%20your%20personal%20AI%20mechanic!&url=${encodeURIComponent(referralLink)}`,
                'twitter-share',
                'width=550,height=435'
              );
              return false;
            }}
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
            </svg>
            Twitter
          </a>
          
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 bg-[#1877F2] text-white rounded-lg text-sm hover:bg-opacity-90 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              window.open(
                `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
                'facebook-share',
                'width=550,height=435'
              );
              return false;
            }}
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Facebook
          </a>
          
          <a
            href={`https://wa.me/?text=Check%20out%20Bolt%20Auto%20-%20your%20personal%20AI%20mechanic!%20${encodeURIComponent(referralLink)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 bg-[#25D366] text-white rounded-lg text-sm hover:bg-opacity-90 transition-colors"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            WhatsApp
          </a>
          
          <a
            href={`mailto:?subject=Check%20out%20Bolt%20Auto&body=I've%20been%20using%20Bolt%20Auto%20for%20car%20diagnostics%20and%20thought%20you%20might%20like%20it%20too!%0A%0AJoin%20here:%20${encodeURIComponent(referralLink)}`}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-500 dark:bg-gray-600 text-white rounded-lg text-sm hover:bg-opacity-90 transition-colors"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
            Email
          </a>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
            <ExternalLink className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-medium text-blue-900 dark:text-blue-100">How it works</h3>
            <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
              When friends sign up using your link, you'll earn the exclusive Street Starter Badge and a 24-hour priority boost for your marketplace listings. They'll also get a special welcome bonus!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralSection;