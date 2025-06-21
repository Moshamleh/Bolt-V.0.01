import { supabase } from '../supabase';
import { ServiceRecord } from '../supabase'; // Import ServiceRecord type from main supabase.ts

export async function getAllServiceRecords(): Promise<ServiceRecord[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('service_records')
    .select('*')
    .eq('user_id', user.id)
    .order('service_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getVehicleServiceRecords(vehicleId: string): Promise<ServiceRecord[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('service_records')
    .select('*')
    .eq('user_id', user.id)
    .eq('vehicle_id', vehicleId)
    .order('service_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getLastServiceRecordByType(vehicleId: string, serviceType: string): Promise<ServiceRecord | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('service_records')
    .select('*')
    .eq('user_id', user.id)
    .eq('vehicle_id', vehicleId)
    .ilike('service_type', `%${serviceType}%`)
    .order('service_date', { ascending: false })
    .limit(1);

  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
}

export async function createServiceRecord(serviceRecord: Partial<ServiceRecord>): Promise<ServiceRecord> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('service_records')
    .insert({
      ...serviceRecord,
      user_id: user.id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateServiceRecord(id: string, updates: Partial<ServiceRecord>): Promise<ServiceRecord> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('service_records')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteServiceRecord(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('service_records')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}

export async function uploadServiceInvoice(file: File, vehicleId: string): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const fileExt = file.name.split('.').pop();
  const fileName = `${vehicleId}-${Date.now()}.${fileExt}`;
  const filePath = `service_invoices/${user.id}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('invoices')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('invoices')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

// Get maintenance schedule for a specific vehicle make and model
export async function getMaintenanceSchedule(make: string, model: string, year: number): Promise<any> {
  // In a real implementation, this would fetch from a database or API
  // For now, we'll return a mock schedule
  return {
    oil_change: {
      interval_months: 6,
      interval_miles: 5000,
      description: "Change engine oil and filter"
    },
    tire_rotation: {
      interval_months: 6,
      interval_miles: 6000,
      description: "Rotate tires to ensure even wear"
    },
    brake_inspection: {
      interval_months: 12,
      interval_miles: 12000,
      description: "Inspect brake pads, rotors, and fluid"
    },
    air_filter: {
      interval_months: 12,
      interval_miles: 15000,
      description: "Replace engine air filter"
    },
    cabin_filter: {
      interval_months: 12,
      interval_miles: 15000,
      description: "Replace cabin air filter"
    },
    transmission_fluid: {
      interval_months: 36,
      interval_miles: 30000,
      description: "Change transmission fluid"
    },
    coolant_flush: {
      interval_months: 24,
      interval_miles: 30000,
      description: "Flush and replace engine coolant"
    },
    spark_plugs: {
      interval_months: 36,
      interval_miles: 30000,
      description: "Replace spark plugs"
    },
    battery: {
      interval_months: 48,
      interval_miles: 50000,
      description: "Check and possibly replace battery"
    }
  };
}

// Calculate due maintenance items for a vehicle
export async function calculateDueMaintenanceItems(vehicleId: string): Promise<any[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get vehicle details
  const { data: vehicle, error: vehicleError } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', vehicleId)
    .eq('user_id', user.id)
    .single();

  if (vehicleError) throw vehicleError;
  if (!vehicle) throw new Error('Vehicle not found');

  // Get service records for this vehicle
  const serviceRecords = await getVehicleServiceRecords(vehicleId);

  // Get maintenance schedule
  const schedule = await getMaintenanceSchedule(vehicle.make || '', vehicle.model || '', vehicle.year || 0);

  // Calculate due items
  const dueItems = [];
  const currentDate = new Date();
  const currentMileage = vehicle.mileage || 0;

  for (const [serviceType, serviceInfo] of Object.entries(schedule)) {
    // Find the last service record of this type
    const lastService = serviceRecords.find(record => 
      record.service_type.toLowerCase().includes(serviceType.toLowerCase())
    );

    if (!lastService) {
      // No previous service of this type, it's due
      dueItems.push({
        type: serviceType,
        description: serviceInfo.description,
        due_date: new Date(currentDate.getTime() + serviceInfo.interval_months * 30 * 24 * 60 * 60 * 1000),
        due_mileage: currentMileage + serviceInfo.interval_miles,
        priority: 'medium',
        vehicle_id: vehicleId,
        vehicle_name: vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`
      });
      continue;
    }

    // Calculate time since last service
    const lastServiceDate = new Date(lastService.service_date);
    const monthsSinceService = (currentDate.getTime() - lastServiceDate.getTime()) / (30 * 24 * 60 * 60 * 1000);
    
    // Calculate mileage since last service
    const mileageSinceService = currentMileage - lastService.mileage;

    // Check if service is due by time or mileage
    if (monthsSinceService >= serviceInfo.interval_months || mileageSinceService >= serviceInfo.interval_miles) {
      let priority = 'low';
      
      // Set priority based on how overdue the service is
      if (monthsSinceService >= serviceInfo.interval_months * 1.5 || 
          mileageSinceService >= serviceInfo.interval_miles * 1.5) {
        priority = 'high';
      } else if (monthsSinceService >= serviceInfo.interval_months * 1.2 || 
                mileageSinceService >= serviceInfo.interval_miles * 1.2) {
        priority = 'medium';
      }

      dueItems.push({
        type: serviceType,
        description: serviceInfo.description,
        last_service_date: lastService.service_date,
        last_service_mileage: lastService.mileage,
        months_overdue: Math.max(0, monthsSinceService - serviceInfo.interval_months),
        miles_overdue: Math.max(0, mileageSinceService - serviceInfo.interval_miles),
        priority,
        vehicle_id: vehicleId,
        vehicle_name: vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`
      });
    }
  }

  return dueItems;
}