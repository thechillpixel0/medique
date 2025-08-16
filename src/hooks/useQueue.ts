import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Visit, QueueStatus } from '../types';

export const useQueue = (department?: string) => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({
    now_serving: 0,
    total_waiting: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    try {
      if (!supabase || typeof supabase.from !== 'function') {
        console.warn('Supabase client not properly configured');
        setLoading(false);
        return;
      }
      
      const today = new Date().toISOString().split('T')[0];
      
      let query = supabase
        .from('visits')
        .select(`
          *,
          patient:patients(*),
          doctor:doctors(*)
        `)
        .eq('visit_date', today)
        .order('stn', { ascending: true });

      if (department) {
        query = query.eq('department', department);
      }

      const { data, error } = await query;

      if (error) throw error;

      const visits = (data || []) as Visit[];
      setVisits(visits);

      // Calculate queue status
      const waitingVisits = visits.filter(v => ['waiting', 'checked_in'].includes(v.status));
      const completedVisits = visits.filter(v => v.status === 'completed');
      const inServiceVisits = visits.filter(v => v.status === 'in_service');
      
      let nowServing = 0;
      if (inServiceVisits.length > 0) {
        nowServing = Math.min(...inServiceVisits.map(v => v.stn));
      } else if (completedVisits.length > 0) {
        nowServing = Math.max(...completedVisits.map(v => v.stn));
      } else if (visits.length > 0) {
        // If no one is in service or completed, start from the first token
        nowServing = Math.min(...visits.map(v => v.stn)) - 1;
      }

      setQueueStatus({
        now_serving: nowServing,
        total_waiting: waitingVisits.length,
      });

    } catch (error) {
      console.error('Error fetching queue:', error);
      // Set empty state on error
      setVisits([]);
      setQueueStatus({
        now_serving: 0,
        total_waiting: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();

    // Subscribe to real-time updates only if Supabase is configured
    let subscription: any = null;
    
    if (supabase && typeof supabase.channel === 'function') {
      subscription = supabase
        .channel('visits-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'visits',
          },
          () => {
            fetchQueue();
          }
        )
        .subscribe();
    }

    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, [department]);

  return { visits, queueStatus, loading, refetch: fetchQueue };
};