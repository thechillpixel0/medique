import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DoctorSession, Consultation, Doctor } from '../types';

export const useDoctorSession = (doctorId?: string) => {
  const [session, setSession] = useState<DoctorSession | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchSession = async () => {
    if (!doctorId) return;
    
    try {
      setError('');
      
      // Get active session for doctor
      const { data: sessionData, error: sessionError } = await supabase
        .from('doctor_sessions')
        .select(`
          *,
          doctor:doctors(*),
          current_patient:patients(*)
        `)
        .eq('doctor_id', doctorId)
        .eq('session_status', 'active')
        .order('started_at', { ascending: false })
        .limit(1);

      if (sessionError) throw sessionError;
      
      const activeSession = sessionData?.[0] || null;
      setSession(activeSession);

      // Get consultations for active session
      if (activeSession) {
        const { data: consultationData, error: consultationError } = await supabase
          .from('consultations')
          .select(`
            *,
            patient:patients(*),
            visit:visits(*),
            consultation_notes(*),
            voice_transcriptions(*)
          `)
          .eq('session_id', activeSession.id)
          .order('started_at', { ascending: false });

        if (consultationError) throw consultationError;
        setConsultations(consultationData || []);
      } else {
        setConsultations([]);
      }

    } catch (error: any) {
      console.error('Error fetching doctor session:', error);
      setError(error.message || 'Failed to fetch session data');
    } finally {
      setLoading(false);
    }
  };

  const startSession = async (roomName: string) => {
    if (!doctorId) return null;
    
    try {
      setError('');
      
      // End any existing active sessions
      await supabase
        .from('doctor_sessions')
        .update({ 
          session_status: 'inactive',
          ended_at: new Date().toISOString()
        })
        .eq('doctor_id', doctorId)
        .eq('session_status', 'active');

      // Create new session
      const { data, error } = await supabase
        .from('doctor_sessions')
        .insert({
          doctor_id: doctorId,
          session_status: 'active',
          room_name: roomName,
          started_at: new Date().toISOString()
        })
        .select(`
          *,
          doctor:doctors(*)
        `)
        .single();

      if (error) throw error;
      
      setSession(data);
      return data;
    } catch (error: any) {
      console.error('Error starting session:', error);
      setError(error.message || 'Failed to start session');
      return null;
    }
  };

  const endSession = async () => {
    if (!session) return;
    
    try {
      setError('');
      
      const { error } = await supabase
        .from('doctor_sessions')
        .update({ 
          session_status: 'inactive',
          ended_at: new Date().toISOString(),
          current_patient_id: null
        })
        .eq('id', session.id);

      if (error) throw error;
      
      setSession(null);
      setConsultations([]);
    } catch (error: any) {
      console.error('Error ending session:', error);
      setError(error.message || 'Failed to end session');
    }
  };

  const updateSessionStatus = async (status: 'active' | 'break') => {
    if (!session) return;
    
    try {
      setError('');
      
      const { data, error } = await supabase
        .from('doctor_sessions')
        .update({ session_status: status })
        .eq('id', session.id)
        .select(`
          *,
          doctor:doctors(*),
          current_patient:patients(*)
        `)
        .single();

      if (error) throw error;
      setSession(data);
    } catch (error: any) {
      console.error('Error updating session status:', error);
      setError(error.message || 'Failed to update session status');
    }
  };

  useEffect(() => {
    fetchSession();

    // Subscribe to real-time updates
    const sessionSubscription = supabase
      .channel('doctor-session-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'doctor_sessions',
          filter: `doctor_id=eq.${doctorId}`
        },
        () => fetchSession()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'consultations',
        },
        () => fetchSession()
      )
      .subscribe();

    return () => {
      sessionSubscription.unsubscribe();
    };
  }, [doctorId]);

  return {
    session,
    consultations,
    loading,
    error,
    startSession,
    endSession,
    updateSessionStatus,
    refetch: fetchSession
  };
};