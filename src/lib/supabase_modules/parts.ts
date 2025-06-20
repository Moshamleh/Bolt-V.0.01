import { supabase } from '../supabase';
import { Part, PaginatedResponse, PartFilters, ReportedPart, PartChatPreview, PartMessage } from '../supabase'; // Import types from main supabase.ts

export async function createPart(part: Partial<Part>): Promise<Part> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('parts')
    .insert({
      ...part,
      seller_id: user.id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function boostPart(partId: string, days: number = 7): Promise<Part> {
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

export async function getParts(filters: PartFilters = {}, page: number = 1, itemsPerPage: number = 12): Promise<PaginatedResponse<Part>> {
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage - 1;

  let query = supabase
    .from('parts')
    .select('*', { count: 'exact' })
    .eq('sold', false)
    .eq('approved', true); // Only show approved parts

  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,part_number.ilike.%${filters.search}%,oem_number.ilike.%${filters.search}%`);
  }
  if (filters.make) {
    query = query.eq('make', filters.make);
  }
  if (filters.condition) {
    query = query.eq('condition', filters.condition);
  }
  if (filters.category) {
    query = query.eq('category', filters.category);
  }
  if (filters.partNumber) {
    query = query.ilike('part_number', `%${filters.partNumber}%`);
  }
  if (filters.oemNumber) {
    query = query.ilike('oem_number', `%${filters.oemNumber}%`);
  }
  if (filters.approvalStatus === 'approved') {
    query = query.eq('approved', true);
  } else if (filters.approvalStatus === 'unapproved') {
    query = query.eq('approved', false);
  }

  query = query.order('is_boosted', { ascending: false }) // Boosted parts first
               .order('created_at', { ascending: false })
               .range(startIndex, endIndex);

  const { data, error, count } = await query;

  if (error) throw error;

  // If isTrustedSeller filter is applied, we need to fetch the seller profiles
  // and filter the parts based on the seller's trusted status
  let filteredData = data || [];
  
  if (filters.isTrustedSeller && filteredData.length > 0) {
    // Get all unique seller IDs
    const sellerIds = [...new Set(filteredData.map(part => part.seller_id))];
    
    // Fetch profiles for these sellers
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, is_trusted')
      .in('id', sellerIds);
    
    // Create a map of seller ID to trusted status
    const trustedSellers = new Map();
    profiles?.forEach(profile => {
      trustedSellers.set(profile.id, profile.is_trusted);
    });
    
    // Filter parts by trusted sellers
    filteredData = filteredData.filter(part => trustedSellers.get(part.seller_id));
  }
  
  // Fetch seller emails for all parts
  if (filteredData.length > 0) {
    const sellerIds = [...new Set(filteredData.map(part => part.seller_id))];
    
    // Fetch user emails
    const { data: users } = await supabase
      .from('users')
      .select('id, email')
      .in('id', sellerIds);
    
    // Create a map of seller ID to email
    const sellerEmails = new Map();
    users?.forEach(user => {
      sellerEmails.set(user.id, user.email);
    });
    
    // Fetch profiles for trusted status
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, is_trusted')
      .in('id', sellerIds);
    
    // Create a map of seller ID to trusted status
    const trustedSellers = new Map();
    profiles?.forEach(profile => {
      trustedSellers.set(profile.id, profile.is_trusted);
    });
    
    // Add seller_email and seller_is_trusted to each part
    filteredData = filteredData.map(part => ({
      ...part,
      seller_email: sellerEmails.get(part.seller_id) || '',
      seller_is_trusted: trustedSellers.get(part.seller_id) || false
    }));
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / itemsPerPage);

  return {
    data: filteredData,
    total,
    page,
    totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages,
  };
}

export async function getMyParts(): Promise<Part[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('parts')
    .select('*')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function deletePart(partId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('parts')
    .delete()
    .eq('id', partId)
    .eq('seller_id', user.id);

  if (error) throw error;
}

export async function getPartById(partId: string): Promise<Part> {
  const { data, error } = await supabase
    .from('parts')
    .select('*')
    .eq('id', partId)
    .single();

  if (error) throw error;
  
  // Fetch seller information separately
  if (data.seller_id) {
    // Get seller email from auth.users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', data.seller_id)
      .single();
    
    if (userError) console.error('Error fetching seller email:', userError);
    
    // Get seller trusted status from profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('is_trusted')
      .eq('id', data.seller_id)
      .single();
    
    if (profileError) console.error('Error fetching seller profile:', profileError);
    
    return {
      ...data,
      seller_email: userData?.email || '',
      seller_is_trusted: profileData?.is_trusted || false
    };
  }
  
  return {
    ...data,
    seller_email: '',
    seller_is_trusted: false
  };
}

export async function updatePart(partId: string, updates: Partial<Part>): Promise<Part> {
  const { data, error } = await supabase
    .from('parts')
    .update(updates)
    .eq('id', partId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getReportedParts(): Promise<ReportedPart[]> {
  const { data, error } = await supabase
    .from('reported_parts')
    .select(`
      *,
      part:parts(*),
      reporter:profiles(id, full_name, username, avatar_url)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function deleteReport(reportId: string): Promise<void> {
  const { error } = await supabase
    .from('reported_parts')
    .delete()
    .eq('id', reportId);

  if (error) throw error;
}

export async function reportPart(partId: string, reason: string, message?: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('reported_parts')
    .insert({
      part_id: partId,
      reporter_id: user.id,
      reason,
      message: message || null
    });

  if (error) throw error;
}

export async function isPartSaved(partId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('saved_parts')
    .select('id')
    .eq('user_id', user.id)
    .eq('part_id', partId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
}

export async function savePart(partId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('saved_parts')
    .insert({
      user_id: user.id,
      part_id: partId
    });

  if (error) throw error;
}

export async function unsavePart(partId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('saved_parts')
    .delete()
    .eq('user_id', user.id)
    .eq('part_id', partId);

  if (error) throw error;
}

export async function getSavedParts(): Promise<Part[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('saved_parts')
    .select(`
      part:parts(*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(item => item.part);
}

export async function getMyPartChats(): Promise<PartChatPreview[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('part_chats')
    .select(`
      id,
      created_at,
      part:parts(*),
      buyer:profiles(id, full_name, username, avatar_url),
      seller:profiles(id, full_name, username, avatar_url),
      part_messages(content, created_at)
    `)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order('created_at', { foreignTable: 'part_messages', ascending: false });

  if (error) throw error;

  return (data || []).map(chat => {
    const isBuyer = chat.buyer.id === user.id;
    const otherUser = isBuyer ? chat.seller : chat.buyer;
    const lastMessage = chat.part_messages.length > 0 ? chat.part_messages[0] : null;

    return {
      id: chat.id,
      created_at: chat.created_at,
      part: chat.part,
      other_user: otherUser,
      last_message: lastMessage
    };
  });
}

export async function getPartChatDetails(chatId: string): Promise<{ part: Part; buyer: any; seller: any }> {
  const { data, error } = await supabase
    .from('part_chats')
    .select(`
      part:parts(*),
      buyer:profiles(id, full_name, username, avatar_url),
      seller:profiles(id, full_name, username, avatar_url)
    `)
    .eq('id', chatId)
    .single();

  if (error) throw error;
  return data;
}

export async function getPartMessages(chatId: string): Promise<PartMessage[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('part_messages')
    .select(`
      *,
      sender:profiles(avatar_url)
    `)
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []).map(msg => ({
    ...msg,
    sender_avatar_url: msg.sender?.avatar_url || undefined
  }));
}

export async function sendPartMessage(chatId: string, content: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('part_messages')
    .insert({
      chat_id: chatId,
      sender_id: user.id,
      content
    });

  if (error) throw error;
}

export async function getOrCreatePartChat(partId: string, sellerId: string): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Check if chat already exists
  const { data: existingChat, error: chatError } = await supabase
    .from('part_chats')
    .select('id')
    .eq('part_id', partId)
    .eq('buyer_id', user.id)
    .eq('seller_id', sellerId)
    .single();

  if (existingChat) {
    return existingChat.id;
  }

  // If not, create a new chat
  const { data: newChat, error: createError } = await supabase
    .from('part_chats')
    .insert({
      part_id: partId,
      buyer_id: user.id,
      seller_id: sellerId
    })
    .select('id')
    .single();

  if (createError) throw createError;
  return newChat.id;
}