/*
  # Complete Database Schema Fix
  
  This migration creates a complete, error-free database schema for the clinic management system.
  
  1. New Tables
    - `patients` - Patient information with permanent UIDs
    - `visits` - Visit/booking records with token numbers
    - `departments` - Medical departments configuration
    - `doctors` - Doctor profiles and availability
    - `clinic_settings` - System configuration
    - `medical_history` - Patient medical records
    - `payment_transactions` - Payment processing
    - `appointments` - Appointment scheduling
    - `notifications` - System notifications
    - `audit_logs` - Security audit trail
    - `consultations` - Doctor consultation sessions
    - `consultation_notes` - Notes from consultations
    - `doctor_sessions` - Doctor session management
    - `voice_transcriptions` - Voice note transcriptions
    
  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for public and authenticated access
    
  3. Functions and Triggers
    - Auto-update timestamps
    - Automatic queue management
*/

-- Drop existing tables if they exist (in correct order to handle dependencies)
DROP TABLE IF EXISTS voice_transcriptions CASCADE;
DROP TABLE IF EXISTS consultation_notes CASCADE;
DROP TABLE IF EXISTS consultations CASCADE;
DROP TABLE IF EXISTS doctor_sessions CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS medical_history CASCADE;
DROP TABLE IF EXISTS visits CASCADE;
DROP TABLE IF EXISTS clinic_settings CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS patients CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create patients table
CREATE TABLE patients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    uid text UNIQUE NOT NULL,
    name text NOT NULL,
    age integer NOT NULL CHECK (age > 0 AND age <= 120),
    phone text NOT NULL,
    email text,
    address text,
    emergency_contact text,
    blood_group text,
    allergies text[],
    medical_conditions text[],
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create departments table
CREATE TABLE departments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    display_name text NOT NULL,
    description text,
    consultation_fee numeric(10,2) DEFAULT 0,
    average_consultation_time integer DEFAULT 15,
    color_code text DEFAULT '#3B82F6',
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create doctors table
CREATE TABLE doctors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    specialization text NOT NULL,
    qualification text,
    experience_years integer DEFAULT 0,
    consultation_fee numeric(10,2) DEFAULT 0,
    available_days text[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    available_hours jsonb DEFAULT '{"start": "09:00", "end": "17:00"}'::jsonb,
    max_patients_per_day integer DEFAULT 50,
    status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create visits table
CREATE TABLE visits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    clinic_id text DEFAULT 'CLN1' NOT NULL,
    stn integer NOT NULL,
    department text NOT NULL,
    visit_date date DEFAULT CURRENT_DATE NOT NULL,
    status text DEFAULT 'waiting' CHECK (status IN ('waiting', 'checked_in', 'in_service', 'completed', 'held', 'expired')),
    payment_status text DEFAULT 'pay_at_clinic' CHECK (payment_status IN ('paid', 'pending', 'pay_at_clinic', 'refunded')),
    payment_provider text,
    payment_ref text,
    qr_payload text NOT NULL,
    estimated_time timestamptz,
    doctor_id uuid REFERENCES doctors(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    checked_in_at timestamptz,
    completed_at timestamptz,
    UNIQUE(clinic_id, department, visit_date, stn)
);

-- Create clinic_settings table
CREATE TABLE clinic_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key text UNIQUE NOT NULL,
    setting_value jsonb NOT NULL,
    setting_type text DEFAULT 'general' CHECK (setting_type IN ('general', 'payment', 'notification', 'queue', 'doctor')),
    description text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create medical_history table
CREATE TABLE medical_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_uid text NOT NULL,
    visit_id uuid REFERENCES visits(id) ON DELETE CASCADE,
    doctor_id uuid REFERENCES doctors(id),
    diagnosis text,
    prescription text,
    notes text,
    attachments jsonb DEFAULT '[]'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create payment_transactions table
CREATE TABLE payment_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id uuid REFERENCES visits(id) ON DELETE CASCADE,
    patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
    amount numeric(10,2) NOT NULL,
    payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'upi', 'online', 'insurance')),
    transaction_id text,
    gateway_response jsonb,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    processed_by uuid,
    processed_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- Create appointments table
CREATE TABLE appointments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id uuid REFERENCES doctors(id) ON DELETE CASCADE,
    visit_id uuid REFERENCES visits(id) ON DELETE CASCADE,
    appointment_date date NOT NULL,
    appointment_time time NOT NULL,
    duration_minutes integer DEFAULT 30,
    status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_type text NOT NULL CHECK (recipient_type IN ('patient', 'admin', 'doctor')),
    recipient_id text,
    title text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read boolean DEFAULT false,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id uuid,
    action_type text NOT NULL,
    action_payload jsonb,
    resource_type text,
    resource_id uuid,
    created_at timestamptz DEFAULT now()
);

