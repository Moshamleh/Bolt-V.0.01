import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Loader2, User, Mail, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { supabase, createProfile, uploadAvatar, getProfile, awardBadge } from '../lib/supabase';
import { useFormValidation, ValidationRules } from '../hooks/useFormValidation';
import FormField from '../components/FormField';
import Input from '../components/Input';
import Textarea from '../components/Textarea';
import SetupProgressIndicator, { Step } from '../components/SetupProgressIndicator';
import { playPopSound } from '../lib/utils';
import Confetti from '../components/Confetti';

const validationRules: ValidationRules = {
  fullName: {
    required: true,
    minLength: 2,
    maxLength: 100
  },
  username: {
    minLength: 3,
    maxLength: 30,
    pattern: /^[a-zA-Z0-9_]+$/,
    custom: (value) => {
      if (value && !/^[a-zA-Z0-9_]+$/.test(value)) {
        return 'Username can only contain letters, numbers, and underscores';
      }
      return null;
    }
  },
  location: {
    maxLength: 100
  }
};

const ProfileSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [email, setEmail] = useState<string>('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [completedFields, setCompletedFields] = useState<string[]>([]);
  const [setupSteps, setSetupSteps] = useState<Step[]>([
    { id: 'account', label: 'Account', completed: false, current: true },
    { id: 'vehicle', label: 'Vehicle', completed: false, current: false },
    { id: 'complete', label: 'Complete', completed: false, current: false }
  ]);
  
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    bio: '',
    location: ''
  });

  const { errors, validateField, validateForm, clearError, setError: setFieldError } = useFormValidation(validationRules);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Get current user's email
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          setEmail(session.user.email);
        }

        // Check if profile already exists
        const profile = await getProfile();
        if (profile) {
          // Pre-fill form with existing data
          setFormData({
            fullName: profile.full_name || '',
            username: profile.username || '',
            bio: profile.bio || '',
            location: profile.location || ''
          });
          
          if (profile.avatar_url) {
            setAvatarUrl(profile.avatar_url);
          }
          
          // Track completed fields
          const completed = [];
          if (profile.full_name) completed.push('fullName');
          if (profile.username) completed.push('username');
          if (profile.bio) completed.push('bio');
          if (profile.location) completed.push('location');
          if (profile.avatar_url) completed.push('avatar');
          setCompletedFields(completed);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setAvatarFile(file);
    
    // Create a preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarUrl(reader.result as string);
      
      // Play sound effect for completing a field
      if (!completedFields.includes('avatar')) {
        playPopSound();
        setCompletedFields(prev => [...prev, 'avatar']);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const prevValue = formData[name as keyof typeof formData];
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      clearError(name);
    }
    
    // Play sound effect when a field is filled for the first time
    if (value && !prevValue && !completedFields.includes(name)) {
      playPopSound();
      setCompletedFields(prev => [...prev, name]);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    if (error) {
      setFieldError(name, error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(formData)) {
      toast.error('Please fix the errors below');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let finalAvatarUrl = avatarUrl;
      
      // Upload avatar if a new file was selected
      if (avatarFile) {
        try {
          finalAvatarUrl = await uploadAvatar(avatarFile);
        } catch (avatarError) {
          console.error('Avatar upload failed:', avatarError);
          toast.error('Failed to upload avatar, but continuing with profile creation');
        }
      }

      // Create or update profile
      await createProfile({
        id: user.id,
        full_name: formData.fullName.trim(),
        username: formData.username.trim() || null,
        bio: formData.bio.trim() || null,
        location: formData.location.trim() || null,
        avatar_url: finalAvatarUrl,
        kyc_verified: false,
        push_notifications_enabled: true,
        email_updates_enabled: true,
        ai_repair_tips_enabled: true,
        dark_mode_enabled: false,
        is_admin: false,
        initial_setup_complete: false,
        diagnostic_suggestions_enabled: true
      });

      // Update progress steps
      setSetupSteps(prev => prev.map(step => {
        if (step.id === 'account') return { ...step, completed: true, current: false };
        if (step.id === 'vehicle') return { ...step, current: true };
        return step;
      }));

      // Check if profile is complete enough to award badge
      const isProfileComplete = 
        formData.fullName && 
        formData.username && 
        formData.bio && 
        formData.location && 
        finalAvatarUrl;
      
      if (isProfileComplete) {
        try {
          // Award "Profile Complete" badge
          await awardBadge(user.id, "Profile Complete", "Completed your user profile");
          
          // Show confetti animation
          setShowConfetti(true);
          
          // Play sound effect
          playPopSound();
        } catch (badgeError) {
          console.error('Failed to award Profile Complete badge:', badgeError);
          // Don't fail the profile creation if badge awarding fails
        }
      }

      // Show success message
      toast.success('Profile created successfully');
      
      // Navigate to vehicle setup
      setTimeout(() => {
        navigate('/vehicle-setup');
      }, 1500);
    } catch (err) {
      console.error('Failed to create profile:', err);
      toast.error('Failed to create profile');
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    try {
      // Update progress steps
      setSetupSteps(prev => prev.map(step => {
        if (step.id === 'account') return { ...step, completed: true, current: false };
        if (step.id === 'vehicle') return { ...step, current: true };
        return step;
      }));
      
      // Delay navigation to show the updated progress
      setTimeout(() => {
        navigate('/vehicle-setup');
      }, 1500);
    } catch (error) {
      console.error('Error during skip:', error);
      // Navigate anyway even if there's an error
      navigate('/vehicle-setup');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      {showConfetti && <Confetti duration={3000} onComplete={() => setShowConfetti(false)} />}
      
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white text-center">Setup Your Profile</h1>
          <p className="text-neutral-600 dark:text-gray-400 mt-1 text-center mb-8">
            Tell us a bit about yourself
          </p>
          
          <SetupProgressIndicator steps={setupSteps} className="mb-8" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-neutral-200 dark:border-gray-700 overflow-hidden"
        >
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative mb-4">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                      <User className="h-12 w-12" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                  title="Upload avatar"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              
              {email && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Mail className="h-4 w-4 mr-1" />
                  <span>{email}</span>
                </div>
              )}
            </div>

            {/* Full Name */}
            <FormField
              label="Full Name"
              name="fullName"
              error={errors.fullName}
              required
            >
              <Input
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                onBlur={handleBlur}
                error={!!errors.fullName}
                placeholder="Enter your full name"
              />
            </FormField>

            {/* Username */}
            <FormField
              label="Username"
              name="username"
              error={errors.username}
              description="Choose a unique username for your profile"
            >
              <div className="relative">
                <span className="absolute left-4 top-2 text-gray-500 dark:text-gray-400">@</span>
                <Input
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  error={!!errors.username}
                  className="pl-8"
                  placeholder="username"
                />
              </div>
            </FormField>

            {/* Bio */}
            <FormField
              label="Bio"
              name="bio"
              description="Tell us a bit about yourself (optional)"
            >
              <Textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={3}
                placeholder="Share your interests, expertise, or anything else you'd like others to know"
              />
            </FormField>

            {/* Location */}
            <FormField
              label="Location"
              name="location"
              error={errors.location}
              description="Where are you located? (optional)"
            >
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400 h-5 w-5" />
                <Input
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  error={!!errors.location}
                  className="pl-10"
                  placeholder="City, State"
                />
              </div>
            </FormField>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleSkip}
                disabled={isSubmitting}
                className="px-4 py-2 border border-neutral-300 dark:border-gray-600 rounded-lg text-sm font-medium text-neutral-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-neutral-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Skip for Now
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Saving...</span>
                  </div>
                ) : (
                  'Continue'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfileSetupPage;