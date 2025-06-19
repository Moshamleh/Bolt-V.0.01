// This is a placeholder since we don't have access to the actual file
// The following function should be added to your supabase.ts file:

/**
 * Boost a part listing for a specified number of days
 * @param partId The ID of the part to boost
 * @param days Number of days to boost the listing for
 * @returns The updated part
 */
export async function boostPart(partId: string, days: number = 7): Promise<Part> {
  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  
  const { data, error } = await supabase
    .from('parts')
    .update({ 
      is_boosted: true,
      boost_expires_at: expiresAt.toISOString()
    })
    .eq('id', partId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Also update the Part interface to include the new field:
export interface Part {
  // ... existing fields
  boost_expires_at?: string | null;
  // ... other fields
}