import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase, awardBadge } from '../lib/supabase';
import { useFormValidation, ValidationRules } from '../hooks/useFormValidation';
import FormField from '../components/FormField';
import Input from '../components/Input';
import Textarea from '../components/Textarea';
import Select from '../components/Select';
import { formatFileSize, isValidFileType } from '../lib/utils';
import { awardXp, XP_VALUES } from '../lib/xpSystem';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const validationRules: ValidationRules = {
  title: {
    required: true,
    minLength: 3,
    maxLength: 100
  },
  description: {
    required: true,
    minLength: 20,
    maxLength: 500
  },
  state: {
    required: true
  },
  topic: {
    required: true
  }
};

const CreateClubPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    state: '',
    topic: '',
  });

  const { errors, validateField, validateForm, clearError, setError: setFieldError } = useFormValidation(validationRules);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageError(null);
    
    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    // Validate file type
    if (!isValidFileType(file, ALLOWED_IMAGE_TYPES)) {
      setImageError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setImageError(`File size must be less than ${formatFileSize(MAX_FILE_SIZE)}`);
      return;
    }

    setImageFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate image
    if (!imageFile) {
      setImageError('Please select a cover image');
      return;
    }

    // Validate form
    if (!validateForm(formData)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Upload image
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('club-covers')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('club-covers')
        .getPublicUrl(filePath);

      // Create club with correct column mapping
      const { data: club, error: clubError } = await supabase
        .from('clubs')
        .insert({
          name: formData.title,
          description: formData.description,
          region: formData.state, // Map state to region column
          topic: formData.topic,
          image_url: publicUrl,
        })
        .select()
        .single();

      if (clubError) throw clubError;

      // Auto-join the created club as admin
      await supabase
        .from('club_members')
        .insert({
          club_id: club.id,
          user_id: session.user.id,
          role: 'admin',
        });

      // Award "Club Founder" badge
      try {
        await awardBadge(session.user.id, "Club Founder", "Founded a new club");
        
        // Award XP for creating a club
        await awardXp(session.user.id, XP_VALUES.CREATE_CLUB, "Created a new club");
        
        // Show XP toast notification
        toast.success(`🎉 +${XP_VALUES.CREATE_CLUB} XP added to your profile!`);
      } catch (badgeError) {
        console.error('Failed to award Club Founder badge:', badgeError);
        // Don't fail the club creation if badge awarding fails
      }

      navigate(`/clubs/${club.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create club');
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      clearError(name);
    }

    // Real-time validation for title and description
    if (['title', 'description'].includes(name)) {
      const error = validateField(name, value);
      if (error) {
        setFieldError(name, error);
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    if (error) {
      setFieldError(name, error);
    }
  };

  // List of US states
  const US_STATES = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 
    'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 
    'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 
    'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 
    'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 
    'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 
    'Wisconsin', 'Wyoming'
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/clubs')}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Clubs
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create a Club</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Start your own automotive community</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cover Image */}
            <FormField
              label="Cover Image"
              name="image"
              error={imageError}
              required
            >
              <div
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors bg-blue-50 dark:bg-blue-900/20 ${
                  imagePreview 
                    ? 'border-green-400 dark:border-green-500' 
                    : imageError 
                    ? 'border-red-300 dark:border-red-500' 
                    : 'border-blue-300 dark:border-blue-600 hover:border-blue-400 dark:hover:border-blue-500'
                }`}
              >
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="mx-auto max-h-48 rounded-lg shadow-md"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setImageFile(null);
                        setImageError(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors shadow-md"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div
                    className="cursor-pointer group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mx-auto h-16 w-16 text-blue-400 dark:text-blue-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
                    <p className="mt-4 text-sm text-blue-600 dark:text-blue-400 font-medium">
                      Click to upload your club banner 🖼️
                    </p>
                    <p className="text-xs text-blue-500 dark:text-blue-300 mt-1">
                      PNG, JPG, GIF, WebP up to {formatFileSize(MAX_FILE_SIZE)}
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ALLOWED_IMAGE_TYPES.join(',')}
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </FormField>

            {/* Title */}
            <FormField
              label="Club Name"
              name="title"
              error={errors.title}
              required
            >
              <Input
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                onBlur={handleBlur}
                error={!!errors.title}
                placeholder="e.g., BMW M Legends 🏁"
                className="transition-all duration-300 focus:shadow-glow"
              />
            </FormField>

            {/* Description */}
            <FormField
              label="Description"
              name="description"
              error={errors.description}
              required
            >
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                onBlur={handleBlur}
                error={!!errors.description}
                rows={4}
                placeholder="What's your club all about? 💬"
                className="transition-all duration-300 focus:shadow-glow"
              />
            </FormField>

            {/* State */}
            <FormField
              label="State"
              name="state"
              error={errors.state}
              required
            >
              <Select
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                onBlur={handleBlur}
                error={!!errors.state}
                placeholder="Select a state 📍"
                className="transition-all duration-300 focus:shadow-glow"
              >
                {US_STATES.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </Select>
            </FormField>

            {/* Topic */}
            <FormField
              label="Primary Topic"
              name="topic"
              error={errors.topic}
              required
            >
              <Select
                name="topic"
                value={formData.topic}
                onChange={handleInputChange}
                onBlur={handleBlur}
                error={!!errors.topic}
                placeholder="Select a topic 🔖"
                className="transition-all duration-300 focus:shadow-glow"
              >
                <option value="Performance">Performance 🚀</option>
                <option value="Classic">Classic 🏆</option>
                <option value="Restoration">Restoration 🔧</option>
                <option value="Racing">Racing 🏎️</option>
                <option value="Off-Road">Off-Road 🏞️</option>
              </Select>
            </FormField>

            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/50 p-4 text-sm text-red-700 dark:text-red-200">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-blue-500/20"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Create Club'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateClubPage;