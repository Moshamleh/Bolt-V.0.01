import React from 'react';
import { Menu, Car, Zap, Settings } from 'lucide-react';
import { Vehicle } from '../lib/supabase';

interface MobileTopNavBarProps {
  vehicles: Vehicle[];
  selectedVehicleId: string;
  onVehicleChange: (id: string) => void;
  onMenuToggle: () => void;
  onSettingsToggle?: () => void;
}

const MobileTopNavBar: React.FC<MobileTopNavBarProps> = ({
  vehicles,
  selectedVehicleId,
  onVehicleChange,
  onMenuToggle,
  onSettingsToggle
}) => {
  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* Bolt Chat Header */}
      <div className="flex items-center justify-between py-3 px-4 bg-white dark:bg-gray-800 border-b border-neutral-200 dark:border-gray-700">
        <button
          onClick={onMenuToggle}
          className="p-2 text-neutral-600 dark:text-gray-400 hover:text-neutral-900 dark:hover:text-white"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <span className="font-medium text-neutral-900 dark:text-white">Bolt Chat</span>
        </div>
        
        {onSettingsToggle && (
          <button
            onClick={onSettingsToggle}
            className="p-2 text-neutral-600 dark:text-gray-400 hover:text-neutral-900 dark:hover:text-white"
          >
            <Settings className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Vehicle Selection Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-neutral-200 dark:border-gray-700 px-4 py-2">
        <div className="flex items-center">
          <select
            value={selectedVehicleId}
            onChange={(e) => onVehicleChange(e.target.value)}
            className="flex-1 rounded-lg border border-neutral-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {vehicles.map(vehicle => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </option>
            ))}
          </select>
          
          <div className="ml-3 w-8 h-8 rounded-full bg-neutral-100 dark:bg-gray-700 flex items-center justify-center">
            <Car className="h-4 w-4 text-neutral-500 dark:text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileTopNavBar;