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