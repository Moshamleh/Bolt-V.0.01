import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Wrench, Upload, DollarSign, Loader2, Building, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { createServiceRecord, uploadServiceInvoice, Vehicle, getUserVehicles } from '../lib/supabase';
import { useFormValidation, ValidationRules } from '../hooks/useFormValidation';
import FormField from '../components/FormField';
import Input from '../components/Input';
import Textarea from '../components/Textarea';
import Select from '../components/Select';
import { formatFileSize, isValidFileType } from '../lib/utils';

const SERVICE_TYPES = [
  'Oil Change',
  'Brake Service',
  'Tire Rotation',
  'Wheel Alignment',
  'Battery Replacement',
  'Air Filter Replacement',
  'Fluid Change',
  'Spark Plug Replacement',
  'Belt Replacement',
  'Transmission Service',
  'Engine Tune-up',
  'Inspection',
  'Diagnostic',
  'Repair',
  'Other'
];

const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const validationRules: ValidationRules = {
  service_date: {
    required: true,
    custom: (value) => {
      const date = new Date(value);
      if (isNaN(date.getTime())) return 'Please enter a valid date';
      if (date > new Date()) return 'Date cannot be in the future';
      return null;
    }
  },
  service_type: {
    required: true
  },
  description: {
    required: true,
    minLength: 5,
    maxLength: 500
  },
  mileage: {
    required: true,
    min: 0,
    custom: (value) => {
      if (!/^\d+$/.test(value)) return 'Mileage must be a positive number';
      return null;
    }
  },
  cost: {
    required: true,
    min: 0,
    custom: (value) => {
      if (!/^\d+(\.\d{1,2})?$/.test(value)) return 'Please enter a valid amount';
      return null;
    }
  }
};

