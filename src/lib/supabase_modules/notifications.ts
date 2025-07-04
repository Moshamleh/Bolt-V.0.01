import { supabase } from '../supabase';
import { Notification, PaginatedResponse } from '../supabase'; // Import Notification type from main supabase.ts
import { User } from '@supabase/supabase-js';

export async function getUserNotifications(
  limit: number = 10, 
  unreadOnly: boolean = false, 
  user?: User,
  page: number = 1,
  notificationType?: string
): Promise<PaginatedResponse<Notification>> {
  // Calculate pagination indices
  const itemsPerPage = limit;
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage - 1;
  
  // Use provided user or get from session
  const userId = user?.id;
  
  if (!userId) {
    const { data: { user: sessionUser } } = await supabase.auth.getUser();
    if (!sessionUser) throw new Error('Not authenticated');
    
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', sessionUser.id);

    if (unreadOnly) {
      query = query.eq('read', false);
    }
    
    // Filter by notification type if provided
    if (notificationType) {
      query = query.eq('type', notificationType);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(startIndex, endIndex);

    if (error) throw error;
    
    const total = count || 0;
    const totalPages = Math.ceil(total / itemsPerPage);
    
    return {
      data: data || [],
      total,
      page,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages
    };
  }
  
  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', userId);

  if (unreadOnly) {
    query = query.eq('read', false);
  }
  
  // Filter by notification type if provided
  if (notificationType) {
    query = query.eq('type', notificationType);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(startIndex, endIndex);

  if (error) throw error;
  
  const total = count || 0;
  const totalPages = Math.ceil(total / itemsPerPage);
  
  return {
    data: data || [],
    total,
    page,
    totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages
  };
}

export async function getUnreadNotificationCount(user?: User): Promise<number> {
  // Use provided user or get from session
  const userId = user?.id;
  
  if (!userId) {
    const { data: { user: sessionUser } } = await supabase.auth.getUser();
    if (!sessionUser) throw new Error('Not authenticated');
    
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', sessionUser.id)
      .eq('read', false);

    if (error) throw error;
    return count || 0;
  }
  
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) throw error;
  return count || 0;
}

export async function markNotificationAsRead(notificationId: string, user?: User): Promise<void> {
  // Use provided user or get from session
  const userId = user?.id;
  
  if (!userId) {
    const { data: { user: sessionUser } } = await supabase.auth.getUser();
    if (!sessionUser) throw new Error('Not authenticated');
    
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', sessionUser.id);

    if (error) throw error;
    return;
  }
  
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function markAllNotificationsAsRead(user?: User): Promise<void> {
  // Use provided user or get from session
  const userId = user?.id;
  
  if (!userId) {
    const { data: { user: sessionUser } } = await supabase.auth.getUser();
    if (!sessionUser) throw new Error('Not authenticated');
    
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', sessionUser.id)
      .eq('read', false);

    if (error) throw error;
    return;
  }
  
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) throw error;
}

export async function deleteNotification(notificationId: string, user?: User): Promise<void> {
  // Use provided user or get from session
  const userId = user?.id;
  
  if (!userId) {
    const { data: { user: sessionUser } } = await supabase.auth.getUser();
    if (!sessionUser) throw new Error('Not authenticated');
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', sessionUser.id);

    if (error) throw error;
    return;
  }
  
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', userId);

  if (error) throw error;
}