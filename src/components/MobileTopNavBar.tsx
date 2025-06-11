import React from 'react';
import { Menu, Car, Zap } from 'lucide-react';
import { Vehicle } from '../lib/supabase';

interface MobileTopNavBarProps {
  vehicles: Vehicle[];
  selectedVehicleId: string;
  onVehicleChange: (id: string) => void;
  onMenuToggle: () => void;
}

const MobileTopNavBar: React.FC<MobileTopNavBarProps> = ({
  vehicles,
  selectedVehicleId,
  onVehicleChange,
  onMenuToggle,
}) => {
  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* Bolt Chat Header */}
      <div className="flex items-center justify-center gap-2 py-3 px-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <span className="font-medium text-gray-900 dark:text-white">Bolt Chat</span>
      </div>

      {/* Vehicle Selection Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between">
          <button
            onClick={onMenuToggle}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <Menu className="h-6 w-6" />
          </button>

          <select
            value={selectedVehicleId}
            onChange={(e) => onVehicleChange(e.target.value)}
            className="flex-1 mx-4 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {vehicles.map(vehicle => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </option>
            ))}
          </select>

          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <Car className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileTopNavBar;