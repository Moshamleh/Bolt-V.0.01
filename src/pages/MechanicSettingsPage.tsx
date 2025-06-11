import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wrench, Loader2, DollarSign, Globe, User } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Mechanic, getMechanicProfile, upsertMechanicProfile } from '../lib/supabase';

const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Chinese',
  'Japanese',
  'Korean',
  'Arabic'
];

const EXPERTISE_AREAS = [
  'Engine Repair',
  'Transmission',
  'Brakes',
  'Suspension',
  'Electrical Systems',
  'Air Conditioning',
  'Diagnostics',
  'Oil Changes',
  'Tire Service',
  'Body Work',
  'Paint',
  'Welding',
  'Performance Tuning',
  'Hybrid/Electric Vehicles',
  'Diesel Engines',
  'Classic Cars',
  'Motorcycles',
  'Heavy Duty Trucks'
];

const MechanicSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    hourly_rate: '',
    languages: [] as string[],
    specialties: [] as string[],
    location: '',
    phone: '',
    experience: '',
    is_certified: false
  });

  useEffect(() => {
    const loadMechanicProfile = async () => {
      try {
        const profile = await getMechanicProfile();
        if (profile) {
          setFormData({
            full_name: profile.full_name || '',
            bio: profile.bio || '',
            hourly_rate: profile.hourly_rate?.toString() || '',
            languages: profile.languages || [],
            specialties: profile.specialties || [],
            location: profile.location || '',
            phone: profile.phone || '',
            experience: profile.experience || '',
            is_certified: profile.is_certified || false
          });
        }
      } catch (err) {
        console.error('Failed to load mechanic profile:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    loadMechanicProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleLanguageToggle = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }));
  };

  const handleExpertiseToggle = (expertise: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(expertise)
        ? prev.specialties.filter(e => e !== expertise)
        : [...prev.specialties, expertise]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const profileData: Partial<Mechanic> = {
        full_name: formData.full_name.trim(),
        bio: formData.bio.trim(),
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : undefined,
        languages: formData.languages,
        specialties: formData.specialties,
        location: formData.location.trim(),
        phone: formData.phone.trim(),
        experience: formData.experience.trim(),
        is_certified: formData.is_certified
      };

      await upsertMechanicProfile(profileData);
      toast.success('Profile updated successfully');
    } catch (err) {
      console.error('Failed to save profile:', err);
      setError('Failed to save profile');
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3">
            <Wrench className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mechanic Settings</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your professional profile and service details
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
        >
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="City, State"
                  />
                </div>

                <div>
                  <label htmlFor="hourly_rate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <DollarSign className="h-4 w-4 inline mr-1" />
                    Hourly Rate (USD)
                  </label>
                  <input
                    type="number"
                    id="hourly_rate"
                    name="hourly_rate"
                    value={formData.hourly_rate}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tell customers about your experience and expertise..."
                />
              </div>

              <div className="mt-6">
                <label htmlFor="experience" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Experience
                </label>
                <textarea
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe your professional experience..."
                />
              </div>

              <div className="mt-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_certified"
                    checked={formData.is_certified}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    I am a certified mechanic
                  </span>
                </label>
              </div>
            </div>

            {/* Languages */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                <Globe className="h-5 w-5 inline mr-2" />
                Languages
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Select the languages you can communicate in with customers
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {LANGUAGES.map((language) => (
                  <button
                    key={language}
                    type="button"
                    onClick={() => handleLanguageToggle(language)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      formData.languages.includes(language)
                        ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-500 dark:border-blue-400 text-blue-700 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {language}
                  </button>
                ))}
              </div>
            </div>

            {/* Areas of Expertise */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                <Wrench className="h-5 w-5 inline mr-2" />
                Areas of Expertise
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Select your areas of specialization and expertise
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {EXPERTISE_AREAS.map((expertise) => (
                  <button
                    key={expertise}
                    type="button"
                    onClick={() => handleExpertiseToggle(expertise)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors text-left ${
                      formData.specialties.includes(expertise)
                        ? 'bg-green-100 dark:bg-green-900/50 border-green-500 dark:border-green-400 text-green-700 dark:text-green-300'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {expertise}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/50 p-4 text-sm text-red-700 dark:text-red-200">
                {error}
              </div>
            )}

            <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Saving Changes...
                  </div>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default MechanicSettingsPage;