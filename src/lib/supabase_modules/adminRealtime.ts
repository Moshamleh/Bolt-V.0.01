import { supabase } from '../supabase';

/**
 * Subscribe to new KYC requests
 * @param onNewRequest Callback function when a new KYC request is created
 * @returns Unsubscribe function
 */
export function subscribeToKycRequests(
  onNewRequest: (request: any) => void
): () => void {
  const channel = supabase
    .channel('kyc-requests')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'kyc_requests',
        filter: `status=eq.pending`,
      },
      (payload) => {
        onNewRequest(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to new reported parts
 * @param onNewReport Callback function when a new part is reported
 * @returns Unsubscribe function
 */
export function subscribeToReportedParts(
  onNewReport: (report: any) => void
): () => void {
  const channel = supabase
    .channel('reported-parts')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'reported_parts',
      },
      (payload) => {
        onNewReport(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to new mechanic applications
 * @param onNewApplication Callback function when a new mechanic application is submitted
 * @returns Unsubscribe function
 */
export function subscribeToMechanicApplications(
  onNewApplication: (application: any) => void
): () => void {
  const channel = supabase
    .channel('mechanic-applications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'mechanics',
        filter: `status=eq.pending`,
      },
      (payload) => {
        onNewApplication(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to KYC status updates
 * @param userId The ID of the user to monitor KYC status for
 * @param onStatusChange Callback function when the KYC status changes
 * @returns Unsubscribe function
 */
export function subscribeToKycStatusUpdates(
  userId: string,
  onStatusChange: (request: any) => void
): () => void {
  const channel = supabase
    .channel(`kyc-status-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'kyc_requests',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onStatusChange(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to dashboard stats updates
 * @param onStatsChange Callback function when any relevant stats change
 * @returns Unsubscribe function
 */
export function subscribeToDashboardStats(
  onStatsChange: (table: string, count: number) => void
): () => void {
  // Create channels for each table we want to monitor for the dashboard
  const kycChannel = supabase
    .channel('dashboard-kyc-stats')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'kyc_requests',
      },
      () => {
        // When any change happens, trigger a count update
        supabase
          .from('kyc_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')
          .then(({ count }) => {
            onStatsChange('kyc_requests', count || 0);
          });
      }
    )
    .subscribe();

  const mechanicsChannel = supabase
    .channel('dashboard-mechanics-stats')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'mechanics',
      },
      () => {
        supabase
          .from('mechanics')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')
          .then(({ count }) => {
            onStatsChange('mechanics', count || 0);
          });
      }
    )
    .subscribe();

  const reportsChannel = supabase
    .channel('dashboard-reports-stats')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'reported_parts',
      },
      () => {
        supabase
          .from('reported_parts')
          .select('*', { count: 'exact', head: true })
          .then(({ count }) => {
            onStatsChange('reported_parts', count || 0);
          });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(kycChannel);
    supabase.removeChannel(mechanicsChannel);
    supabase.removeChannel(reportsChannel);
  };
}