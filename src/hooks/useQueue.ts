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

      const visits = data as Visit[];
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
      }

      setQueueStatus({
        now_serving: nowServing,
        total_waiting: waitingVisits.length,
      });

    } catch (error) {
      console.error('Error fetching queue:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();

    // Subscribe to real-time updates
    const subscription = supabase
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

    return () => {
      subscription.unsubscribe();
    };
  }, [department]);

  return { visits, queueStatus, loading, refetch: fetchQueue };
};