import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

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
  const governmentIdInputRef = useRef<HTMLInputElement>(null);
  const proofOfAddressInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size must be less than 5MB');
        setter(null);
        e.target.value = ''; // Clear the input
        return;
      }
      setter(file);
    }
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
    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('User not authenticated.');

      if (!governmentIdFile || !proofOfAddressFile) {
        throw new Error('Please upload both Government ID and Proof of Address.');
      }

      if (!formData.fullName.trim()) {
        throw new Error('Please enter your full name.');
      }

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

      // Update user's profile to reflect KYC submission
      await supabase
        .from('profiles')
        .update({ kyc_verified: false, initial_setup_complete: true })
        .eq('id', userId);

      toast.success('KYC submitted successfully! We will review your documents and notify you once verified.');
      navigate('/marketplace');
    } catch (err: any) {
      console.error('KYC submission failed:', err);
      setError(err.message || 'Failed to submit KYC request.');
      toast.error(err.message || 'Failed to submit KYC request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name (as per ID) *
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

            {/* Business Name (Optional) */}
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Business Name (Optional)
              </label>
              <input
                type="text"
                id="businessName"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Optional"
              />
            </div>

            {/* Government ID Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Government ID (e.g., Driver's License, Passport) *
              </label>
              <div
                className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                  governmentIdFile 
                    ? 'border-green-400 dark:border-green-500 bg-green-50 dark:bg-green-900/20' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
                onClick={() => governmentIdInputRef.current?.click()}
              >
                {governmentIdFile ? (
                  <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">{governmentIdFile.name}</span>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Click to upload (Max 5MB)
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      JPEG, PNG, or PDF
                    </p>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleFileChange(e, setGovernmentIdFile)}
                  className="hidden"
                  ref={governmentIdInputRef}
                  required
                />
              </div>
            </div>

            {/* Proof of Address Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Proof of Address (e.g., Utility Bill, Bank Statement) *
              </label>
              <div
                className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                  proofOfAddressFile 
                    ? 'border-green-400 dark:border-green-500 bg-green-50 dark:bg-green-900/20' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
                onClick={() => proofOfAddressInputRef.current?.click()}
              >
                {proofOfAddressFile ? (
                  <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">{proofOfAddressFile.name}</span>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Click to upload (Max 5MB)
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      JPEG, PNG, or PDF
                    </p>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleFileChange(e, setProofOfAddressFile)}
                  className="hidden"
                  ref={proofOfAddressInputRef}
                  required
                />
              </div>
            </div>

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
                disabled={isSubmitting || !formData.fullName || !governmentIdFile || !proofOfAddressFile}
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