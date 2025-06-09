import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import supabase from '../lib/supabase';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold text-gray-900">Vehicle Setup</h1>
          <p className="text-gray-600 mt-1">Add your vehicle details to get started</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="flex items-center gap-2 mb-6">
              <input
                type="checkbox"
                id="otherVehicle"
                checked={isOtherVehicle}
                onChange={(e) => setIsOtherVehicle(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="otherVehicle" className="text-sm text-gray-700">
                Other Vehicle (not listed)
              </label>
            </div>

            {isOtherVehicle ? (
              <div>
                <label htmlFor="otherVehicleDescription" className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Description
                </label>
                <textarea
                  id="otherVehicleDescription"
                  name="otherVehicleDescription"
                  value={formData.otherVehicleDescription}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe your vehicle (e.g., Custom built electric car, Golf cart, etc.)"
                />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="make" className="block text-sm font-medium text-gray-700 mb-2">
                      Make
                    </label>
                    <select
                      id="make"
                      name="make"
                      value={formData.make}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Make</option>
                      {MAKES.map(make => (
                        <option key={make} value={make}>{make}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
                      Model
                    </label>
                    <select
                      id="model"
                      name="model"
                      value={formData.model}
                      onChange={handleInputChange}
                      disabled={!formData.make}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Select Model</option>
                      {formData.make && MODELS[formData.make]?.map(model => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                      Year
                    </label>
                    <select
                      id="year"
                      name="year"
                      value={formData.year}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {YEARS.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="trim" className="block text-sm font-medium text-gray-700 mb-2">
                      Trim (Optional)
                    </label>
                    <input
                      type="text"
                      id="trim"
                      name="trim"
                      value={formData.trim}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Sport, Limited, etc."
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="vin" className="block text-sm font-medium text-gray-700 mb-2">
                VIN Number (Optional)
              </label>
              <input
                type="text"
                id="vin"
                name="vin"
                value={formData.vin}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your VIN"
              />
              <div className="mt-2 flex items-start gap-2 text-sm text-gray-600">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-blue-500" />
                <p>
                  Your VIN helps us get the most accurate results — from vehicle history and recalls
                  to the exact parts it needs. It's like a fingerprint for your car.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/diagnostic')}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Skip for Now
              </button>
              <button
                type="submit"
                disabled={isSubmitting || (!isOtherVehicle && (!formData.make || !formData.model || !formData.year)) || (isOtherVehicle && !formData.otherVehicleDescription)}
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