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
  Activity,
  ChevronDown,
  ArrowRight,
  UserPlus,
  Timer,
  Bell,
  Pause,
  SkipForward,
  MessageSquare,
  ClipboardList,
  TrendingUp,
  RefreshCw,
  Settings,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { VoiceNoteRecorder } from '../components/VoiceNoteRecorder';
import { useAuth } from '../hooks/useAuth';
import { useDoctorSession } from '../hooks/useDoctorSession';
import { useRealTimeUpdates } from '../hooks/useRealTimeUpdates';
import { supabase } from '../lib/supabase';
import { Doctor, Patient, Consultation, ConsultationNote, DoctorSession, Visit } from '../types';
import { formatTime, formatRelativeTime } from '../lib/utils';

export const DoctorRoomPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [roomName, setRoomName] = useState('');
  const [showStartModal, setShowStartModal] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [consultationNotes, setConsultationNotes] = useState<ConsultationNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<'general' | 'symptoms' | 'diagnosis' | 'prescription' | 'follow_up'>('general');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [consultationTimer, setConsultationTimer] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const {
    session,
    consultations,
    waitingPatients,
    currentPatient,
    loading: sessionLoading,
    error: sessionError,
    startSession,
    endSession,
    updateSessionStatus,
    startConsultation,
    completeConsultation,
    callNextPatient,
    refetch
  } = useDoctorSession(selectedDoctor?.id);

  // Real-time updates
  useRealTimeUpdates(() => {
    if (selectedDoctor && autoRefresh) {
      refetch();
    }
  });

  // Session timer
  useEffect(() => {
    if (session && session.session_status === 'active') {
      const interval = setInterval(() => {
        const startTime = new Date(session.started_at).getTime();
        const now = Date.now();
        setSessionTimer(Math.floor((now - startTime) / 1000));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [session]);

  // Consultation timer
  useEffect(() => {
    const activeConsultation = consultations.find(c => c.status === 'in_progress');
    if (activeConsultation) {
      const interval = setInterval(() => {
        const startTime = new Date(activeConsultation.started_at).getTime();
        const now = Date.now();
        setConsultationTimer(Math.floor((now - startTime) / 1000));
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setConsultationTimer(0);
    }
  }, [consultations]);

  // Sound notifications
  useEffect(() => {
    if (soundEnabled && waitingPatients.length > 0 && !currentPatient) {
      // Play notification sound when patients are waiting
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
      audio.volume = 0.3;
      audio.play().catch(() => {}); // Ignore errors if audio can't play
    }
  }, [waitingPatients.length, currentPatient, soundEnabled]);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctor) {
      setRoomName(`${selectedDoctor.name}'s Room`);
    }
  }, [selectedDoctor]);

  const fetchDoctors = async () => {
    try {
      setError('');
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) {
        console.error('Error fetching doctors:', error);
        setError('Failed to load doctors. Please check your database connection.');
        return;
      }

      if (!data || data.length === 0) {
        // Create a default doctor if none exist
        const { data: newDoctor, error: createError } = await supabase
          .from('doctors')
          .insert({
            name: `Dr. ${user?.email?.split('@')[0] || 'Doctor'}`,
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

        if (createError) {
          console.error('Error creating doctor:', createError);
          setError('Failed to create doctor profile. Please try again.');
          return;
        }

        setDoctors([newDoctor]);
      } else {
        setDoctors(data);
      }
    } catch (error) {
      console.error('Error in fetchDoctors:', error);
      setError('Failed to load doctors. Please try again.');
    } finally {
      setLoading(false);
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

      if (error) {
        console.error('Error fetching consultation notes:', error);
      } else {
        setConsultationNotes(data || []);
      }
    } catch (error) {
      console.error('Error in handlePatientClick:', error);
    }
    
    setShowPatientModal(true);
  };

  const saveNote = async () => {
    if (!selectedConsultation || !newNote.trim() || !selectedDoctor) return;
    
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('consultation_notes')
        .insert({
          consultation_id: selectedConsultation.id,
          doctor_id: selectedDoctor.id,
          note_type: noteType,
          content: newNote.trim(),
          is_voice_generated: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving note:', error);
        setError('Failed to save note. Please try again.');
        return;
      }
      
      setConsultationNotes(prev => [data, ...prev]);
      setNewNote('');
      setSuccess('Note saved successfully!');
      
    } catch (error) {
      console.error('Error in saveNote:', error);
      setError('Failed to save note. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleStartConsultation = async (visitId: string) => {
    try {
      setError('');
      const consultation = await startConsultation(visitId);
      if (consultation) {
        setSuccess('Consultation started successfully!');
      }
    } catch (error) {
      console.error('Error starting consultation:', error);
      setError('Failed to start consultation.');
    }
  };

  const handleCompleteConsultation = async (consultationId: string) => {
    try {
      setError('');
      await completeConsultation(consultationId);
      setSuccess('Consultation completed successfully!');
      setShowPatientModal(false);
    } catch (error) {
      console.error('Error completing consultation:', error);
      setError('Failed to complete consultation.');
    }
  };

  const handleCallNextPatient = async () => {
    try {
      setError('');
      const consultation = await callNextPatient();
      if (consultation) {
        setSuccess('Next patient called successfully!');
      } else {
        setError('No patients waiting in queue.');
      }
    } catch (error) {
      console.error('Error calling next patient:', error);
      setError('Failed to call next patient.');
    }
  };

  const formatTimer = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    if (type === 'success') {
      setSuccess(message);
      setError('');
    } else {
      setError(message);
      setSuccess('');
    }
    
    setTimeout(() => {
      setSuccess('');
      setError('');
    }, 5000);
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

  // Show loading state
  if (loading || sessionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading doctor room...</p>
        </div>
      </div>
    );
  }

  // Show doctor selection if no doctor selected
  if (!selectedDoctor) {
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
                Select Your Doctor Profile
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Choose your doctor profile to start your consultation session
              </p>
              
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">{error}</p>
                </div>
              )}
              
              <div className="max-w-md mx-auto mb-8">
                <div className="relative">
                  <select
                    value={selectedDoctor?.id || ''}
                    onChange={(e) => {
                      const doctor = doctors.find(d => d.id === e.target.value);
                      setSelectedDoctor(doctor || null);
                    }}
                    className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="">Select Doctor Profile</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name} - {doctor.specialization}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
              
              {doctors.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-yellow-800">
                    No doctor profiles found. A default profile will be created for you.
                  </p>
                </div>
              )}
              
              <Button
                onClick={() => setShowStartModal(true)}
                size="lg"
                className="px-12 py-4 text-lg"
                disabled={!selectedDoctor}
              >
                <Play className="h-6 w-6 mr-3" />
                Continue to Room Setup
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show session start modal if no active session
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Stethoscope className="h-8 w-8 text-blue-600 mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">Doctor Room</h1>
              </div>
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedDoctor(null)}
                  size="sm"
                >
                  Change Doctor
                </Button>
                <Button variant="outline" onClick={() => signOut()}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="bg-white rounded-2xl shadow-xl p-12">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <User className="h-12 w-12 text-blue-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome, {selectedDoctor.name}!
              </h2>
              <p className="text-xl text-gray-600 mb-2">
                {selectedDoctor.specialization} • {selectedDoctor.qualification}
              </p>
              <p className="text-gray-500 mb-8">
                {selectedDoctor.experience_years} years experience
              </p>
              
              {(error || sessionError) && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">{error || sessionError}</p>
                </div>
              )}
              
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
                onClick={async () => {
                  const newSession = await startSession(roomName);
                  if (newSession) {
                    showNotification('Session started successfully!');
                  }
                }}
                size="lg"
                className="px-12 py-4 text-lg"
                disabled={!roomName.trim() || saving}
                loading={saving}
              >
                <Play className="h-6 w-6 mr-3" />
                Start Session
              </Button>
            </div>
          </div>
        </main>
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
                  {selectedDoctor.name} • Session: {formatTimer(sessionTimer)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  session?.session_status === 'active' ? 'bg-green-500 animate-pulse' : 
                  session?.session_status === 'break' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm font-medium capitalize">
                  {session?.session_status}
                </span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateSessionStatus(session?.session_status === 'active' ? 'break' : 'active')}
                disabled={saving}
              >
                {session?.session_status === 'active' ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Take Break
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedDoctor(null)}
              >
                Change Doctor
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={async () => {
                  await endSession();
                  showNotification('Session ended successfully!');
                }} 
                disabled={saving}
              >
                <LogOut className="h-4 w-4 mr-2" />
                End Session
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Notifications */}
      {(error || sessionError) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error || sessionError}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">{success}</p>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active</p>
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
                  <p className="text-sm font-medium text-gray-600">Completed</p>
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
                  <p className="text-sm font-medium text-gray-600">Waiting</p>
                  <p className="text-2xl font-bold text-gray-900">{waitingPatients.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Timer className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Session</p>
                  <p className="text-2xl font-bold text-gray-900">{formatTimer(sessionTimer)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Activity className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Current</p>
                  <p className="text-2xl font-bold text-gray-900">{formatTimer(consultationTimer)}</p>
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
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Current Patient</h2>
                  {!currentPatient && waitingPatients.length > 0 && (
                    <Button
                      onClick={handleCallNextPatient}
                      size="sm"
                      className="animate-pulse"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Call Next Patient
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {currentPatient ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {currentPatient.patient?.name}
                          </h3>
                          <p className="text-gray-600">
                            Token #{currentPatient.stn} • Age: {currentPatient.patient?.age}
                          </p>
                          <p className="text-gray-600">
                            ID: {currentPatient.patient?.uid}
                          </p>
                          <p className="text-gray-600">
                            Phone: {currentPatient.patient?.phone}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600 mb-2">
                          {formatTimer(consultationTimer)}
                        </div>
                        <Button
                          onClick={() => {
                            const consultation = activeConsultations.find(c => 
                              c.visit_id === currentPatient.id
                            );
                            if (consultation) {
                              handlePatientClick(consultation);
                            }
                          }}
                          size="sm"
                        >
                          Open Profile
                        </Button>
                      </div>
                    </div>
                    
                    {/* Patient Health Info */}
                    {currentPatient.patient?.allergies && currentPatient.patient.allergies.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center mb-2">
                          <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                          <span className="font-medium text-red-800">Allergies:</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {currentPatient.patient.allergies.map((allergy, index) => (
                            <span key={index} className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">
                              {allergy}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {currentPatient.patient?.medical_conditions && currentPatient.patient.medical_conditions.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-center mb-2">
                          <Heart className="h-4 w-4 text-yellow-600 mr-2" />
                          <span className="font-medium text-yellow-800">Medical Conditions:</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {currentPatient.patient.medical_conditions.map((condition, index) => (
                            <span key={index} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                              {condition}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="flex space-x-3">
                      <Button
                        onClick={() => {
                          const consultation = activeConsultations.find(c => 
                            c.visit_id === currentPatient.id
                          );
                          if (consultation) {
                            handleCompleteConsultation(consultation.id);
                          }
                        }}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Complete Consultation
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCallNextPatient}
                        disabled={waitingPatients.length === 0}
                      >
                        <SkipForward className="h-4 w-4 mr-2" />
                        Next Patient
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No patient currently in consultation</p>
                    {waitingPatients.length > 0 ? (
                      <Button onClick={handleCallNextPatient} className="animate-bounce">
                        <Bell className="h-4 w-4 mr-2" />
                        Call Next Patient ({waitingPatients.length} waiting)
                      </Button>
                    ) : (
                      <p className="text-sm text-gray-400">
                        Patients will appear here when they check in
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Waiting Queue */}
          <div>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Waiting Queue</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refetch}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {waitingPatients.map((visit, index) => (
                    <div key={visit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600">#{visit.stn}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{visit.patient?.name}</p>
                          <p className="text-sm text-gray-600">Age: {visit.patient?.age}</p>
                          <p className="text-xs text-gray-500">
                            Waiting: {formatRelativeTime(visit.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          visit.status === 'checked_in' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {visit.status === 'checked_in' ? 'Ready' : 'Waiting'}
                        </span>
                        {index === 0 && !currentPatient && (
                          <Button
                            size="sm"
                            onClick={() => handleStartConsultation(visit.id)}
                            className="mt-2 w-full"
                          >
                            <ArrowRight className="h-3 w-3 mr-1" />
                            Start
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {waitingPatients.length === 0 && (
                    <div className="text-center py-8">
                      <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No patients waiting</p>
                      <p className="text-gray-400 text-xs mt-1">
                        Patients will appear here when they check in
                      </p>
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
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Today's Consultations</h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  Total: {consultations.length} | Completed: {completedToday}
                </span>
                <Button variant="outline" size="sm" onClick={refetch}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Token</th>
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
                        <div className="text-lg font-bold text-gray-900">
                          #{consultation.visit?.stn}
                        </div>
                      </td>
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
                          consultation.status === 'in_progress' ?
                          formatTimer(Math.floor((Date.now() - new Date(consultation.started_at).getTime()) / 1000)) :
                          '-'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePatientClick(consultation)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {consultation.status === 'in_progress' && (
                            <Button
                              size="sm"
                              onClick={() => handleCompleteConsultation(consultation.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Complete
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {consultations.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No consultations today</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Consultations will appear here when you start seeing patients
                  </p>
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
                          Token #{selectedConsultation.visit?.stn} • {selectedConsultation.patient?.uid}
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
              {selectedDoctor && (
                <VoiceNoteRecorder
                  consultationId={selectedConsultation.id}
                  doctorId={selectedDoctor.id}
                  onNoteSaved={(note) => {
                    setConsultationNotes(prev => [note, ...prev]);
                    showNotification('Voice note saved successfully!');
                  }}
                />
              )}
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
                      <MessageSquare className="h-8 w-8 mx-auto mb-2" />
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
                  onClick={() => handleCompleteConsultation(selectedConsultation.id)}
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

      {/* Settings Modal */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Doctor Room Settings"
        size="md"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Auto Refresh</h4>
              <p className="text-sm text-gray-600">Automatically refresh patient data</p>
            </div>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Sound Notifications</h4>
              <p className="text-sm text-gray-600">Play sound when patients are waiting</p>
            </div>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-medium text-gray-900 mb-4">Session Statistics</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-lg font-bold text-gray-900">{consultations.length}</div>
                <div className="text-gray-600">Total Consultations</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-lg font-bold text-gray-900">{completedToday}</div>
                <div className="text-gray-600">Completed Today</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-lg font-bold text-gray-900">{waitingPatients.length}</div>
                <div className="text-gray-600">Currently Waiting</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-lg font-bold text-gray-900">{formatTimer(sessionTimer)}</div>
                <div className="text-gray-600">Session Duration</div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setShowSettings(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};