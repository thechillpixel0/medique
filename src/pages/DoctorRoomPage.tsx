import React, { useState, useEffect } from 'react';
import { 
  User, 
  Clock, 
  Stethoscope, 
  FileText, 
  Mic, 
  Save,
  LogOut,
  Coffee,
  Play,
  Users,
  Heart,
  AlertTriangle,
  CheckCircle,
  Phone,
  Mail,
  Calendar,
  Activity
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { VoiceNoteRecorder } from '../components/VoiceNoteRecorder';
import { useAuth } from '../hooks/useAuth';
import { useDoctorSession } from '../hooks/useDoctorSession';
import { useRealTimeUpdates } from '../hooks/useRealTimeUpdates';
import { supabase } from '../lib/supabase';
import { Doctor, Patient, Consultation, ConsultationNote } from '../types';
import { formatTime, formatRelativeTime } from '../lib/utils';

export const DoctorRoomPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [roomName, setRoomName] = useState('');
  const [showStartModal, setShowStartModal] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [consultationNotes, setConsultationNotes] = useState<ConsultationNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<'general' | 'symptoms' | 'diagnosis' | 'prescription' | 'follow_up'>('general');
  const [saving, setSaving] = useState(false);
  const [waitingPatients, setWaitingPatients] = useState<any[]>([]);

  const { session, consultations, loading, error, startSession, endSession, updateSessionStatus, refetch } = useDoctorSession(doctor?.id);

  // Real-time updates
  useRealTimeUpdates(() => {
    refetch();
    fetchWaitingPatients();
  });

  useEffect(() => {
    fetchDoctorProfile();
  }, [user]);

  useEffect(() => {
    if (doctor) {
      fetchWaitingPatients();
    }
  }, [doctor]);

  const fetchDoctorProfile = async () => {
    if (!user) return;
    
    try {
      setError('');
      // For demo purposes, we'll create a doctor profile if it doesn't exist
      let { data: doctorData, error } = await supabase
        .from('doctors')
        .select('*')
        .ilike('name', `%${user.email?.split('@')[0] || 'Doctor'}%`)
        .limit(1);

      if (!doctorData || doctorData.length === 0) {
        // Create doctor profile
        const { data: newDoctor, error: createError } = await supabase
          .from('doctors')
          .insert({
            name: `Dr. ${user.email?.split('@')[0] || 'Doctor'}`,
            specialization: 'general',
            qualification: 'MBBS',
            experience_years: 5,
            consultation_fee: 500,
            available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
            available_hours: { start: '09:00', end: '17:00' },
            max_patients_per_day: 50,
            status: 'active'
          })
          .select()
          .single();

        if (createError) throw createError;
        doctorData = newDoctor;
      } else {
        doctorData = doctorData[0];
      }

      setDoctor(doctorData);
      setRoomName(`${doctorData.name}'s Room`);
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
      setError('Failed to load doctor profile. Please try again.');
    }
  };

  const fetchWaitingPatients = async () => {
    if (!doctor) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('visits')
        .select(`
          *,
          patient:patients(*)
        `)
        .eq('visit_date', today)
        .eq('doctor_id', doctor.id)
        .in('status', ['waiting', 'checked_in'])
        .order('stn', { ascending: true });

      if (error) throw error;
      setWaitingPatients(data || []);
    } catch (error) {
      console.error('Error fetching waiting patients:', error);
    }
  };

  const handleStartSession = async () => {
    if (!roomName.trim()) return;
    
    const newSession = await startSession(roomName.trim());
    if (newSession) {
      setShowStartModal(false);
    }
  };

  const handlePatientClick = async (consultation: Consultation) => {
    setSelectedConsultation(consultation);
    
    // Fetch consultation notes
    try {
      const { data, error } = await supabase
        .from('consultation_notes')
        .select('*')
        .eq('consultation_id', consultation.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConsultationNotes(data || []);
    } catch (error) {
      console.error('Error fetching consultation notes:', error);
    }
    
    setShowPatientModal(true);
  };

  const saveNote = async () => {
    if (!selectedConsultation || !newNote.trim()) return;
    
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('consultation_notes')
        .insert({
          consultation_id: selectedConsultation.id,
          doctor_id: doctor!.id,
          note_type: noteType,
          content: newNote.trim(),
          is_voice_generated: false
        })
        .select()
        .single();

      if (error) throw error;
      
      setConsultationNotes(prev => [data, ...prev]);
      setNewNote('');
      
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const completeConsultation = async (consultationId: string) => {
    try {
      const { error } = await supabase
        .from('consultations')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', consultationId);

      if (error) throw error;
      
      // Also update the visit status
      const consultation = consultations.find(c => c.id === consultationId);
      if (consultation) {
        await supabase
          .from('visits')
          .update({ status: 'completed' })
          .eq('id', consultation.visit_id);
      }
      
      refetch();
      setShowPatientModal(false);
    } catch (error) {
      console.error('Error completing consultation:', error);
    }
  };

  // Show login if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Stethoscope className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Doctor Login Required</h1>
              <p className="text-gray-600 mb-6">Please login to access the doctor room.</p>
              <Button onClick={() => window.location.href = '/admin'}>
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show session start modal if no active session
  if (!session && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Stethoscope className="h-8 w-8 text-blue-600 mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">Doctor Room</h1>
              </div>
              <Button variant="outline" onClick={() => signOut()}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="bg-white rounded-2xl shadow-xl p-12">
              <Stethoscope className="h-24 w-24 text-blue-600 mx-auto mb-8" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome, {doctor?.name || 'Doctor'}!
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Start your consultation session to begin seeing patients
              </p>
              
              <div className="max-w-md mx-auto mb-8">
                <Input
                  label="Room Name"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Enter your room name"
                  className="text-center text-lg"
                />
              </div>
              
              <Button
                onClick={handleStartSession}
                size="lg"
                className="px-12 py-4 text-lg"
                disabled={!roomName.trim()}
              >
                <Play className="h-6 w-6 mr-3" />
                Start Session
              </Button>
              
              {error && (
                <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">{error}</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading doctor room...</p>
        </div>
      </div>
    );
  }

  const activeConsultations = consultations.filter(c => c.status === 'in_progress');
  const completedToday = consultations.filter(c => c.status === 'completed').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Stethoscope className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">{session?.room_name}</h1>
                <p className="text-sm text-gray-600">
                  Session started {formatRelativeTime(session?.started_at || '')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  session?.session_status === 'active' ? 'bg-green-500' : 
                  session?.session_status === 'break' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm font-medium capitalize">
                  {session?.session_status}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateSessionStatus(session?.session_status === 'active' ? 'break' : 'active')}
              >
                <Coffee className="h-4 w-4 mr-2" />
                {session?.session_status === 'active' ? 'Take Break' : 'Resume'}
              </Button>
              <Button variant="outline" size="sm" onClick={endSession}>
                <LogOut className="h-4 w-4 mr-2" />
                End Session
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Consultations</p>
                  <p className="text-2xl font-bold text-gray-900">{activeConsultations.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed Today</p>
                  <p className="text-2xl font-bold text-gray-900">{completedToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Waiting Patients</p>
                  <p className="text-2xl font-bold text-gray-900">{waitingPatients.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Activity className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Session Duration</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.floor((Date.now() - new Date(session?.started_at || '').getTime()) / (1000 * 60))}m
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Patient */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Current Patient</h2>
              </CardHeader>
              <CardContent>
                {session?.current_patient ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {session.current_patient.name}
                        </h3>
                        <p className="text-gray-600">
                          Age: {session.current_patient.age} • ID: {session.current_patient.uid}
                        </p>
                        <p className="text-gray-600">
                          Phone: {session.current_patient.phone}
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          const consultation = activeConsultations.find(c => 
                            c.patient_id === session.current_patient?.id
                          );
                          if (consultation) handlePatientClick(consultation);
                        }}
                      >
                        Open Profile
                      </Button>
                    </div>
                    
                    {session.current_patient.allergies && session.current_patient.allergies.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center mb-2">
                          <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                          <span className="font-medium text-red-800">Allergies:</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {session.current_patient.allergies.map((allergy, index) => (
                            <span key={index} className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">
                              {allergy}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {session.current_patient.medical_conditions && session.current_patient.medical_conditions.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-center mb-2">
                          <Heart className="h-4 w-4 text-yellow-600 mr-2" />
                          <span className="font-medium text-yellow-800">Medical Conditions:</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {session.current_patient.medical_conditions.map((condition, index) => (
                            <span key={index} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                              {condition}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No patient currently in consultation</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Patients will appear here automatically when checked in by reception
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Waiting Queue */}
          <div>
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Waiting Queue</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {waitingPatients.map((visit, index) => (
                    <div key={visit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600">#{visit.stn}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{visit.patient.name}</p>
                          <p className="text-sm text-gray-600">Age: {visit.patient.age}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          visit.status === 'checked_in' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {visit.status === 'checked_in' ? 'Ready' : 'Waiting'}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {waitingPatients.length === 0 && (
                    <div className="text-center py-8">
                      <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No patients waiting</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Consultations */}
        <Card className="mt-8">
          <CardHeader>
            <h2 className="text-xl font-semibold">Today's Consultations</h2>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Started</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {consultations.map((consultation) => (
                    <tr key={consultation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {consultation.patient?.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {consultation.patient?.uid}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          consultation.status === 'completed' ? 'bg-green-100 text-green-800' :
                          consultation.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {consultation.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTime(consultation.started_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {consultation.duration_minutes ? 
                          `${consultation.duration_minutes} min` : 
                          `${Math.floor((Date.now() - new Date(consultation.started_at).getTime()) / (1000 * 60))} min`
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePatientClick(consultation)}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {consultations.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No consultations today</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Patient Details Modal */}
      <Modal
        isOpen={showPatientModal}
        onClose={() => setShowPatientModal(false)}
        title="Patient Consultation"
        size="xl"
      >
        {selectedConsultation && (
          <div className="space-y-6">
            {/* Patient Info */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Patient Information</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {selectedConsultation.patient?.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {selectedConsultation.patient?.uid}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Age:</span>
                        <span className="ml-2 font-medium">{selectedConsultation.patient?.age}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Phone:</span>
                        <span className="ml-2 font-medium">{selectedConsultation.patient?.phone}</span>
                      </div>
                      {selectedConsultation.patient?.email && (
                        <div className="col-span-2">
                          <span className="text-gray-600">Email:</span>
                          <span className="ml-2 font-medium">{selectedConsultation.patient.email}</span>
                        </div>
                      )}
                      {selectedConsultation.patient?.blood_group && (
                        <div>
                          <span className="text-gray-600">Blood Group:</span>
                          <span className="ml-2 font-medium">{selectedConsultation.patient.blood_group}</span>
                        </div>
                      )}
                    </div>

                    {selectedConsultation.patient?.allergies && selectedConsultation.patient.allergies.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center mb-2">
                          <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                          <span className="font-medium text-red-800">Allergies:</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {selectedConsultation.patient.allergies.map((allergy, index) => (
                            <span key={index} className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                              {allergy}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedConsultation.patient?.medical_conditions && selectedConsultation.patient.medical_conditions.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-center mb-2">
                          <Heart className="h-4 w-4 text-yellow-600 mr-2" />
                          <span className="font-medium text-yellow-800">Medical Conditions:</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {selectedConsultation.patient.medical_conditions.map((condition, index) => (
                            <span key={index} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                              {condition}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Voice Notes */}
              <VoiceNoteRecorder
                consultationId={selectedConsultation.id}
                doctorId={doctor!.id}
                onNoteSaved={(note) => setConsultationNotes(prev => [note, ...prev])}
              />
            </div>

            {/* Manual Notes */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Add Manual Note</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <select
                      value={noteType}
                      onChange={(e) => setNoteType(e.target.value as any)}
                      className="border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="general">General Note</option>
                      <option value="symptoms">Symptoms</option>
                      <option value="diagnosis">Diagnosis</option>
                      <option value="prescription">Prescription</option>
                      <option value="follow_up">Follow-up</option>
                    </select>
                  </div>
                  
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Enter your notes here..."
                    rows={4}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  
                  <Button
                    onClick={saveNote}
                    disabled={!newNote.trim() || saving}
                    loading={saving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Note
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Consultation Notes */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Consultation Notes</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {consultationNotes.map((note) => (
                    <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          note.note_type === 'symptoms' ? 'bg-red-100 text-red-800' :
                          note.note_type === 'diagnosis' ? 'bg-blue-100 text-blue-800' :
                          note.note_type === 'prescription' ? 'bg-green-100 text-green-800' :
                          note.note_type === 'follow_up' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {note.note_type.replace('_', ' ').toUpperCase()}
                        </span>
                        <div className="flex items-center text-xs text-gray-500">
                          {note.is_voice_generated && (
                            <Mic className="h-3 w-3 mr-1" />
                          )}
                          {formatTime(note.created_at)}
                        </div>
                      </div>
                      <p className="text-gray-900">{note.content}</p>
                    </div>
                  ))}
                  
                  {consultationNotes.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-8 w-8 mx-auto mb-2" />
                      <p>No notes yet. Start adding notes above.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowPatientModal(false)}
                className="flex-1"
              >
                Close
              </Button>
              {selectedConsultation.status === 'in_progress' && (
                <Button
                  onClick={() => completeConsultation(selectedConsultation.id)}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Consultation
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};