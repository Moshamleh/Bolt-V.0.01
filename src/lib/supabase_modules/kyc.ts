import { supabase } from '../supabase';
import { KYCUser, PaginatedResponse } from '../supabase'; // Import types from main supabase.ts

export async function checkKycStatus(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .select('kyc_verified')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data?.kyc_verified || false;
}

export async function getPendingKycUsers(): Promise<KYCUser[]> {
  const { data, error } = await supabase
    .from('kyc_requests')
    .select(`
      id,
      full_name,
      status,
      user:profiles(email, avatar_url, location)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data || []).map(req => ({
    id: req.id,
    full_name: req.full_name,
    email: req.user?.email || 'N/A',
    avatar_url: req.user?.avatar_url || null,
    location: req.user?.location || null,
    kyc_status: req.status,
  }));
}

export async function updateUserKycStatus(userId: string, approved: boolean): Promise<void> {
  const newStatus = approved ? 'verified' : 'rejected';
  const { error } = await supabase
    .from('kyc_requests')
    .update({ status: newStatus })
    .eq('user_id', userId);

  if (error) throw error;

  // Update the user's profile kyc_verified status
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ kyc_verified: approved })
    .eq('id', userId);

  if (profileError) throw profileError;
}

export async function checkAndSetTrustedSeller(userId: string): Promise<void> {
  // Check if the user has at least 3 approved parts
  const { count: approvedPartsCount, error: partsError } = await supabase
    .from('parts')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', userId)
    .eq('approved', true);

  if (partsError) throw partsError;

  // Check if the user's KYC is verified
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('kyc_verified, is_trusted')
    .eq('id', userId)
    .single();

  if (profileError) throw profileError;

  const isKycVerified = profile?.kyc_verified || false;
  const currentIsTrusted = profile?.is_trusted || false;

  // If both conditions are met and the user is not already trusted, set is_trusted to true
  if (approvedPartsCount >= 3 && isKycVerified && !currentIsTrusted) {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ is_trusted: true })
      .eq('id', userId);

    if (updateError) throw updateError;
  }
}

export async function getKycStatusCounts(): Promise<{ pending: number; approved: number; rejected: number }> {
  const { count: pending, error: pendingError } = await supabase
    .from('kyc_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  if (pendingError) throw pendingError;

  const { count: approved, error: approvedError } = await supabase
    .from('kyc_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'verified');

  if (approvedError) throw approvedError;

  const { count: rejected, error: rejectedError } = await supabase
    .from('kyc_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'rejected');

  if (rejectedError) throw rejectedError;

  return {
    pending: pending || 0,
    approved: approved || 0,
    rejected: rejected || 0,
  };
}