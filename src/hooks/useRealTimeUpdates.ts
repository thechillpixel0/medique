import { useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const useRealTimeUpdates = (onUpdate?: () => void) => {
  const handleUpdate = useCallback(() => {
    if (onUpdate) {
      onUpdate();
    }
  }, [onUpdate]);

  useEffect(() => {
    // Subscribe to visits changes
    const visitsSubscription = supabase
      .channel('visits-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'visits',
        },
        handleUpdate
      )
      .subscribe();

    // Subscribe to patients changes
    const patientsSubscription = supabase
      .channel('patients-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patients',
        },
        handleUpdate
      )
      .subscribe();

    // Subscribe to payment transactions
    const paymentsSubscription = supabase
      .channel('payments-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_transactions',
        },
        handleUpdate
      )
      .subscribe();

    // Subscribe to medical history
    const medicalHistorySubscription = supabase
      .channel('medical-history-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'medical_history',
        },
        handleUpdate
      )
      .subscribe();

    return () => {
      visitsSubscription.unsubscribe();
      patientsSubscription.unsubscribe();
      paymentsSubscription.unsubscribe();
      medicalHistorySubscription.unsubscribe();
    };
  }, [handleUpdate]);
};