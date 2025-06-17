import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Loader2, ArrowRight, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { updateProfile, getProfile } from '../lib/supabase';
import { useFormValidation, ValidationRules } from '../hooks/useFormValidation';
import FormField from '../components/FormField';
import Input from '../components/Input';

const validationRules: ValidationRules = {
  fullName: {
    required: true,
    minLength: 2,
    maxLength: 100
  },
  username: {
    required: true,
    minLength: 3,
    maxLength: 30,
    pattern: /^[a-zA-Z0-9_]+$/,
    custom: (value) => {
      if (!/^[a-zA-Z]/.test(value)) {
        return 'Username must start with a letter';
      }
      return null;
    }
  }
};

const ProfileSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    bio: '',
    location: ''
  });

  const { errors, validateField, validateForm, clearError, setError } = useFormValidation(validationRules);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await getProfile();
        if (profile) {
          // Pre-fill form with existing data if available
          setFormData({
            fullName: profile.full_name || '',
            username: profile.username || '',
            bio: profile.bio || '',
            location: profile.location || ''
          });
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      clearError(name);
    }

    // Real-time validation for username
    if (name === 'username') {
      const error = validateField(name, value);
      if (error) {
        setError(name, error);
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    if (error) {
      setError(name, error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!validateForm({
      fullName: formData.fullName,
      username: formData.username
    })) {
      toast.error('Please fix the errors below');
      return;
    }

    setIsSubmitting(true);

    try {
      await updateProfile({
        full_name: formData.fullName.trim(),
        username: formData.username.trim(),
        bio: formData.bio.trim() || null,
        location: formData.location.trim() || null
      });

      toast.success('Profile updated successfully');
      navigate('/vehicle-setup');
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      
      // Handle specific errors
      if (err.message && err.message.includes('duplicate key value')) {
        if (err.message.includes('profiles_username_key')) {
          setError('username', 'This username is already taken');
          toast.error('Username is already taken');
        } else {
          toast.error('A unique constraint was violated');
        }
      } else {
        toast.error(err.message || 'Failed to update profile');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
            <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Your Profile</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Tell us a bit about yourself to get started
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
        >
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                <div className="h-2 bg-blue-600 dark:bg-blue-400 rounded-full w-1/2"></div>
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500">
                2
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
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
                  autoFocus
                />
              </FormField>

              <FormField
                label="Username"
                name="username"
                error={errors.username}
                required
                description="Choose a unique username (letters, numbers, and underscores only)"
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

              <FormField
                label="Location"
                name="location"
                description="Optional - Where are you located?"
              >
                <Input
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g., Los Angeles, CA"
                />
              </FormField>

              <FormField
                label="Bio"
                name="bio"
                description="Optional - Tell us a bit about yourself"
              >
                <Input
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="I'm a car enthusiast who loves..."
                />
              </FormField>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Saving...</span>
                    </div>
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfileSetupPage;