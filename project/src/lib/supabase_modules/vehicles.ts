import { supabase } from '../supabase';
import { Vehicle } from '../supabase'; // Import Vehicle type from main supabase.ts
import { User } from '@supabase/supabase-js';

export async function getUserVehicles(user?: User): Promise<Vehicle[]> {
  // Use provided user or get from session
  const userId = user?.id;
  
  if (!userId) {
    const { data: { user: sessionUser } } = await supabase.auth.getUser();
    if (!sessionUser) throw new Error('Not authenticated');
    
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', sessionUser.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
  
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createVehicle(vehicle: Partial<Vehicle>): Promise<Vehicle> {
  const { data, error } = await supabase
    .from('vehicles')
    .insert(vehicle)
    .select()
    .single();

  if (error) throw error;
  return data;
}