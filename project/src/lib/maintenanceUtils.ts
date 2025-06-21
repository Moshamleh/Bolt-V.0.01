import { Vehicle, ServiceRecord } from './supabase';

interface RepairTip {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  vehicleId: string;
  vehicleName: string;
  dueDate?: string;
  mileage?: number;
}

/**
 * Generates personalized maintenance tips based on vehicle data and service history
 * @param vehicles List of user vehicles
 * @param records List of service records
 * @returns Array of personalized repair tips
 */
export function generatePersonalizedTips(vehicles: Vehicle[], records: ServiceRecord[]): RepairTip[] {
  const tips: RepairTip[] = [];
  
  vehicles.forEach(vehicle => {
    const vehicleRecords = records.filter(record => record.vehicle_id === vehicle.id);
    const vehicleName = vehicle.other_vehicle_description || 
      `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ''}`;
    
    // Check for oil change recommendation
    const lastOilChange = vehicleRecords
      .filter(record => record.service_type.toLowerCase().includes('oil'))
      .sort((a, b) => new Date(b.service_date).getTime() - new Date(a.service_date).getTime())[0];
    
    if (lastOilChange) {
      const lastOilChangeDate = new Date(lastOilChange.service_date);
      const monthsSinceOilChange = Math.floor((new Date().getTime() - lastOilChangeDate.getTime()) / (30 * 24 * 60 * 60 * 1000));
      
      if (monthsSinceOilChange >= 5) {
        tips.push({
          id: `oil-${vehicle.id}`,
          title: '🛢️ Oil Refresh',
          description: `Your ${vehicleName} is due for an oil change. It's been ${monthsSinceOilChange} months since your last oil change.`,
          priority: monthsSinceOilChange >= 7 ? 'high' : 'medium',
          vehicleId: vehicle.id,
          vehicleName,
          dueDate: new Date(lastOilChangeDate.getTime() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
      }
    } else if (vehicle.year) {
      // If no oil change record exists, suggest one for vehicles with year data
      tips.push({
        id: `first-oil-${vehicle.id}`,
        title: '🛢️ Oil Refresh',
        description: `We recommend regular oil changes for your ${vehicleName} to maintain optimal engine performance.`,
        priority: 'medium',
        vehicleId: vehicle.id,
        vehicleName
      });
    }
    
    // Check for tire rotation
    const lastTireRotation = vehicleRecords
      .filter(record => record.service_type.toLowerCase().includes('tire') && record.service_type.toLowerCase().includes('rotation'))
      .sort((a, b) => new Date(b.service_date).getTime() - new Date(a.service_date).getTime())[0];
    
    if (lastTireRotation) {
      const lastRotationDate = new Date(lastTireRotation.service_date);
      const monthsSinceRotation = Math.floor((new Date().getTime() - lastRotationDate.getTime()) / (30 * 24 * 60 * 60 * 1000));
      
      if (monthsSinceRotation >= 6) {
        tips.push({
          id: `tire-${vehicle.id}`,
          title: 'Tire Rotation Recommended',
          description: `Your ${vehicleName} is due for a tire rotation. Regular rotations help ensure even tire wear and extend tire life.`,
          priority: 'medium',
          vehicleId: vehicle.id,
          vehicleName
        });
      }
    }
    
    // Check for brake service
    const lastBrakeService = vehicleRecords
      .filter(record => record.service_type.toLowerCase().includes('brake'))
      .sort((a, b) => new Date(b.service_date).getTime() - new Date(a.service_date).getTime())[0];
    
    if (lastBrakeService) {
      const lastBrakeDate = new Date(lastBrakeService.service_date);
      const monthsSinceBrakeService = Math.floor((new Date().getTime() - lastBrakeDate.getTime()) / (30 * 24 * 60 * 60 * 1000));
      
      if (monthsSinceBrakeService >= 12) {
        tips.push({
          id: `brake-${vehicle.id}`,
          title: 'Brake Inspection Due',
          description: `It's been over a year since your last brake service for your ${vehicleName}. We recommend a brake inspection to ensure safety.`,
          priority: 'high',
          vehicleId: vehicle.id,
          vehicleName
        });
      }
    }
    
    // Seasonal tips based on current month
    const currentMonth = new Date().getMonth();
    
    // Winter preparation (October-November)
    if (currentMonth >= 9 && currentMonth <= 10) {
      tips.push({
        id: `winter-${vehicle.id}`,
        title: 'Winter Preparation',
        description: `Winter is coming! Consider checking your ${vehicleName}'s battery, antifreeze levels, and tire condition before cold weather arrives.`,
        priority: 'medium',
        vehicleId: vehicle.id,
        vehicleName
      });
    }
    
    // Summer preparation (April-May)
    if (currentMonth >= 3 && currentMonth <= 4) {
      tips.push({
        id: `summer-${vehicle.id}`,
        title: 'Summer Preparation',
        description: `As temperatures rise, ensure your ${vehicleName}'s air conditioning system is working properly and check coolant levels to prevent overheating.`,
        priority: 'medium',
        vehicleId: vehicle.id,
        vehicleName
      });
    }
    
    // Vehicle age-based tips
    if (vehicle.year) {
      const vehicleAge = new Date().getFullYear() - vehicle.year;
      
      if (vehicleAge >= 5 && vehicleAge < 10) {
        tips.push({
          id: `age5-${vehicle.id}`,
          title: 'Timing Belt Inspection',
          description: `Your ${vehicleName} is ${vehicleAge} years old. Many vehicles need timing belt replacement between 60,000-100,000 miles. Consider having it inspected.`,
          priority: 'medium',
          vehicleId: vehicle.id,
          vehicleName
        });
      }
      
      if (vehicleAge >= 3) {
        tips.push({
          id: `battery-${vehicle.id}`,
          title: '🔋 Battery Checkup',
          description: `Your ${vehicleName} is ${vehicleAge} years old. Car batteries typically last 3-5 years. Consider having your battery tested.`,
          priority: vehicleAge >= 4 ? 'high' : 'low',
          vehicleId: vehicle.id,
          vehicleName
        });
      }
    }
  });
  
  // Sort tips by priority
  return tips.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Finds the last service record of a specific type
 * @param records List of service records
 * @param serviceType Type of service to find
 * @returns The most recent service record of the specified type, or undefined if none found
 */
export function findLastServiceByType(records: ServiceRecord[], serviceType: string): ServiceRecord | undefined {
  const keywords = getServiceTypeKeywords(serviceType);
  
  return records.find(record => 
    keywords.some(keyword => 
      record.service_type.toLowerCase().includes(keyword) || 
      record.description.toLowerCase().includes(keyword)
    )
  );
}

/**
 * Gets keywords associated with a service type for matching in service records
 * @param serviceType Type of service
 * @returns Array of keywords related to the service type
 */
function getServiceTypeKeywords(serviceType: string): string[] {
  const SERVICE_TYPE_KEYWORDS: Record<string, string[]> = {
    'oil_change': ['oil', 'oil change', 'oil service'],
    'tire_rotation': ['tire', 'rotation', 'tire rotation'],
    'brake_service': ['brake', 'brakes', 'brake service', 'brake pad'],
    'air_filter': ['air filter', 'engine filter'],
    'cabin_filter': ['cabin filter', 'cabin air'],
    'transmission': ['transmission', 'transmission fluid'],
    'coolant': ['coolant', 'antifreeze', 'radiator flush'],
    'spark_plugs': ['spark', 'spark plug', 'ignition'],
    'battery': ['battery', 'battery replacement']
  };
  
  return SERVICE_TYPE_KEYWORDS[serviceType] || [];
}