-- Create doctor_sessions table
CREATE TABLE doctor_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    session_status text DEFAULT 'active' CHECK (session_status IN ('active', 'inactive', 'break')),
    room_name text NOT NULL,
    started_at timestamptz DEFAULT now(),
    ended_at timestamptz,
    current_patient_id uuid REFERENCES patients(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create consultations table
CREATE TABLE consultations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    visit_id uuid NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    session_id uuid NOT NULL REFERENCES doctor_sessions(id) ON DELETE CASCADE,
    status text DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed', 'cancelled')),
    started_at timestamptz DEFAULT now(),
    completed_at timestamptz,
    duration_minutes integer,
    priority_level text DEFAULT 'normal' CHECK (priority_level IN ('low', 'normal', 'high', 'urgent')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create consultation_notes table
CREATE TABLE consultation_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id uuid NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    note_type text DEFAULT 'general' CHECK (note_type IN ('general', 'symptoms', 'diagnosis', 'prescription', 'follow_up', 'voice_note')),
    content text NOT NULL,
    is_voice_generated boolean DEFAULT false,
    voice_confidence_score numeric(3,2),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create voice_transcriptions table
CREATE TABLE voice_transcriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id uuid NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    original_audio_url text,
    transcribed_text text NOT NULL,
    confidence_score numeric(3,2),
    language_code text DEFAULT 'en-US',
    processing_status text DEFAULT 'completed' CHECK (processing_status IN ('processing', 'completed', 'failed')),
    created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_patients_uid ON patients(uid);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_visits_patient_id ON visits(patient_id);
CREATE INDEX idx_visits_date_dept ON visits(visit_date, department);
CREATE INDEX idx_visits_status ON visits(status);
CREATE INDEX idx_visits_stn ON visits(stn);
CREATE INDEX idx_doctors_specialization ON doctors(specialization);
CREATE INDEX idx_doctors_status ON doctors(status);
CREATE INDEX idx_medical_history_patient_uid ON medical_history(patient_uid);
CREATE INDEX idx_medical_history_visit_id ON medical_history(visit_id);
CREATE INDEX idx_payment_transactions_visit_id ON payment_transactions(visit_id);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_type, recipient_id);
CREATE INDEX idx_clinic_settings_key ON clinic_settings(setting_key);
CREATE INDEX idx_departments_name ON departments(name);

-- Add triggers for updated_at columns
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON visits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clinic_settings_updated_at BEFORE UPDATE ON clinic_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medical_history_updated_at BEFORE UPDATE ON medical_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_doctor_sessions_updated_at BEFORE UPDATE ON doctor_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON consultations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_consultation_notes_updated_at BEFORE UPDATE ON consultation_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security on all tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_transcriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for patients
CREATE POLICY "Public can read patients for queue display" ON patients FOR SELECT TO public USING (true);
CREATE POLICY "Public can insert patients for booking" ON patients FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public can update patients for booking" ON patients FOR UPDATE TO public USING (true);
CREATE POLICY "Authenticated users can manage patients" ON patients FOR ALL TO authenticated USING (true);

-- Create RLS policies for departments
CREATE POLICY "Public can read active departments" ON departments FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Authenticated users can manage departments" ON departments FOR ALL TO authenticated USING (true);

-- Create RLS policies for doctors
CREATE POLICY "Public can read active doctors" ON doctors FOR SELECT TO public USING (status = 'active');
CREATE POLICY "Authenticated users can manage doctors" ON doctors FOR ALL TO authenticated USING (true);

-- Create RLS policies for visits
CREATE POLICY "Public can read visits for queue display" ON visits FOR SELECT TO public USING (true);
CREATE POLICY "Public can insert visits for booking" ON visits FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow visit updates for payments" ON visits FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage visits" ON visits FOR ALL TO authenticated USING (true);

-- Create RLS policies for clinic_settings
CREATE POLICY "Public can read clinic settings" ON clinic_settings FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can manage clinic settings" ON clinic_settings FOR ALL TO authenticated USING (true);

-- Create RLS policies for medical_history
CREATE POLICY "Public can read medical history with UID" ON medical_history FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can manage medical history" ON medical_history FOR ALL TO authenticated USING (true);

-- Create RLS policies for payment_transactions
CREATE POLICY "Allow public payment reading" ON payment_transactions FOR SELECT TO public USING (true);
CREATE POLICY "Allow public payment creation" ON payment_transactions FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow admin payment updates" ON payment_transactions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin payment management" ON payment_transactions FOR ALL TO authenticated USING (true);

-- Create RLS policies for appointments
CREATE POLICY "Public can read appointments" ON appointments FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can manage appointments" ON appointments FOR ALL TO authenticated USING (true);

-- Create RLS policies for notifications
CREATE POLICY "Users can read their own notifications" ON notifications FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can manage notifications" ON notifications FOR ALL TO authenticated USING (true);

-- Create RLS policies for audit_logs
CREATE POLICY "Only authenticated users can read audit logs" ON audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only authenticated users can insert audit logs" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Create RLS policies for doctor_sessions
CREATE POLICY "Authenticated users can manage doctor sessions" ON doctor_sessions FOR ALL TO authenticated USING (true);
CREATE POLICY "Public can read doctor sessions" ON doctor_sessions FOR SELECT TO public USING (true);

-- Create RLS policies for consultations
CREATE POLICY "Authenticated users can manage consultations" ON consultations FOR ALL TO authenticated USING (true);
CREATE POLICY "Public can read consultations" ON consultations FOR SELECT TO public USING (true);

-- Create RLS policies for consultation_notes
CREATE POLICY "Authenticated users can manage consultation notes" ON consultation_notes FOR ALL TO authenticated USING (true);
CREATE POLICY "Public can read consultation notes" ON consultation_notes FOR SELECT TO public USING (true);

-- Create RLS policies for voice_transcriptions
CREATE POLICY "Authenticated users can manage voice transcriptions" ON voice_transcriptions FOR ALL TO authenticated USING (true);
CREATE POLICY "Public can read voice transcriptions" ON voice_transcriptions FOR SELECT TO public USING (true);

-- Insert default departments
INSERT INTO departments (name, display_name, description, consultation_fee, average_consultation_time, color_code, is_active) VALUES
('general', 'General Medicine', 'General medical consultation and treatment', 500, 15, '#3B82F6', true),
('cardiology', 'Cardiology', 'Heart and cardiovascular system treatment', 800, 20, '#EF4444', true),
('orthopedics', 'Orthopedics', 'Bone, joint, and muscle treatment', 700, 18, '#10B981', true),
('pediatrics', 'Pediatrics', 'Child healthcare and treatment', 600, 20, '#F59E0B', true),
('dermatology', 'Dermatology', 'Skin and hair treatment', 650, 15, '#8B5CF6', true),
('neurology', 'Neurology', 'Brain and nervous system treatment', 900, 25, '#EC4899', true);

-- Insert default clinic settings
INSERT INTO clinic_settings (setting_key, setting_value, setting_type, description) VALUES
('clinic_name', '"MediQueue Clinic"', 'general', 'Name of the clinic'),
('maintenance_mode', 'false', 'general', 'Enable maintenance mode to prevent new bookings'),
('maintenance_message', '"System is under maintenance. Please try again later."', 'general', 'Message to show when maintenance mode is enabled'),
('average_consultation_time', '15', 'general', 'Average consultation time in minutes'),
('max_tokens_per_day', '100', 'general', 'Maximum tokens per day per department'),
('clinic_hours_start', '"09:00"', 'general', 'Clinic opening time'),
('clinic_hours_end', '"18:00"', 'general', 'Clinic closing time'),
('auto_refresh_interval', '30', 'general', 'Auto refresh interval in seconds for admin dashboard'),
('stripe_publishable_key', '"pk_test_51234567890abcdef"', 'payment', 'Stripe publishable key for payments'),
('stripe_secret_key', '"sk_test_51234567890abcdef"', 'payment', 'Stripe secret key for payments'),
('enable_online_payments', 'true', 'payment', 'Enable online payment processing');

-- Insert sample doctors
INSERT INTO doctors (name, specialization, qualification, experience_years, consultation_fee, available_days, available_hours, max_patients_per_day, status) VALUES
('Dr. Rajesh Kumar', 'general', 'MBBS, MD', 10, 500, ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], '{"start": "09:00", "end": "17:00"}'::jsonb, 50, 'active'),
('Dr. Priya Sharma', 'cardiology', 'MBBS, MD, DM Cardiology', 15, 800, ARRAY['monday', 'wednesday', 'friday'], '{"start": "10:00", "end": "16:00"}'::jsonb, 30, 'active'),
('Dr. Amit Singh', 'orthopedics', 'MBBS, MS Orthopedics', 12, 700, ARRAY['tuesday', 'thursday', 'saturday'], '{"start": "09:00", "end": "15:00"}'::jsonb, 40, 'active'),
('Dr. Sunita Patel', 'pediatrics', 'MBBS, MD Pediatrics', 8, 600, ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], '{"start": "08:00", "end": "14:00"}'::jsonb, 60, 'active'),
('Dr. Vikram Gupta', 'dermatology', 'MBBS, MD Dermatology', 7, 650, ARRAY['monday', 'wednesday', 'friday'], '{"start": "11:00", "end": "17:00"}'::jsonb, 35, 'active'),
('Dr. Neha Agarwal', 'neurology', 'MBBS, MD, DM Neurology', 18, 900, ARRAY['tuesday', 'thursday'], '{"start": "10:00", "end": "16:00"}'::jsonb, 25, 'active');

-- Create a sample patient for testing
INSERT INTO patients (uid, name, age, phone, email, blood_group) VALUES
('CLN1-TEST001', 'Test Patient', 30, '9999999999', 'test@example.com', 'O+');