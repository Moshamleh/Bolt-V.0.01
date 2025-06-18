import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, AlertCircle, Loader2, CheckCircle, Info, Zap, PenTool as Tool, Gauge, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { supabase, createVehicle, getProfile, awardBadge } from '../lib/supabase';
import { useFormValidation, ValidationRules } from '../hooks/useFormValidation';
import FormField from '../components/FormField';
import Input from '../components/Input';
import Textarea from '../components/Textarea';
import Select from '../components/Select';
import SetupProgressIndicator, { Step } from '../components/SetupProgressIndicator';
import { playPopSound } from '../lib/utils';
import Confetti from '../components/Confetti';
import { awardXp, XP_VALUES } from '../lib/xpSystem';

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

// Step 1: Make/Model validation rules
const step1StandardRules: ValidationRules = {
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

// Step 1: Other vehicle validation rules
const step1OtherRules: ValidationRules = {
  otherVehicleDescription: {
    required: true,
    minLength: 10,
    maxLength: 500
  }
};

// Step 2: VIN validation rules (optional)
const step2Rules: ValidationRules = {
  vin: {
    minLength: 17,
    maxLength: 17,
    custom: (value) => {
      if (value && value.length > 0 && value.length !== 17) {
        return 'VIN must be exactly 17 characters';
      }
      return null;
    }
  }
};

// Step 3: Details validation rules
const step3Rules: ValidationRules = {
  nickname: {
    maxLength: 50
  },
  mileage: {
    custom: (value) => {
      if (value && isNaN(Number(value))) {
        return 'Mileage must be a number';
      }
      if (value && Number(value) < 0) {
        return 'Mileage cannot be negative';
      }
      return null;
    }
  }
};

const VehicleSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOtherVehicle, setIsOtherVehicle] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showConfetti, setShowConfetti] = useState(false);
  const [setupSteps, setSetupSteps] = useState<Step[]>([
    { id: 'make-model', label: 'Make/Model', completed: false, current: true },
    { id: 'vin', label: 'VIN', completed: false, current: false },
    { id: 'details', label: 'Details', completed: false, current: false }
  ]);
  
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    trim: '',
    vin: '',
    otherVehicleDescription: '',
    nickname: '',
    mileage: ''
  });

  // Get validation rules based on current step and vehicle type
  const getCurrentValidationRules = () => {
    if (currentStep === 1) {
      return isOtherVehicle ? step1OtherRules : step1StandardRules;
    } else if (currentStep === 2) {
      return step2Rules;
    } else {
      return step3Rules;
    }
  };

  const { errors, validateField, validateForm, clearError, setError, clearAllErrors } = useFormValidation(getCurrentValidationRules());

  useEffect(() => {
    const checkProfileStatus = async () => {
      try {
        const profile = await getProfile();
        if (profile) {
          // If we have a profile, mark the account step as completed
          setHasProfile(true);
          setSetupSteps(prev => {
            const updatedSteps = [...prev];
            // Update the steps to show the account step as completed
            return updatedSteps.map(step => ({
              ...step,
              current: step.id === 'make-model'
            }));
          });
        }
      } catch (error) {
        console.error('Error checking profile status:', error);
      }
    };

    checkProfileStatus();
  }, []);

  // Clear errors when changing steps or vehicle type
  useEffect(() => {
    clearAllErrors();
  }, [currentStep, isOtherVehicle, clearAllErrors]);

  const handleNextStep = () => {
    // Validate current step
    let dataToValidate = {};
    
    if (currentStep === 1) {
      dataToValidate = isOtherVehicle 
        ? { otherVehicleDescription: formData.otherVehicleDescription }
        : { make: formData.make, model: formData.model, year: formData.year };
    } else if (currentStep === 2) {
      dataToValidate = { vin: formData.vin };
    } else {
      dataToValidate = { nickname: formData.nickname, mileage: formData.mileage };
    }
    
    if (!validateForm(dataToValidate)) {
      toast.error('Please fix the errors below');
      return;
    }

    // Play sound effect
    playPopSound();
    
    // Update progress steps
    setSetupSteps(prev => {
      const updatedSteps = [...prev];
      // Mark current step as completed
      updatedSteps[currentStep - 1].completed = true;
      updatedSteps[currentStep - 1].current = false;
      
      // Set next step as current
      if (currentStep < updatedSteps.length) {
        updatedSteps[currentStep].current = true;
      }
      
      return updatedSteps;
    });
    
    // Move to next step
    setCurrentStep(prev => prev + 1);
  };

  const handlePreviousStep = () => {
    // Update progress steps
    setSetupSteps(prev => {
      const updatedSteps = [...prev];
      // Mark current step as not current
      updatedSteps[currentStep - 1].current = false;
      
      // Set previous step as current and not completed
      updatedSteps[currentStep - 2].current = true;
      updatedSteps[currentStep - 2].completed = false;
      
      return updatedSteps;
    });
    
    // Move to previous step
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate final step
    const dataToValidate = { nickname: formData.nickname, mileage: formData.mileage };
    
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
        vin: formData.vin || null,
        other_vehicle_description: isOtherVehicle ? formData.otherVehicleDescription : null,
        nickname: formData.nickname || null,
        mileage: formData.mileage ? parseInt(formData.mileage) : null
      };

      // Create the vehicle
      await createVehicle(vehicleData);

      // Update the user's profile to mark initial setup as complete
      await supabase
        .from('profiles')
        .update({ initial_setup_complete: true })
        .eq('id', session.user.id);

      // Update progress steps
      setSetupSteps(prev => {
        const updatedSteps = [...prev];
        // Mark all steps as completed
        return updatedSteps.map(step => ({
          ...step,
          completed: true,
          current: false
        }));
      });

      // Award "First Vehicle" badge
      try {
        await awardBadge(session.user.id, "First Vehicle", "Added your first vehicle to Bolt Auto");
        
        // Award XP for adding a vehicle
        await awardXp(session.user.id, XP_VALUES.ADD_VEHICLE, "Added a vehicle to your garage");
        
        // Show XP toast notification
        toast.success(`🎉 +${XP_VALUES.ADD_VEHICLE} XP added to your profile!`);
        
        // Show confetti animation
        setShowConfetti(true);
      } catch (badgeError) {
        console.error('Failed to award First Vehicle badge:', badgeError);
        // Don't fail the vehicle creation if badge awarding fails
      }

      // Show success message
      toast.success('Vehicle added successfully');
      
      // Navigate to the all-set page
      setTimeout(() => {
        navigate('/all-set');
      }, 2000);
    } catch (err) {
      console.error('Failed to save vehicle:', err);
      toast.error('Failed to save vehicle');
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
    clearAllErrors();
  };

  const handleSkip = async () => {
    if (currentStep < 3) {
      // Skip to next step
      handleNextStep();
    } else {
      // Skip the entire process
      setIsSubmitting(true);
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Mark initial setup as complete
          await supabase
            .from('profiles')
            .update({ initial_setup_complete: true })
            .eq('id', user.id);
        }
        
        // Update progress steps
        setSetupSteps(prev => prev.map(step => ({
          ...step,
          completed: true,
          current: false
        })));
        
        // Navigate to the all-set page
        navigate('/all-set');
      } catch (error) {
        console.error('Error updating profile:', error);
        // Navigate anyway even if there's an error
        navigate('/all-set');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Render the appropriate step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
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
              </>
            )}

            {/* AI Tip for Step 1 */}
            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">Why this matters</h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                    Accurate vehicle details help Bolt provide precise diagnostics and maintenance recommendations specific to your car's make, model, and year.
                  </p>
                </div>
              </div>
            </div>
          </>
        );
      
      case 2:
        return (
          <>
            <FormField
              label="VIN Number"
              name="vin"
              error={errors.vin}
              description="Vehicle Identification Number (17 characters)"
            >
              <Input
                name="vin"
                value={formData.vin}
                onChange={handleInputChange}
                onBlur={handleBlur}
                error={!!errors.vin}
                placeholder="e.g., 1HGCM82633A004352"
                maxLength={17}
              />
              <div className="mt-2 flex items-start gap-2 text-sm text-neutral-600 dark:text-gray-400">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-blue-500 mt-0.5" />
                <p>
                  Your VIN helps us get the most accurate results — from vehicle history and recalls
                  to the exact parts it needs. It's like a fingerprint for your car.
                </p>
              </div>
            </FormField>

            {/* VIN Location Diagram */}
            <div className="mt-6 bg-neutral-100 dark:bg-gray-700 rounded-xl p-4">
              <h3 className="font-medium text-neutral-900 dark:text-white mb-2">Where to find your VIN:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">1</div>
                  <span className="text-neutral-700 dark:text-gray-300">Driver's side dashboard (visible through windshield)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">2</div>
                  <span className="text-neutral-700 dark:text-gray-300">Driver's side door jamb sticker</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">3</div>
                  <span className="text-neutral-700 dark:text-gray-300">Vehicle registration or insurance documents</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">4</div>
                  <span className="text-neutral-700 dark:text-gray-300">Vehicle title</span>
                </div>
              </div>
            </div>

            {/* AI Tip for Step 2 */}
            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">Why VIN helps?</h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                    With your VIN, Bolt can access precise specifications, recall information, and maintenance schedules specific to your exact vehicle, not just the general model.
                  </p>
                </div>
              </div>
            </div>
          </>
        );
      
      case 3:
        return (
          <>
            <FormField
              label="Vehicle Nickname"
              name="nickname"
              error={errors.nickname}
              description="Give your vehicle a name (optional)"
            >
              <Input
                name="nickname"
                value={formData.nickname}
                onChange={handleInputChange}
                onBlur={handleBlur}
                error={!!errors.nickname}
                placeholder="e.g., Blue Beast, Daily Driver, etc."
              />
            </FormField>

            <FormField
              label="Current Mileage"
              name="mileage"
              error={errors.mileage}
              description="Current odometer reading (optional)"
            >
              <div className="relative">
                <Gauge className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                <Input
                  name="mileage"
                  type="number"
                  value={formData.mileage}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  error={!!errors.mileage}
                  className="pl-10"
                  placeholder="e.g., 45000"
                  min="0"
                />
              </div>
            </FormField>

            {/* Vehicle Summary */}
            <div className="mt-6 bg-neutral-100 dark:bg-gray-700 rounded-xl p-4">
              <h3 className="font-medium text-neutral-900 dark:text-white mb-3">Vehicle Summary</h3>
              <div className="space-y-2">
                {isOtherVehicle ? (
                  <div className="flex items-start gap-2">
                    <Car className="h-5 w-5 text-neutral-500 dark:text-gray-400 mt-0.5" />
                    <div>
                      <span className="font-medium text-neutral-700 dark:text-gray-300">Description:</span>
                      <p className="text-neutral-600 dark:text-gray-400">{formData.otherVehicleDescription}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Car className="h-5 w-5 text-neutral-500 dark:text-gray-400" />
                      <span className="font-medium text-neutral-700 dark:text-gray-300">Vehicle:</span>
                      <span className="text-neutral-600 dark:text-gray-400">
                        {formData.year} {formData.make} {formData.model} {formData.trim}
                      </span>
                    </div>
                  </>
                )}
                {formData.vin && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-neutral-500 dark:text-gray-400" />
                    <span className="font-medium text-neutral-700 dark:text-gray-300">VIN:</span>
                    <span className="text-neutral-600 dark:text-gray-400">{formData.vin}</span>
                  </div>
                )}
                {formData.nickname && (
                  <div className="flex items-center gap-2">
                    <Tool className="h-5 w-5 text-neutral-500 dark:text-gray-400" />
                    <span className="font-medium text-neutral-700 dark:text-gray-300">Nickname:</span>
                    <span className="text-neutral-600 dark:text-gray-400">{formData.nickname}</span>
                  </div>
                )}
                {formData.mileage && (
                  <div className="flex items-center gap-2">
                    <Gauge className="h-5 w-5 text-neutral-500 dark:text-gray-400" />
                    <span className="font-medium text-neutral-700 dark:text-gray-300">Mileage:</span>
                    <span className="text-neutral-600 dark:text-gray-400">{formData.mileage} miles</span>
                  </div>
                )}
              </div>
            </div>

            {/* AI Tip for Step 3 */}
            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">Pro Tip</h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                    Adding your current mileage helps Bolt provide timely maintenance reminders based on both time and distance intervals.
                  </p>
                </div>
              </div>
            </div>
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      {showConfetti && <Confetti duration={3000} onComplete={() => setShowConfetti(false)} />}
      
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white text-center">Setup Your Bolt Auto</h1>
          <p className="text-neutral-600 dark:text-gray-400 mt-1 text-center mb-8">
            Just a few details to personalize your garage
          </p>
          
          <SetupProgressIndicator steps={setupSteps} className="mb-8" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-neutral-200 dark:border-gray-700 overflow-hidden"
        >
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={`step-${currentStep}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between gap-3 pt-4">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePreviousStep}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-neutral-300 dark:border-gray-600 rounded-lg text-sm font-medium text-neutral-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-neutral-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Back
                </button>
              )}
              
              <div className="flex-1"></div>
              
              <button
                type="button"
                onClick={handleSkip}
                disabled={isSubmitting}
                className="px-4 py-2 border border-neutral-300 dark:border-gray-600 rounded-lg text-sm font-medium text-neutral-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-neutral-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentStep < 3 ? 'Skip this step' : 'Skip for Now'}
              </button>
              
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Saving...</span>
                    </div>
                  ) : (
                    'Save Vehicle'
                  )}
                </button>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default VehicleSetupPage;