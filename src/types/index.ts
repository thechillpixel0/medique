export interface Patient {
  id: string;
  uid: string;
  name: string;
  age: number;
  phone: string;
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
  created_at: string;
  updated_at: string;
  checked_in_at?: string;
  completed_at?: string;
  patient?: Patient;
}

export interface QueueStatus {
  now_serving: number;
  total_waiting: number;
  current_position?: number;
  estimated_wait_minutes?: number;
}

export interface BookingRequest {
  name: string;
  age: number;
  phone: string;
  department: string;
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
}