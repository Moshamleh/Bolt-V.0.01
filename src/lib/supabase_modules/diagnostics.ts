import { supabase } from '../supabase';
import { Diagnosis } from '../supabase'; // Import Diagnosis type from main supabase.ts
import { PaginatedResponse } from '../supabase'; // Import PaginatedResponse type from main supabase.ts
import { AiFeedbackLog } from '../supabase'; // Import AiFeedbackLog type from main supabase.ts

export async function getAllUserDiagnosesWithVehicles(): Promise<Diagnosis[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('diagnoses')
    .select(`
      *,
      vehicle:vehicles(*)
    `)
    .eq('user_id', user.id)
    .order('timestamp', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function sendDiagnosticPrompt(vehicleId: string, prompt: string): Promise<Diagnosis> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Create initial diagnosis record
  const { data: diagnosis, error } = await supabase
    .from('diagnoses')
    .insert({
      user_id: user.id,
      vehicle_id: vehicleId,
      prompt,
      response: '',
      resolved: false
    })
    .select()
    .single();

  if (error) throw error;

  // Call the edge function to process the diagnosis
  const { error: functionError } = await supabase.functions.invoke('diagnose', {
    body: {
      diagnosisId: diagnosis.id,
      vehicleId,
      prompt
    }
  });

  if (functionError) {
    console.error('Error calling diagnose function:', functionError);
  }

  return diagnosis;
}

export async function updateDiagnosisResolved(diagnosisId: string, resolved: boolean): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('diagnoses')
    .update({ resolved })
    .eq('id', diagnosisId)
    .eq('user_id', user.id);

  if (error) throw error;
}

export async function recordAiFeedback(diagnosisId: string, wasHelpful: boolean): Promise<void> {
  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Insert feedback into ai_logs table
  const { error } = await supabase
    .from('ai_logs')
    .insert({
      diagnosis_id: diagnosisId,
      user_id: user.id,
      was_helpful: wasHelpful
    })
    .select();

  if (error) throw error;
}

export function subscribeToDiagnosisUpdates(diagnosisId: string, callback: (diagnosis: Diagnosis) => void) {
  const subscription = supabase
    .channel(`diagnosis-${diagnosisId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'diagnoses',
        filter: `id=eq.${diagnosisId}`
      },
      (payload) => {
        callback(payload.new as Diagnosis);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}

export async function getAllAiFeedback(page: number = 1, itemsPerPage: number = 10): Promise<PaginatedResponse<AiFeedbackLog>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage - 1;

  const { data, error, count } = await supabase
    .from('ai_logs')
    .select(`
      *,
      diagnosis:diagnoses(*, vehicle:vehicles(*)),
      user:profiles(id, full_name, email, avatar_url)
    `, { count: 'exact' })
    .order('timestamp', { ascending: false })
    .range(startIndex, endIndex);

  if (error) throw error;

  const total = count || 0;
  const totalPages = Math.ceil(total / itemsPerPage);

  return {
    data: data as AiFeedbackLog[] || [],
    total,
    page,
    totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages,
  };
}