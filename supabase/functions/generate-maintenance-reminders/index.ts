import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Maintenance intervals by service type (in months and miles)
const MAINTENANCE_INTERVALS = {
  oil_change: { months: 6, miles: 5000, description: "Oil Change Due" },
  tire_rotation: { months: 6, miles: 6000, description: "Tire Rotation Due" },
  brake_service: { months: 12, miles: 12000, description: "Brake Service Due" },
  air_filter: { months: 12, miles: 15000, description: "Air Filter Replacement Due" },
  cabin_filter: { months: 12, miles: 15000, description: "Cabin Filter Replacement Due" },
  transmission: { months: 36, miles: 30000, description: "Transmission Service Due" },
  coolant: { months: 24, miles: 30000, description: "Coolant Flush Due" },
  spark_plugs: { months: 36, miles: 30000, description: "Spark Plug Replacement Due" },
  battery: { months: 48, miles: 50000, description: "Battery Check Due" }
};

// Service types and their keywords for matching in service records
const SERVICE_TYPE_KEYWORDS = {
  oil_change: ['oil', 'oil change', 'oil service'],
  tire_rotation: ['tire', 'rotation', 'tire rotation'],
  brake_service: ['brake', 'brakes', 'brake service', 'brake pad'],
  air_filter: ['air filter', 'engine filter'],
  cabin_filter: ['cabin filter', 'cabin air'],
  transmission: ['transmission', 'transmission fluid'],
  coolant: ['coolant', 'antifreeze', 'radiator flush'],
  spark_plugs: ['spark', 'spark plug', 'ignition'],
  battery: ['battery', 'battery replacement']
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all users with vehicles
    const { data: users, error: usersError } = await supabaseClient
      .from('profiles')
      .select('id, ai_repair_tips_enabled');

    if (usersError) throw usersError;

    let totalRemindersCreated = 0;
    let totalUsersProcessed = 0;

    // Process each user
    for (const user of users) {
      // Skip users who have disabled AI repair tips
      if (user.ai_repair_tips_enabled === false) continue;

      totalUsersProcessed++;
      
      // Get user's vehicles
      const { data: vehicles, error: vehiclesError } = await supabaseClient
        .from('vehicles')
        .select('*')
        .eq('user_id', user.id);

      if (vehiclesError) {
        console.error(`Error fetching vehicles for user ${user.id}:`, vehiclesError);
        continue;
      }

      if (!vehicles || vehicles.length === 0) continue;

      // Process each vehicle
      for (const vehicle of vehicles) {
        // Get service records for this vehicle
        const { data: serviceRecords, error: recordsError } = await supabaseClient
          .from('service_records')
          .select('*')
          .eq('vehicle_id', vehicle.id)
          .order('service_date', { ascending: false });

        if (recordsError) {
          console.error(`Error fetching service records for vehicle ${vehicle.id}:`, recordsError);
          continue;
        }

        // Get existing maintenance notifications for this vehicle to avoid duplicates
        const { data: existingNotifications, error: notificationsError } = await supabaseClient
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .eq('type', 'service_reminder')
          .ilike('message', `%${vehicle.id}%`)
          .eq('read', false);

        if (notificationsError) {
          console.error(`Error fetching notifications for user ${user.id}:`, notificationsError);
          continue;
        }

        const existingReminderTypes = new Set(
          (existingNotifications || []).map(notification => {
            // Extract service type from notification message
            for (const [type, keywords] of Object.entries(SERVICE_TYPE_KEYWORDS)) {
              if (keywords.some(keyword => notification.message.toLowerCase().includes(keyword))) {
                return type;
              }
            }
            return null;
          }).filter(Boolean)
        );

        // Calculate due maintenance items
        const dueItems = calculateDueMaintenanceItems(vehicle, serviceRecords || []);
        
        // Create notifications for due items that don't already have notifications
        for (const item of dueItems) {
          if (!existingReminderTypes.has(item.type)) {
            const vehicleName = vehicle.other_vehicle_description || 
              `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ''}`;
            
            const message = `${item.description} for your ${vehicleName}${item.overdue ? ' - OVERDUE' : ''}`;
            
            const { error: insertError } = await supabaseClient
              .from('notifications')
              .insert({
                user_id: user.id,
                type: 'service_reminder',
                message,
                read: false,
                link: `/vehicles/${vehicle.id}/add-service`
              });

            if (insertError) {
              console.error(`Error creating notification for user ${user.id}:`, insertError);
            } else {
              totalRemindersCreated++;
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Generated maintenance reminders for ${totalUsersProcessed} users. Created ${totalRemindersCreated} new reminders.` 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error generating maintenance reminders:', error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to generate maintenance reminders' }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

// Helper function to calculate due maintenance items
function calculateDueMaintenanceItems(vehicle, serviceRecords) {
  const dueItems = [];
  const currentDate = new Date();
  const currentMileage = vehicle.mileage || 0;

  // Process each maintenance type
  for (const [type, interval] of Object.entries(MAINTENANCE_INTERVALS)) {
    // Find the last service record of this type
    const lastService = findLastServiceByType(serviceRecords, type);

    if (!lastService) {
      // No previous service of this type, it's due if the vehicle is older than the interval
      const vehicleAge = vehicle.year ? (new Date().getFullYear() - vehicle.year) * 12 : 0;
      if (vehicleAge > interval.months) {
        dueItems.push({
          type,
          description: interval.description,
          overdue: true,
          priority: 'medium'
        });
      }
      continue;
    }

    // Calculate time since last service
    const lastServiceDate = new Date(lastService.service_date);
    const monthsSinceService = (currentDate.getTime() - lastServiceDate.getTime()) / (30 * 24 * 60 * 60 * 1000);
    
    // Calculate mileage since last service
    const mileageSinceService = currentMileage - lastService.mileage;

    // Check if service is due by time or mileage
    if (monthsSinceService >= interval.months || mileageSinceService >= interval.miles) {
      let priority = 'low';
      let overdue = false;
      
      // Set priority based on how overdue the service is
      if (monthsSinceService >= interval.months * 1.5 || 
          mileageSinceService >= interval.miles * 1.5) {
        priority = 'high';
        overdue = true;
      } else if (monthsSinceService >= interval.months * 1.2 || 
                mileageSinceService >= interval.miles * 1.2) {
        priority = 'medium';
        overdue = true;
      }

      dueItems.push({
        type,
        description: interval.description,
        last_service_date: lastService.service_date,
        last_service_mileage: lastService.mileage,
        months_overdue: Math.max(0, monthsSinceService - interval.months),
        miles_overdue: Math.max(0, mileageSinceService - interval.miles),
        priority,
        overdue
      });
    }
  }

  return dueItems;
}

// Helper function to find the last service record of a specific type
function findLastServiceByType(serviceRecords, type) {
  const keywords = SERVICE_TYPE_KEYWORDS[type] || [];
  
  return serviceRecords.find(record => 
    keywords.some(keyword => 
      record.service_type.toLowerCase().includes(keyword) || 
      record.description.toLowerCase().includes(keyword)
    )
  );
}