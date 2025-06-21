import { supabase } from './supabase';

export async function getModerationStatus({ type, user_id, part_id }) {
  let result;

  if (type === "kyc") {
    const { data, error } = await supabase
      .from("kyc_requests")
      .select("status")
      .eq("user_id", user_id)
      .single();
    
    if (error) {
      console.error("Error fetching KYC status:", error);
    }
    
    result = data?.status;
  }

  if (type === "part") {
    const { data, error } = await supabase
      .from("parts")
      .select("approved")
      .eq("id", part_id)
      .single();
    
    if (error) {
      console.error("Error fetching part status:", error);
    }
    
    // Convert boolean approved status to string status format
    result = data?.approved === true ? "approved" : 
             data?.approved === false ? "rejected" : "pending";
  }

  return result || "pending";
}