import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import TextareaAutosize from 'react-textarea-autosize';
import toast from 'react-hot-toast';
import { createPart, checkKycStatus } from '../lib/supabase';

interface FormErrors {
  title?: string;
  price?: string;
  make?: string;
  model?: string;
  year?: string;
  location?: string;
  description?: string;
  category?: string;
  image?: string;
}

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

const ListPartPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isKycVerified, setIsKycVerified] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
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
    vehicle_fit: ''
  });

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

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    let isValid = true;

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
      isValid = false;
    } else if (formData.title.length < 10) {
      errors.title = 'Title must be at least 10 characters';
      isValid = false;
    }

    const price = parseFloat(formData.price);
    if (!formData.price) {
      errors.price = 'Price is required';
      isValid = false;
    } else if (isNaN(price) || price <= 0) {
      errors.price = 'Please enter a valid price';
      isValid = false;
    }

    if (!formData.make.trim()) {
      errors.make = 'Make is required';
      isValid = false;
    }

    if (!formData.model.trim()) {
      errors.model = 'Model is required';
      isValid = false;
    }

    if (!formData.year) {
      errors.year = 'Year is required';
      isValid = false;
    } else if (formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
      errors.year = 'Please enter a valid year';
      isValid = false;
    }

    if (!formData.location.trim()) {
      errors.location = 'Location is required';
      isValid = false;
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
      isValid = false;
    } else if (formData.description.length < 30) {
      errors.description = 'Description must be at least 30 characters';
      isValid = false;
    }

    if (!formData.category) {
      errors.category = 'Category is required';
      isValid = false;
    }

    if (!imagePreview) {
      errors.image = 'Image is required';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFormErrors(prev => ({ ...prev, image: 'Image size must be less than 5MB' }));
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setFormErrors(prev => ({ ...prev, image: undefined }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isKycVerified) return;

    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) {
        throw new Error('Please enter a valid price');
      }

      const imageFile = fileInputRef.current?.files?.[0];
      if (!imageFile) {
        throw new Error('Please select an image');
      }

      await createPart({
        ...formData,
        price,
        year: Number(formData.year),
        condition: formData.condition,
        image_url: '',
      });

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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear the error for this field when the user starts typing
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
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
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Part Image
              </label>
              <div
                className={`relative border-2 border-dashed rounded-lg p-4 text-center ${
                  imagePreview 
                    ? 'border-green-400 dark:border-green-500' 
                    : formErrors.image 
                    ? 'border-red-300 dark:border-red-500' 
                    : 'border-gray-300 dark:border-gray-600'
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
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
              {formErrors.image && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.image}</p>
              )}
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`w-full rounded-lg border ${
                  formErrors.title 
                    ? 'border-red-300 dark:border-red-500' 
                    : 'border-gray-300 dark:border-gray-600'
                } px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="e.g., BMW M3 Brake Rotors"
              />
              {formErrors.title && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.title}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={`w-full rounded-lg border ${
                  formErrors.category 
                    ? 'border-red-300 dark:border-red-500' 
                    : 'border-gray-300 dark:border-gray-600'
                } px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              >
                <option value="">Select a category</option>
                {CATEGORIES.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              {formErrors.category && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.category}</p>
              )}
            </div>

            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Price (USD)
              </label>
              <input
                type="number"
                id="price"
                name="price"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleInputChange}
                className={`w-full rounded-lg border ${
                  formErrors.price 
                    ? 'border-red-300 dark:border-red-500' 
                    : 'border-gray-300 dark:border-gray-600'
                } px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="0.00"
              />
              {formErrors.price && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.price}</p>
              )}
            </div>

            {/* Car Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="make" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Make
                </label>
                <select
                  id="make"
                  name="make"
                  value={formData.make}
                  onChange={handleInputChange}
                  className={`w-full rounded-lg border ${
                    formErrors.make 
                      ? 'border-red-300 dark:border-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  } px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  <option value="">Select Make</option>
                  {MAKES.map(make => (
                    <option key={make} value={make}>{make}</option>
                  ))}
                </select>
                {formErrors.make && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.make}</p>
                )}
              </div>

              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Model
                </label>
                <input
                  type="text"
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  className={`w-full rounded-lg border ${
                    formErrors.model 
                      ? 'border-red-300 dark:border-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  } px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="e.g., M3"
                />
                {formErrors.model && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.model}</p>
                )}
              </div>

              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Year
                </label>
                <select
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  className={`w-full rounded-lg border ${
                    formErrors.year 
                      ? 'border-red-300 dark:border-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  } px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  {YEARS.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                {formErrors.year && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.year}</p>
                )}
              </div>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Condition
              </label>
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
            </div>

            {/* Location */}
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
                className={`w-full rounded-lg border ${
                  formErrors.location 
                    ? 'border-red-300 dark:border-red-500' 
                    : 'border-gray-300 dark:border-gray-600'
                } px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="e.g., Los Angeles, CA"
              />
              {formErrors.location && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.location}</p>
              )}
            </div>

            {/* Vehicle Fit */}
            <div>
              <label htmlFor="vehicle_fit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Vehicle Compatibility (Optional)
              </label>
              <TextareaAutosize
                id="vehicle_fit"
                name="vehicle_fit"
                value={formData.vehicle_fit}
                onChange={handleInputChange}
                minRows={2}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Fits BMW M3 E46 2000-2006, May also fit other BMW 3 series models"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <TextareaAutosize
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                minRows={4}
                className={`w-full rounded-lg border ${
                  formErrors.description 
                    ? 'border-red-300 dark:border-red-500' 
                    : 'border-gray-300 dark:border-gray-600'
                } px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Describe the part's condition, specifications, and any other relevant details"
              />
              {formErrors.description && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.description}</p>
              )}
            </div>

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