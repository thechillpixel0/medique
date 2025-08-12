export interface Patient {
  id: string;
  uid: string;
  name: string;
  age: number;
  phone: string;
  email?: string;
  address?: string;
  emergency_contact?: string;
  blood_group?: string;
  allergies?: string[];
  medical_conditions?: string[];
  created_at: string;
  updated_at: string;
}

export interface Visit {
  id: string;
  patient_id: string;
  clinic_id: string;
  stn: number;
  department: string;
  visit_date: string;
  status: 'waiting' | 'checked_in' | 'in_service' | 'completed' | 'held' | 'expired';
  payment_status: 'paid' | 'pending' | 'pay_at_clinic' | 'refunded';
  payment_provider?: string;
  payment_ref?: string;
  qr_payload: string;
  estimated_time?: string;
  doctor_id?: string;
  created_at: string;
  updated_at: string;
  checked_in_at?: string;
  completed_at?: string;
  patient?: Patient;
  doctor?: Doctor;
  medical_history?: MedicalHistory[];
  payment_transactions?: PaymentTransaction[];
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  qualification?: string;
  experience_years: number;
  consultation_fee: number;
  available_days: string[];
  available_hours: {
    start: string;
    end: string;
  };
  max_patients_per_day: number;
  status: 'active' | 'inactive' | 'on_leave';
  created_at: string;
  updated_at: string;
}

export interface MedicalHistory {
  id: string;
  patient_uid: string;
  visit_id?: string;
  doctor_id?: string;
  diagnosis?: string;
  prescription?: string;
  notes?: string;
  attachments?: any[];
  created_at: string;
  updated_at: string;
  doctor?: Doctor;
  visit?: Visit;
}

export interface Department {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  consultation_fee: number;
  average_consultation_time: number;
  color_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClinicSettings {
  id: string;
  setting_key: string;
  setting_value: any;
  setting_type: 'general' | 'payment' | 'notification' | 'queue' | 'doctor';
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentTransaction {
  id: string;
  visit_id: string;
  patient_id: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'upi' | 'online' | 'insurance';
  transaction_id?: string;
  gateway_response?: any;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  processed_by?: string;
  processed_at?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  recipient_type: 'patient' | 'admin' | 'doctor';
  recipient_id?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  metadata?: any;
  created_at: string;
}

export interface QueueStatus {
  now_serving: number;
  total_waiting: number;
  current_position?: number;
  estimated_wait_minutes?: number;
  department_stats?: DepartmentStats[];
}

export interface DepartmentStats {
  department: string;
  display_name: string;
  color_code: string;
  now_serving: number;
  total_waiting: number;
  total_completed: number;
  average_wait_time: number;
  doctor_count: number;
}

export interface BookingRequest {
  name: string;
  age: number;
  phone: string;
  email?: string;
  address?: string;
  emergency_contact?: string;
  blood_group?: string;
  allergies?: string;
  medical_conditions?: string;
  department: string;
  doctor_id?: string;
  payment_mode: 'pay_now' | 'pay_at_clinic';
  notes?: string;
}

export interface BookingResponse {
  uid: string;
  visit_id: string;
  stn: number;
  department: string;
  visit_date: string;
  payment_status: string;
  qr_payload: string;
  estimated_wait_minutes: number;
  now_serving: number;
  position: number;
  doctor?: Doctor;
}

export interface Analytics {
  today: {
    total_visits: number;
    completed_visits: number;
    revenue: number;
    average_wait_time: number;
  };
  weekly: {
    visits_trend: number[];
    revenue_trend: number[];
    department_distribution: { [key: string]: number };
  };
  monthly: {
    total_visits: number;
    total_revenue: number;
    top_departments: { department: string; count: number }[];
    patient_satisfaction: number;
  };
}

export interface DoctorSession {
  id: string;
  doctor_id: string;
  session_status: 'active' | 'inactive' | 'break';
  room_name: string;
  started_at: string;
  ended_at?: string;
  current_patient_id?: string;
  created_at: string;
  updated_at: string;
  doctor?: Doctor;
  current_patient?: Patient;
}

export interface Consultation {
  id: string;
  doctor_id: string;
  patient_id: string;
  visit_id: string;
  session_id: string;
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  duration_minutes?: number;
  priority_level: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  doctor?: Doctor;
  patient?: Patient;
  visit?: Visit;
  consultation_notes?: ConsultationNote[];
  voice_transcriptions?: VoiceTranscription[];
}

export interface ConsultationNote {
  id: string;
  consultation_id: string;
  doctor_id: string;
  note_type: 'general' | 'symptoms' | 'diagnosis' | 'prescription' | 'follow_up' | 'voice_note';
  content: string;
  is_voice_generated: boolean;
  voice_confidence_score?: number;
  created_at: string;
  updated_at: string;
}

export interface VoiceTranscription {
  id: string;
  consultation_id: string;
  doctor_id: string;
  original_audio_url?: string;
  transcribed_text: string;
  confidence_score?: number;
  language_code: string;
  processing_status: 'processing' | 'completed' | 'failed';
  created_at: string;
}