const AddServiceRecordPage: React.FC = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    service_date: new Date().toISOString().split('T')[0],
    service_type: '',
    description: '',
    mileage: '',
    cost: '',
    service_provider: '',
    notes: ''
  });

  const { errors, validateField, validateForm, clearError, setError: setFieldError } = useFormValidation(validationRules);

  useEffect(() => {
    const loadVehicle = async () => {
      if (!vehicleId) return;
      
      try {
        const vehicles = await getUserVehicles();
        const foundVehicle = vehicles.find(v => v.id === vehicleId);
        
        if (foundVehicle) {
          setVehicle(foundVehicle);
        } else {
          setError('Vehicle not found');
          setTimeout(() => navigate('/vehicles'), 3000);
        }
      } catch (err) {
        console.error('Failed to load vehicle:', err);
        setError('Failed to load vehicle details');
      }
    };

    loadVehicle();
  }, [vehicleId, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setInvoiceError(null);
    
    if (!file) {
      setInvoiceFile(null);
      return;
    }

    // Validate file type
    if (!isValidFileType(file, ALLOWED_FILE_TYPES)) {
      setInvoiceError('Please select a valid file (PDF, JPEG, or PNG)');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setInvoiceError(`File size must be less than ${formatFileSize(MAX_FILE_SIZE)}`);
      return;
    }

    setInvoiceFile(file);
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
    if (!vehicleId) return;

    // Validate form
    if (!validateForm(formData)) {
      toast.error('Please fix the errors below');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let invoiceUrl = '';
      
      // Upload invoice if provided
      if (invoiceFile) {
        try {
          invoiceUrl = await uploadServiceInvoice(invoiceFile, vehicleId);
        } catch (err) {
          console.error('Failed to upload invoice:', err);
          toast.error('Failed to upload invoice, but continuing with record creation');
        }
      }

      // Create service record
      await createServiceRecord({
        vehicle_id: vehicleId,
        service_date: formData.service_date,
        service_type: formData.service_type,
        description: formData.description,
        mileage: parseInt(formData.mileage),
        cost: parseFloat(formData.cost),
        service_provider: formData.service_provider || undefined,
        notes: formData.notes || undefined,
        invoice_url: invoiceUrl || undefined
      });

      toast.success('Service record added successfully');
      navigate('/vehicles');
    } catch (err: any) {
      console.error('Failed to create service record:', err);
      setError(err.message || 'Failed to create service record');
      toast.error('Failed to create service record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getVehicleDisplayName = () => {
    if (!vehicle) return 'Loading...';
    
    if (vehicle.other_vehicle_description) {
      return vehicle.other_vehicle_description;
    }
    
    return `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ''}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/vehicles')}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Vehicles
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Add Service Record</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track maintenance and repairs for {getVehicleDisplayName()}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
        >
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Service Date */}
              <FormField
                label="Service Date"
                name="service_date"
                error={errors.service_date}
                required
              >
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                  <Input
                    type="date"
                    name="service_date"
                    value={formData.service_date}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    error={!!errors.service_date}
                    className="pl-10"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </FormField>

              {/* Service Type */}
              <FormField
                label="Service Type"
                name="service_type"
                error={errors.service_type}
                required
              >
                <div className="relative">
                  <Wrench className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                  <Select
                    name="service_type"
                    value={formData.service_type}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    error={!!errors.service_type}
                    className="pl-10"
                    placeholder="Select service type"
                  >
                    {SERVICE_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </Select>
                </div>
              </FormField>
            </div>

            {/* Description */}
            <FormField
              label="Description"
              name="description"
              error={errors.description}
              required
              description="Briefly describe the service performed"
            >
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                onBlur={handleBlur}
                error={!!errors.description}
                rows={3}
                placeholder="e.g., Changed oil and filter, replaced air filter"
              />
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mileage */}
              <FormField
                label="Mileage"
                name="mileage"
                error={errors.mileage}
                required
              >
                <Input
                  type="number"
                  name="mileage"
                  value={formData.mileage}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  error={!!errors.mileage}
                  min="0"
                  placeholder="e.g., 45000"
                />
              </FormField>

              {/* Cost */}
              <FormField
                label="Cost"
                name="cost"
                error={errors.cost}
                required
              >
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                  <Input
                    type="text"
                    name="cost"
                    value={formData.cost}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    error={!!errors.cost}
                    className="pl-10"
                    placeholder="e.g., 89.99"
                  />
                </div>
              </FormField>
            </div>

            {/* Service Provider */}
            <FormField
              label="Service Provider"
              name="service_provider"
              description="Optional - Name of shop or mechanic"
            >
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                <Input
                  name="service_provider"
                  value={formData.service_provider}
                  onChange={handleInputChange}
                  className="pl-10"
                  placeholder="e.g., Joe's Auto Shop"
                />
              </div>
            </FormField>

            {/* Notes */}
            <FormField
              label="Notes"
              name="notes"
              description="Optional - Any additional information"
            >
              <Textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={2}
                placeholder="e.g., Used synthetic oil, replaced wiper blades"
              />
            </FormField>

            {/* Invoice Upload */}
            <FormField
              label="Invoice / Receipt"
              name="invoice"
              error={invoiceError}
              description="Optional - Upload a copy of your invoice or receipt"
            >
              <div
                className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                  invoiceFile 
                    ? 'border-green-400 dark:border-green-500 bg-green-50 dark:bg-green-900/20' 
                    : invoiceError 
                    ? 'border-red-300 dark:border-red-500' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="cursor-pointer">
                  {invoiceFile ? (
                    <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                      <FileText className="h-5 w-5" />
                      <span className="font-medium">{invoiceFile.name}</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Click to upload a file
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        PDF, JPG, PNG up to {formatFileSize(MAX_FILE_SIZE)}
                      </p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ALLOWED_FILE_TYPES.join(',')}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </FormField>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/vehicles')}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Saving...</span>
                  </div>
                ) : (
                  'Save Record'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default AddServiceRecordPage;