import React, { useState, useRef } from 'react';
import { Camera, Loader2, Mail, User } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Profile, updateProfile, uploadAvatar } from '../lib/supabase';
import AdminSection from './AdminSection';

interface ProfileSectionProps {
  profile: Profile | null;
  email: string;
  onProfileUpdate: (profile: Profile) => void;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ profile, email, onProfileUpdate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    username: profile?.username || '',
    bio: profile?.bio || '',
    location: profile?.location || ''
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    try {
      setSaving(true);
      const avatarUrl = await uploadAvatar(file);
      const updatedProfile = await updateProfile({ avatar_url: avatarUrl });
      onProfileUpdate(updatedProfile);
      toast.success('Avatar updated successfully');
    } catch (err) {
      console.error('Failed to upload avatar:', err);
      if (err instanceof Error && err.message.includes('Avatar storage is not configured')) {
        toast.error('Avatar uploads are currently unavailable. Please contact support.');
      } else {
        toast.error('Failed to upload avatar');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updatedProfile = await updateProfile(formData);
      onProfileUpdate(updatedProfile);
      toast.success('Profile updated successfully');
    } catch (err) {
      console.error('Failed to update profile:', err);
      
      // Extract more specific error message
      let errorMessage = 'Failed to update profile';
      
      if (err instanceof Error) {
        // Check for specific error types
        if (err.message.includes('duplicate key value violates unique constraint')) {
          if (err.message.includes('profiles_username_key')) {
            errorMessage = 'Username is already taken. Please choose another.';
          } else {
            errorMessage = 'A unique constraint was violated. Please try different values.';
          }
        } else if (err.message.includes('violates check constraint')) {
          errorMessage = 'One or more fields contain invalid values.';
        } else if (err.message.includes('violates not-null constraint')) {
          errorMessage = 'Required fields cannot be empty.';
        } else if (err.message.includes('value too long')) {
          errorMessage = 'One or more fields exceed the maximum length.';
        } else {
          // Use the actual error message if available
          errorMessage = err.message || errorMessage;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
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
            onClick={() => fileInputRef.current?.click()}
            disabled={saving}
            className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
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

        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {profile?.full_name || 'Add your name'}
          </h2>
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mt-1">
            <Mail className="h-4 w-4" />
            <span>{email}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Full Name
          </label>
          <input
            type="text"
            id="full_name"
            value={formData.full_name}
            onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Username
          </label>
          <div className="relative">
            <span className="absolute left-4 top-2 text-gray-500 dark:text-gray-400">@</span>
            <input
              type="text"
              id="username"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 pl-8 pr-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Choose a username"
            />
          </div>
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Bio
          </label>
          <textarea
            id="bio"
            value={formData.bio}
            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
            rows={3}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Tell us about yourself"
          />
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Location
          </label>
          <input
            type="text"
            id="location"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Where are you located?"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Saving...</span>
              </div>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>

      {/* Admin Section */}
      {profile?.is_admin && <AdminSection />}
    </div>
  );
};

export default ProfileSection;