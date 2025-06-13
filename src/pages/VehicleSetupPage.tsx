import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import supabase from '../lib/supabase';
import { useFormValidation, ValidationRules } from '../hooks/useFormValidation';
import FormField from '../components/FormField';
import Input from '../components/Input';
import Textarea from '../components/Textarea';
import Select from '../components/Select';

const YEARS = Array.from({ length: 75 }, (_, i) => new Date().getFullYear() - i);
const MAKES = [
  'Acura', 'Alfa Romeo', 'Aston Martin', 'Audi', 'Bentley', 'BMW', 'Buick',
  'Cadillac', 'Chevrolet', 'Chrysler', 'Dodge', 'Ferrari', 'Fiat', 'Ford',
  'Genesis', 'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jaguar', 'Jeep', 'Kia',
  'Lamborghini', 'Land Rover', 'Lexus', 'Lincoln', 'Maserati', 'Mazda',
  'McLaren', 'Mercedes-Benz', 'MINI', 'Mitsubishi', 'Nissan', 'Porsche', 'Ram',
  'Rolls-Royce', 'Subaru', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo'
];

// Example model data - in a real app, this would be more comprehensive
const MODELS: Record<string, string[]> = {
  'BMW': ['1 Series', '2 Series', '3 Series', '4 Series', '5 Series', '6 Series', '7 Series', '8 Series', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'Z4', 'i3', 'i4', 'i7', 'i8', 'iX'],
  'Toyota': ['4Runner', 'Avalon', 'Camry', 'Corolla', 'Highlander', 'Land Cruiser', 'Prius', 'RAV4', 'Sequoia', 'Sienna', 'Tacoma', 'Tundra', 'Venza'],
  'Honda': ['Accord', 'Civic', 'CR-V', 'Element', 'Fit', 'HR-V', 'Insight', 'Odyssey', 'Passport', 'Pilot', 'Ridgeline'],
  // Add more makes and models as needed
};

const standardVehicleRules: ValidationRules = {
  make: {
    required: true
  },
  model: {
    required: true
  },
  year: {
    required: true,
    min: 1900,
    max: new Date().getFullYear() + 1
  }
};

const otherVehicleRules: ValidationRules = {
  otherVehicleDescription: {
    required: true,
    minLength: 10,
    maxLength: 500
  }
};

const VehicleSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOtherVehicle, setIsOtherVehicle] = useState(false);
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    trim: '',
    vin: '',
    otherVehicleDescription: ''
  });

  const currentRules = isOtherVehicle ? otherVehicleRules : standardVehicleRules;
  const { errors, validateField, validateForm, clearError, setError } = useFormValidation(currentRules);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form based on current mode
    const dataToValidate = isOtherVehicle 
      ? { otherVehicleDescription: formData.otherVehicleDescription }
      : { make: formData.make, model: formData.model, year: formData.year };
    
    if (!validateForm(dataToValidate)) {
      toast.error('Please fix the errors below');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const vehicleData = {
        user_id: session.user.id,
        make: isOtherVehicle ? '' : formData.make,
        model: isOtherVehicle ? '' : formData.model,
        year: isOtherVehicle ? null : formData.year,
        trim: isOtherVehicle ? '' : formData.trim,
        vin: formData.vin,
        other_vehicle_description: isOtherVehicle ? formData.otherVehicleDescription : null
      };

      const { error } = await supabase
        .from('vehicles')
        .insert(vehicleData);

      if (error) throw error;

      toast.success('Vehicle added successfully');
      navigate('/diagnostic');
    } catch (err) {
      console.error('Failed to save vehicle:', err);
      toast.error('Failed to save vehicle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      clearError(name);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    if (error) {
      setError(name, error);
    }
  };

  const handleOtherVehicleToggle = (checked: boolean) => {
    setIsOtherVehicle(checked);
    // Clear all errors when switching modes
    Object.keys(errors).forEach(key => clearError(key));
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Vehicle Setup</h1>
          <p className="text-neutral-600 dark:text-gray-400 mt-1">Add your vehicle details to get started</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-neutral-100 dark:bg-gray-800 rounded-xl shadow-sm border border-neutral-200 dark:border-gray-700 overflow-hidden"
        >
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="flex items-center gap-2 mb-6">
              <input
                type="checkbox"
                id="otherVehicle"
                checked={isOtherVehicle}
                onChange={(e) => handleOtherVehicleToggle(e.target.checked)}
                className="rounded border-neutral-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="otherVehicle" className="text-sm text-neutral-700 dark:text-gray-300">
                Other Vehicle (not listed)
              </label>
            </div>

            {isOtherVehicle ? (
              <FormField
                label="Vehicle Description"
                name="otherVehicleDescription"
                error={errors.otherVehicleDescription}
                required
                description="Describe your vehicle (e.g., Custom built electric car, Golf cart, etc.)"
              >
                <Textarea
                  name="otherVehicleDescription"
                  value={formData.otherVehicleDescription}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  error={!!errors.otherVehicleDescription}
                  rows={3}
                  placeholder="Describe your vehicle (e.g., Custom built electric car, Golf cart, etc.)"
                />
              </FormField>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <Select
                      name="model"
                      value={formData.model}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      error={!!errors.model}
                      disabled={!formData.make}
                      placeholder="Select Model"
                    >
                      {formData.make && MODELS[formData.make]?.map(model => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </Select>
                  </FormField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                  <FormField
                    label="Trim"
                    name="trim"
                    description="Optional"
                  >
                    <Input
                      name="trim"
                      value={formData.trim}
                      onChange={handleInputChange}
                      placeholder="e.g., Sport, Limited, etc."
                    />
                  </FormField>
                </div>
              </>
            )}

            <FormField
              label="VIN Number"
              name="vin"
              description="Optional - Your VIN helps us get the most accurate results"
            >
              <Input
                name="vin"
                value={formData.vin}
                onChange={handleInputChange}
                placeholder="Enter your VIN"
              />
              <div className="mt-2 flex items-start gap-2 text-sm text-neutral-600 dark:text-gray-400">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-blue-500 mt-0.5" />
                <p>
                  Your VIN helps us get the most accurate results — from vehicle history and recalls
                  to the exact parts it needs. It's like a fingerprint for your car.
                </p>
              </div>
            </FormField>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/diagnostic')}
                className="px-4 py-2 border border-neutral-300 dark:border-gray-600 rounded-lg text-sm font-medium text-neutral-700 dark:text-gray-300 bg-neutral-100 dark:bg-gray-800 hover:bg-neutral-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Skip for Now
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Save Vehicle'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default VehicleSetupPage;