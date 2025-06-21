import { supabase } from '../supabase';

/**
 * Upload a diagnostic image to Supabase Storage
 * @param file The image file to upload
 * @returns The public URL of the uploaded image
 */
export async function uploadDiagnosticImage(file: File): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Create a unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}-${Date.now()}.${fileExt}`;
  const filePath = `${user.id}/${fileName}`;

  // Upload the file to the diagnostic-images bucket
  const { error: uploadError } = await supabase.storage
    .from('diagnostic-images')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  // Get the public URL
  const { data } = supabase.storage
    .from('diagnostic-images')
    .getPublicUrl(filePath);

  return data.publicUrl;
}