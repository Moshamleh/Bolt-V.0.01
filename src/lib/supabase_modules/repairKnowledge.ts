import { supabase } from '../supabase';
import { RepairKnowledge } from '../supabase';

/**
 * Get a repair guide based on component, make, model, year, and trim
 * @param component The component name
 * @param make The vehicle make
 * @param model The vehicle model
 * @param year The vehicle year
 * @param trim Optional vehicle trim
 * @returns The repair guide or null if not found
 */
export async function getRepairGuide(
  component: string,
  make: string,
  model: string,
  year: number,
  trim?: string
): Promise<RepairKnowledge | null> {
  try {
    // Try to find an exact match first
    let query = supabase
      .from('repair_knowledge')
      .select('*')
      .eq('component', component)
      .eq('make', make)
      .eq('model', model)
      .eq('year', year);
    
    // Add trim if provided
    if (trim) {
      query = query.eq('trim', trim);
    }
    
    let { data, error } = await query.maybeSingle();
    
    if (error) throw error;
    
    // If we found an exact match, return it
    if (data) return data;
    
    // If no exact match with trim, try without trim
    if (trim) {
      const { data: dataWithoutTrim, error: errorWithoutTrim } = await supabase
        .from('repair_knowledge')
        .select('*')
        .eq('component', component)
        .eq('make', make)
        .eq('model', model)
        .eq('year', year)
        .is('trim', null)
        .maybeSingle();
      
      if (errorWithoutTrim) throw errorWithoutTrim;
      if (dataWithoutTrim) return dataWithoutTrim;
    }
    
    // Try to find a match with a different year (within 2 years)
    const { data: dataWithDifferentYear, error: errorWithDifferentYear } = await supabase
      .from('repair_knowledge')
      .select('*')
      .eq('component', component)
      .eq('make', make)
      .eq('model', model)
      .gte('year', year - 2)
      .lte('year', year + 2)
      .order('year', { ascending: false })
      .maybeSingle();
    
    if (errorWithDifferentYear) throw errorWithDifferentYear;
    if (dataWithDifferentYear) return dataWithDifferentYear;
    
    // Try to find a match with just the component and make
    const { data: dataWithComponentAndMake, error: errorWithComponentAndMake } = await supabase
      .from('repair_knowledge')
      .select('*')
      .eq('component', component)
      .eq('make', make)
      .order('year', { ascending: false })
      .maybeSingle();
    
    if (errorWithComponentAndMake) throw errorWithComponentAndMake;
    if (dataWithComponentAndMake) return dataWithComponentAndMake;
    
    // If still no match, try just the component
    const { data: dataWithComponent, error: errorWithComponent } = await supabase
      .from('repair_knowledge')
      .select('*')
      .eq('component', component)
      .order('year', { ascending: false })
      .maybeSingle();
    
    if (errorWithComponent) throw errorWithComponent;
    return dataWithComponent;
  } catch (error) {
    console.error('Error fetching repair guide:', error);
    throw error;
  }
}

/**
 * Get all available repair guides
 * @returns Array of repair guides
 */
export async function getAllRepairGuides(): Promise<RepairKnowledge[]> {
  try {
    const { data, error } = await supabase
      .from('repair_knowledge')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching all repair guides:', error);
    throw error;
  }
}

/**
 * Create a new repair guide
 * @param guide The repair guide data
 * @returns The created repair guide
 */
export async function createRepairGuide(guide: Omit<RepairKnowledge, 'id' | 'created_at'>): Promise<RepairKnowledge> {
  try {
    const { data, error } = await supabase
      .from('repair_knowledge')
      .insert(guide)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating repair guide:', error);
    throw error;
  }
}

/**
 * Update an existing repair guide
 * @param id The ID of the repair guide to update
 * @param updates The updates to apply
 * @returns The updated repair guide
 */
export async function updateRepairGuide(
  id: string,
  updates: Partial<Omit<RepairKnowledge, 'id' | 'created_at'>>
): Promise<RepairKnowledge> {
  try {
    const { data, error } = await supabase
      .from('repair_knowledge')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating repair guide:', error);
    throw error;
  }
}

/**
 * Delete a repair guide
 * @param id The ID of the repair guide to delete
 */
export async function deleteRepairGuide(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('repair_knowledge')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting repair guide:', error);
    throw error;
  }
}

/**
 * Search for repair guides
 * @param searchTerm The search term
 * @returns Array of matching repair guides
 */
export async function searchRepairGuides(searchTerm: string): Promise<RepairKnowledge[]> {
  try {
    const { data, error } = await supabase
      .from('repair_knowledge')
      .select('*')
      .or(`component.ilike.%${searchTerm}%,make.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%,safety_notes.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching repair guides:', error);
    throw error;
  }
}