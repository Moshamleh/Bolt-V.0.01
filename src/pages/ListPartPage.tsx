import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { createPart, checkKycStatus, updateProfile, awardBadge } from '../lib/supabase';
import { useFormValidation, ValidationRules } from '../hooks/useFormValidation';
import FormField from '../components/FormField';
import Input from '../components/Input';
import Textarea from '../components/Textarea';
import Select from '../components/Select';
import { formatFileSize, isValidFileType } from '../lib/utils';
import Confetti from '../components/Confetti';

const YEARS = Array.from({ length: 75 }, (_, i) => new Date().getFullYear() - i);
const MAKES = [
  'Acura', 'Alfa Romeo', 'Aston Martin', 'Audi', 'Bentley', 'BMW', 'Buick',
  'Cadillac', 'Chevrolet', 'Chrysler', 'Dodge', 'Ferrari', 'Fiat', 'Ford',
  'Genesis', 'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jaguar', 'Jeep', 'Kia',
  'Lamborghini', 'Land Rover', 'Lexus', 'Lincoln', 'Maserati', 'Mazda',
  'McLaren', 'Mercedes-Benz', 'MINI', 'Mitsubishi', 'Nissan', 'Porsche', 'Ram',
  'Rolls-Royce', 'Subaru', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo'
];

const CATEGORIES = [
  { value: 'engine', label: 'Engine Parts' },
  { value: 'brakes', label: 'Brakes' },
  { value: 'suspension', label: 'Suspension' },
  { value: 'transmission', label: 'Transmission' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'interior', label: 'Interior' },
  { value: 'exterior', label: 'Exterior' },
  { value: 'other', label: 'Other' }
];

const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'used', label: 'Used' },
  { value: 'refurbished', label: 'Refurbished' }
];

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const validationRules: ValidationRules = {
  title: {
    required: true,
    minLength: 10,
    maxLength: 100
  },
  price: {
    required: true,
    min: 0.01,
    custom: (value) => {
      const num = parseFloat(value);
      if (isNaN(num)) return 'Please enter a valid price';
      if (num <= 0) return 'Price must be greater than 0';
      return null;
    }
  },
  make: {
    required: true
  },
  model: {
    required: true,
    minLength: 1,
    maxLength: 50
  },
  year: {
    required: true,
    min: 1900,
    max: new Date().getFullYear() + 1
  },
  location: {
    required: true,
    minLength: 2,
    maxLength: 100
  },
  description: {
    required: true,
    minLength: 30,
    maxLength: 2000
  },
  category: {
    required: true
  },
  condition: {
    required: true
  },
  part_number: {
    maxLength: 50
  },
  oem_number: {
    maxLength: 50
  }
};

const ListPartPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isKycVerified, setIsKycVerified] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    trim: '',
    condition: 'used' as 'new' | 'used' | 'refurbished',
    location: '',
    category: '',
    vehicle_fit: '',
    part_number: '',
    oem_number: ''
  });

  const { errors, validateField, validateForm, clearError, setError: setFieldError } = useFormValidation(validationRules);

  useEffect(() => {
    const checkKyc = async () => {
      try {
        const verified = await checkKycStatus();
        setIsKycVerified(verified);
      } catch (err) {
        console.error('Failed to check KYC status:', err);
        setError('Failed to verify KYC status');
        setIsKycVerified(false);
      }
    };

    checkKyc();
  }, []);

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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      clearError(name);
    }
    
    // Real-time validation for certain fields
    if (['title', 'price', 'description', 'part_number', 'oem_number'].includes(name)) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isKycVerified) return;

    // Validate image
    if (!imageFile) {
      setImageError('Please select an image');
      return;
    }

    // Validate form
    if (!validateForm(formData)) {
      toast.error('Please fix the errors below');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) {
        throw new Error('Please enter a valid price');
      }

      await createPart({
        ...formData,
        price,
        year: Number(formData.year),
        condition: formData.condition,
        image_url: '',
      });

      // Check if this is the user's first listing and award badge
      try {
        // Update the profile to mark first_part_listed as true
        await updateProfile({ first_part_listed: true });
        
        // Award the badge
        await awardBadge(undefined, "First Listing", "Listed your first part in the marketplace");
        
        // Show confetti animation
        setShowConfetti(true);
      } catch (badgeError) {
        console.error('Failed to award First Listing badge:', badgeError);
        // Don't fail the part creation if badge awarding fails
      }

      toast.success('Part listed successfully');
      navigate('/marketplace');
    } catch (err: any) {
      console.error('Failed to create listing:', err);
      setError(err.message || 'Failed to create listing');
      toast.error('Failed to create listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isKycVerified === null) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
      </div>
    );
  }

  if (isKycVerified === false) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
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
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center"
          >
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-16 w-16 text-amber-500 dark:text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              KYC Verification Required
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              To list parts in the marketplace, you need to complete the KYC verification process.
              This helps ensure a safe and trusted marketplace for all users.
            </p>
            <button
              onClick={() => navigate('/kyc')}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Complete KYC Verification
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      {showConfetti && <Confetti duration={3000} onComplete={() => setShowConfetti(false)} />}
      
      <div className="max-w-2xl mx-auto">
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
          className="mb-6"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">List a Part</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Fill in the details about your part</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <FormField
              label="Part Image"
              name="image"
              error={imageError}
              required
            >
              <div
                className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                  imagePreview 
                    ? 'border-green-400 dark:border-green-500' 
                    : imageError 
                    ? 'border-red-300 dark:border-red-500' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="mx-auto max-h-48 rounded-lg"
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
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div
                    className="cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
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
              label="Title"
              name="title"
              error={errors.title}
              required
              description="Be descriptive and specific (e.g., BMW M3 Brake Rotors)"
            >
              <Input
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                onBlur={handleBlur}
                error={!!errors.title}
                placeholder="e.g., BMW M3 Brake Rotors"
              />
            </FormField>

            {/* Part Numbers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Part Number"
                name="part_number"
                error={errors.part_number}
                description="Manufacturer's part number"
              >
                <Input
                  name="part_number"
                  value={formData.part_number}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  error={!!errors.part_number}
                  placeholder="e.g., 34116797602"
                />
              </FormField>

              <FormField
                label="OEM Number"
                name="oem_number"
                error={errors.oem_number}
                description="Original equipment manufacturer number"
              >
                <Input
                  name="oem_number"
                  value={formData.oem_number}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  error={!!errors.oem_number}
                  placeholder="e.g., LR051630"
                />
              </FormField>
            </div>

            {/* Category */}
            <FormField
              label="Category"
              name="category"
              error={errors.category}
              required
            >
              <Select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                onBlur={handleBlur}
                error={!!errors.category}
                placeholder="Select a category"
              >
                {CATEGORIES.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </Select>
            </FormField>

            {/* Price */}
            <FormField
              label="Price (USD)"
              name="price"
              error={errors.price}
              required
            >
              <Input
                type="number"
                name="price"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleInputChange}
                onBlur={handleBlur}
                error={!!errors.price}
                placeholder="0.00"
              />
            </FormField>

            {/* Car Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                label="Make"
                name="make"
                error={errors.make}
                required
              >
                <Select
                  name="make"
                  value={formData.make}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  error={!!errors.make}
                  placeholder="Select Make"
                >
                  {MAKES.map(make => (
                    <option key={make} value={make}>{make}</option>
                  ))}
                </Select>
              </FormField>

              <FormField
                label="Model"
                name="model"
                error={errors.model}
                required
              >
                <Input
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  error={!!errors.model}
                  placeholder="e.g., M3"
                />
              </FormField>

              <FormField
                label="Year"
                name="year"
                error={errors.year}
                required
              >
                <Select
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  error={!!errors.year}
                >
                  {YEARS.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </Select>
              </FormField>
            </div>

            {/* Condition */}
            <FormField
              label="Condition"
              name="condition"
              error={errors.condition}
              required
            >
              <div className="grid grid-cols-3 gap-4">
                {CONDITIONS.map(condition => (
                  <label
                    key={condition.value}
                    className={`flex items-center justify-center px-4 py-2 border rounded-lg cursor-pointer transition-colors ${
                      formData.condition === condition.value
                        ? 'bg-blue-50 dark:bg-blue-900/50 border-blue-500 dark:border-blue-400 text-blue-700 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="condition"
                      value={condition.value}
                      checked={formData.condition === condition.value}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    {condition.label}
                  </label>
                ))}
              </div>
            </FormField>

            {/* Location */}
            <FormField
              label="Location"
              name="location"
              error={errors.location}
              required
            >
              <Input
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                onBlur={handleBlur}
                error={!!errors.location}
                placeholder="e.g., Los Angeles, CA"
              />
            </FormField>

            {/* Vehicle Fit */}
            <FormField
              label="Vehicle Compatibility"
              name="vehicle_fit"
              description="Optional: Specify which vehicles this part fits"
            >
              <Textarea
                name="vehicle_fit"
                value={formData.vehicle_fit}
                onChange={handleInputChange}
                rows={2}
                placeholder="e.g., Fits BMW M3 E46 2000-2006, May also fit other BMW 3 series models"
              />
            </FormField>

            {/* Description */}
            <FormField
              label="Description"
              name="description"
              error={errors.description}
              required
              description="Provide detailed information about the part's condition, specifications, and any other relevant details"
            >
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                onBlur={handleBlur}
                error={!!errors.description}
                rows={4}
                placeholder="Describe the part's condition, specifications, and any other relevant details"
              />
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
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'List Part'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ListPartPage;