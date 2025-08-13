import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DoctorSession, Consultation, Visit } from '../types';

export const useDoctorSession = (doctorId?: string) => {
  const [session, setSession] = useState<DoctorSession | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [waitingPatients, setWaitingPatients] = useState<Visit[]>([]);
  const [currentPatient, setCurrentPatient] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchSession = async () => {
    if (!doctorId) {
      setLoading(false);
      return;
    }
    
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
        .in('session_status', ['active', 'break'])
        .order('started_at', { ascending: false })
        .limit(1);

      if (sessionError) {
        console.error('Session fetch error:', sessionError);
        setError('Failed to fetch session data');
        return;
      }
      
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

        if (consultationError) {
          console.error('Consultation fetch error:', consultationError);
          setError('Failed to fetch consultations');
        } else {
          setConsultations(consultationData || []);
        }
      } else {
        setConsultations([]);
      }

      // Fetch waiting patients and current patient
      await fetchPatients();

    } catch (error: any) {
      console.error('Error fetching doctor session:', error);
      setError(error.message || 'Failed to fetch session data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    if (!doctorId) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get all visits for this doctor today
      const { data: visits, error } = await supabase
        .from('visits')
        .select(`
          *,
          patient:patients(*)
        `)
        .eq('visit_date', today)
        .or(`doctor_id.eq.${doctorId},department.in.(${await getDoctorSpecializations(doctorId)})`)
        .order('stn', { ascending: true });

      if (error) {
        console.error('Error fetching patients:', error);
        return;
      }

      const allVisits = visits || [];
      
      // Separate waiting patients and current patient
      const waiting = allVisits.filter(v => 
        ['waiting', 'checked_in'].includes(v.status)
      );
      
      const inService = allVisits.find(v => v.status === 'in_service');
      
      setWaitingPatients(waiting);
      setCurrentPatient(inService || null);

    } catch (error) {
      console.error('Error in fetchPatients:', error);
    }
  };

  const getDoctorSpecializations = async (doctorId: string): Promise<string> => {
    try {
      const { data: doctor } = await supabase
        .from('doctors')
        .select('specialization')
        .eq('id', doctorId)
        .single();
      
      return doctor?.specialization || '';
    } catch (error) {
      return '';
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
        .in('session_status', ['active', 'break']);

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

      if (error) {
        console.error('Error starting session:', error);
        setError('Failed to start session');
        return null;
      }
      
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

      if (error) {
        console.error('Error ending session:', error);
        setError('Failed to end session');
        return;
      }
      
      setSession(null);
      setConsultations([]);
      setWaitingPatients([]);
      setCurrentPatient(null);
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

      if (error) {
        console.error('Error updating session status:', error);
        setError('Failed to update session status');
        return;
      }
      
      setSession(data);
    } catch (error: any) {
      console.error('Error updating session status:', error);
      setError(error.message || 'Failed to update session status');
    }
  };

  const startConsultation = async (visitId: string) => {
    if (!session || !visitId) return null;
    
    try {
      setError('');
      
      // Update visit status to in_service
      const { error: visitError } = await supabase
        .from('visits')
        .update({ status: 'in_service' })
        .eq('id', visitId);

      if (visitError) {
        console.error('Error updating visit status:', visitError);
        setError('Failed to start consultation');
        return null;
      }

      // Create consultation record
      const { data: consultation, error: consultationError } = await supabase
        .from('consultations')
        .insert({
          doctor_id: doctorId,
          patient_id: waitingPatients.find(p => p.id === visitId)?.patient_id,
          visit_id: visitId,
          session_id: session.id,
          status: 'in_progress',
          started_at: new Date().toISOString(),
          priority_level: 'normal'
        })
        .select(`
          *,
          patient:patients(*),
          visit:visits(*)
        `)
        .single();

      if (consultationError) {
        console.error('Error creating consultation:', consultationError);
        setError('Failed to create consultation');
        return null;
      }

      // Update session with current patient
      await supabase
        .from('doctor_sessions')
        .update({ 
          current_patient_id: consultation.patient_id 
        })
        .eq('id', session.id);

      // Refresh data
      await fetchSession();
      
      return consultation;
    } catch (error: any) {
      console.error('Error starting consultation:', error);
      setError(error.message || 'Failed to start consultation');
      return null;
    }
  };

  const completeConsultation = async (consultationId: string) => {
    try {
      setError('');
      
      const consultation = consultations.find(c => c.id === consultationId);
      if (!consultation) return;

      // Calculate duration
      const startTime = new Date(consultation.started_at).getTime();
      const endTime = Date.now();
      const durationMinutes = Math.floor((endTime - startTime) / (1000 * 60));

      // Update consultation
      const { error: consultationError } = await supabase
        .from('consultations')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          duration_minutes: durationMinutes
        })
        .eq('id', consultationId);

      if (consultationError) {
        console.error('Error completing consultation:', consultationError);
        setError('Failed to complete consultation');
        return;
      }

      // Update visit status
      const { error: visitError } = await supabase
        .from('visits')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', consultation.visit_id);

      if (visitError) {
        console.error('Error updating visit:', visitError);
      }

      // Clear current patient from session
      if (session) {
        await supabase
          .from('doctor_sessions')
          .update({ current_patient_id: null })
          .eq('id', session.id);
      }

      // Refresh data
      await fetchSession();
      
    } catch (error: any) {
      console.error('Error completing consultation:', error);
      setError(error.message || 'Failed to complete consultation');
    }
  };

  const callNextPatient = async () => {
    if (!session || waitingPatients.length === 0) return null;
    
    // Get the next patient (first in queue)
    const nextPatient = waitingPatients[0];
    return await startConsultation(nextPatient.id);
  };

  useEffect(() => {
    fetchSession();

    // Subscribe to real-time updates
    if (doctorId) {
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
            table: 'visits',
          },
          () => {
            fetchSession();
            fetchPatients();
          }
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
    }
  }, [doctorId]);

  return {
    session,
    consultations,
    waitingPatients,
    currentPatient,
    loading,
    error,
    startSession,
    endSession,
    updateSessionStatus,
    startConsultation,
    completeConsultation,
    callNextPatient,
    refetch: fetchSession
  };
};