import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useFormValidation, ValidationRules } from '../../hooks/useFormValidation';
import FormField from '../../components/FormField';
import Input from '../../components/Input';
import { formatFileSize, isValidFileType } from '../../lib/utils';
import { moderateContent } from '../../lib/aiModeration';

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const validationRules: ValidationRules = {
  fullName: {
    required: true,
    minLength: 2,
    maxLength: 100
  },
  businessName: {
    maxLength: 100
  }
};

const SellerKYC: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    businessName: '',
  });
  const [governmentIdFile, setGovernmentIdFile] = useState<File | null>(null);
  const [proofOfAddressFile, setProofOfAddressFile] = useState<File | null>(null);
  const [governmentIdError, setGovernmentIdError] = useState<string | null>(null);
  const [proofOfAddressError, setProofOfAddressError] = useState<string | null>(null);
  const governmentIdInputRef = useRef<HTMLInputElement>(null);
  const proofOfAddressInputRef = useRef<HTMLInputElement>(null);

  const { errors, validateField, validateForm, clearError, setError: setFieldError } = useFormValidation(validationRules);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>, 
    setter: React.Dispatch<React.SetStateAction<File | null>>,
    errorSetter: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    const file = e.target.files?.[0];
    errorSetter(null);
    
    if (!file) {
      setter(null);
      return;
    }

    // Validate file type
    if (!isValidFileType(file, ALLOWED_FILE_TYPES)) {
      errorSetter('Please select a valid file (JPEG, PNG, or PDF)');
      setter(null);
      e.target.value = '';
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      errorSetter(`File size must be less than ${formatFileSize(MAX_FILE_SIZE)}`);
      setter(null);
      e.target.value = '';
      return;
    }

    setter(file);
  };

  const uploadFile = async (file: File, bucket: string, userId: string, fileType: 'gov_id' | 'proof_address') => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${fileType}_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate files
    if (!governmentIdFile) {
      setGovernmentIdError('Please upload your Government ID');
      return;
    }

    if (!proofOfAddressFile) {
      setProofOfAddressError('Please upload your Proof of Address');
      return;
    }

    // Validate form
    if (!validateForm(formData)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('User not authenticated.');

      const userId = session.user.id;

      // Upload files
      const [governmentIdUrl, proofOfAddressUrl] = await Promise.all([
        uploadFile(governmentIdFile, 'kyc-documents', userId, 'gov_id'),
        uploadFile(proofOfAddressFile, 'kyc-documents', userId, 'proof_address')
      ]);

      // Insert data into kyc_requests table
      const { error: insertError } = await supabase
        .from('kyc_requests')
        .insert({
          user_id: userId,
          full_name: formData.fullName.trim(),
          business_name: formData.businessName.trim() || null,
          gov_id_url: governmentIdUrl,
          proof_of_address_url: proofOfAddressUrl,
          status: 'pending',
        });

      if (insertError) throw insertError;

      // Send to content moderation
      try {
        await moderateContent({
          type: "kyc",
          content: formData.fullName + "\n" + (formData.businessName || ""),
          user_id: userId,
        });
        
        toast.success("⚡ Sent to Agents for review. You'll be notified once approved!");
      } catch (moderationError) {
        console.error('Content moderation request failed:', moderationError);
        // Continue with the flow even if moderation request fails
      }

      // Update user's profile to reflect KYC submission
      await supabase
        .from('profiles')
        .update({ kyc_verified: false, initial_setup_complete: true })
        .eq('id', userId);

      // Navigate to success page instead of showing toast
      navigate('/kyc/success');
    } catch (err: any) {
      console.error('KYC submission failed:', err);
      setError(err.message || 'Failed to submit KYC request.');
      toast.error(err.message || 'Failed to submit KYC request.');
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      clearError(name);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    if (error) {
      setFieldError(name, error);
    }
  };

  const FileUploadField: React.FC<{
    label: string;
    file: File | null;
    error: string | null;
    inputRef: React.RefObject<HTMLInputElement>;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
  }> = ({ label, file, error, inputRef, onChange, required = false }) => (
    <FormField
      label={label}
      name={label.toLowerCase().replace(/\s+/g, '_')}
      error={error}
      required={required}
    >
      <div
        className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          file 
            ? 'border-green-400 dark:border-green-500 bg-green-50 dark:bg-green-900/20' 
            : error 
            ? 'border-red-300 dark:border-red-500' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onClick={() => inputRef.current?.click()}
      >
        {file ? (
          <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">{file.name}</span>
          </div>
        ) : (
          <>
            <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Click to upload (Max {formatFileSize(MAX_FILE_SIZE)})
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              JPEG, PNG, or PDF
            </p>
          </>
        )}
        <input
          type="file"
          accept={ALLOWED_FILE_TYPES.join(',')}
          onChange={onChange}
          className="hidden"
          ref={inputRef}
          required={required}
        />
      </div>
    </FormField>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
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
          className="mb-6"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Seller Verification (KYC)</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Please provide the following information to verify your identity and start selling parts.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <FormField
              label="Full Name (as per ID)"
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
                placeholder="John Doe"
              />
            </FormField>

            {/* Business Name (Optional) */}
            <FormField
              label="Business Name"
              name="businessName"
              error={errors.businessName}
              description="Optional"
            >
              <Input
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                onBlur={handleBlur}
                error={!!errors.businessName}
                placeholder="Optional"
              />
            </FormField>

            {/* Government ID Upload */}
            <FileUploadField
              label="Government ID (e.g., Driver's License, Passport)"
              file={governmentIdFile}
              error={governmentIdError}
              inputRef={governmentIdInputRef}
              onChange={(e) => handleFileChange(e, setGovernmentIdFile, setGovernmentIdError)}
              required
            />

            {/* Proof of Address Upload */}
            <FileUploadField
              label="Proof of Address (e.g., Utility Bill, Bank Statement)"
              file={proofOfAddressFile}
              error={proofOfAddressError}
              inputRef={proofOfAddressInputRef}
              onChange={(e) => handleFileChange(e, setProofOfAddressFile, setProofOfAddressError)}
              required
            />

            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/50 p-4 text-sm text-red-700 dark:text-red-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Submitting...
                  </div>
                ) : (
                  'Submit for Review'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default SellerKYC;