/*
  # Initial Database Schema Setup

  1. New Tables
    - `patients` - Patient information with permanent UIDs
    - `visits` - Visit/booking records with token numbers (STN)
    - `audit_logs` - Security audit trail for admin actions
    - `departments` - Medical departments configuration
    - `doctors` - Doctor profiles and availability
    - `clinic_settings` - System configuration settings
    - `medical_history` - Patient medical records
    - `payment_transactions` - Payment processing records
    - `appointments` - Appointment scheduling
    - `notifications` - System notifications
    - `consultations` - Doctor consultation sessions
    - `consultation_notes` - Notes from consultations
    - `doctor_sessions` - Doctor session management
    - `voice_transcriptions` - Voice note transcriptions

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for public and authenticated access

  3. Functions
    - Updated timestamp trigger function
*/

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
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

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
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

-- Doctors table
CREATE TABLE IF NOT EXISTS doctors (
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

-- Visits table
CREATE TABLE IF NOT EXISTS visits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    clinic_id text NOT NULL DEFAULT 'CLN1',
    stn integer NOT NULL,
    department text NOT NULL,
    visit_date date NOT NULL DEFAULT CURRENT_DATE,
    status text DEFAULT 'waiting' CHECK (status IN ('waiting', 'checked_in', 'in_service', 'completed', 'held', 'expired')),
    payment_status text DEFAULT 'pay_at_clinic' CHECK (payment_status IN ('paid', 'pending', 'pay_at_clinic', 'refunded')),
    payment_provider text,
    payment_ref text,
    qr_payload text NOT NULL,
    estimated_time timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    checked_in_at timestamptz,
    completed_at timestamptz,
    doctor_id uuid REFERENCES doctors(id),
    UNIQUE(clinic_id, department, visit_date, stn)
);

-- Medical History table
CREATE TABLE IF NOT EXISTS medical_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_uid text NOT NULL,
    visit_id uuid REFERENCES visits(id) ON DELETE CASCADE,
    doctor_id uuid,
    diagnosis text,
    prescription text,
    notes text,
    attachments jsonb DEFAULT '[]'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Payment Transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
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

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
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

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
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

-- Clinic Settings table
CREATE TABLE IF NOT EXISTS clinic_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key text UNIQUE NOT NULL,
    setting_value jsonb NOT NULL,
    setting_type text DEFAULT 'general' CHECK (setting_type IN ('general', 'payment', 'notification', 'queue', 'doctor')),
    description text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id uuid,
    action_type text NOT NULL,
    action_payload jsonb,
    resource_type text,
    resource_id uuid,
    created_at timestamptz DEFAULT now()
);

-- Doctor Sessions table
CREATE TABLE IF NOT EXISTS doctor_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id uuid NOT NULL REFERENCES doctors(id),
    session_status text DEFAULT 'active' CHECK (session_status IN ('active', 'inactive', 'break')),
    room_name text,
    current_patient_id uuid REFERENCES patients(id),
    started_at timestamptz DEFAULT now(),
    ended_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- Consultations table
CREATE TABLE IF NOT EXISTS consultations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid REFERENCES doctor_sessions(id),
    patient_id uuid REFERENCES patients(id),
    visit_id uuid REFERENCES visits(id),
    doctor_id uuid REFERENCES doctors(id),
    status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    started_at timestamptz DEFAULT now(),
    completed_at timestamptz,
    duration_minutes integer,
    created_at timestamptz DEFAULT now()
);

-- Consultation Notes table
CREATE TABLE IF NOT EXISTS consultation_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id uuid REFERENCES consultations(id),
    doctor_id uuid REFERENCES doctors(id),
    note_type text DEFAULT 'general' CHECK (note_type IN ('general', 'symptoms', 'diagnosis', 'prescription', 'follow_up')),
    content text NOT NULL,
    is_voice_generated boolean DEFAULT false,
    voice_confidence_score numeric(3,2),
    created_at timestamptz DEFAULT now()
);

-- Voice Transcriptions table
CREATE TABLE IF NOT EXISTS voice_transcriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id uuid REFERENCES consultations(id),
    doctor_id uuid REFERENCES doctors(id),
    transcribed_text text NOT NULL,
    confidence_score numeric(3,2),
    language_code text DEFAULT 'en-US',
    processing_status text DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patients_uid ON patients(uid);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_visits_patient_id ON visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_stn ON visits(stn);
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status);
CREATE INDEX IF NOT EXISTS idx_visits_date_dept ON visits(visit_date, department);
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);
CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON doctors(specialization);
CREATE INDEX IF NOT EXISTS idx_doctors_status ON doctors(status);
CREATE INDEX IF NOT EXISTS idx_medical_history_patient_uid ON medical_history(patient_uid);
CREATE INDEX IF NOT EXISTS idx_medical_history_visit_id ON medical_history(visit_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_visit_id ON payment_transactions(visit_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_type, recipient_id);
CREATE INDEX IF NOT EXISTS idx_clinic_settings_key ON clinic_settings(setting_key);

-- Enable Row Level Security
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_transcriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Patients policies
CREATE POLICY "Public can insert patients for booking" ON patients FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public can read patients for queue display" ON patients FOR SELECT TO public USING (true);
CREATE POLICY "Public can update patients for booking" ON patients FOR UPDATE TO public USING (true);
CREATE POLICY "Authenticated users can manage patients" ON patients FOR ALL TO authenticated USING (true);

-- Visits policies
CREATE POLICY "Public can insert visits for booking" ON visits FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public can read visits for queue display" ON visits FOR SELECT TO public USING (true);
CREATE POLICY "Allow visit updates for payments" ON visits FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage visits" ON visits FOR ALL TO authenticated USING (true);

-- Departments policies
CREATE POLICY "Public can read active departments" ON departments FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Authenticated users can manage departments" ON departments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Doctors policies
CREATE POLICY "Public can read active doctors" ON doctors FOR SELECT TO public USING (status = 'active');
CREATE POLICY "Authenticated users can manage doctors" ON doctors FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Medical History policies
CREATE POLICY "Public can read medical history with UID" ON medical_history FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can manage medical history" ON medical_history FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Payment Transactions policies
CREATE POLICY "Allow public payment creation" ON payment_transactions FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public payment reading" ON payment_transactions FOR SELECT TO public USING (true);
CREATE POLICY "Allow admin payment management" ON payment_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin payment updates" ON payment_transactions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Appointments policies
CREATE POLICY "Public can read appointments" ON appointments FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can manage appointments" ON appointments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Notifications policies
CREATE POLICY "Users can read their own notifications" ON notifications FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can manage notifications" ON notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Clinic Settings policies
CREATE POLICY "Public can read clinic settings" ON clinic_settings FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can manage clinic settings" ON clinic_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Audit Logs policies
CREATE POLICY "Only authenticated users can insert audit logs" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Only authenticated users can read audit logs" ON audit_logs FOR SELECT TO authenticated USING (true);

-- Doctor Sessions policies
CREATE POLICY "Authenticated users can manage doctor sessions" ON doctor_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Consultations policies
CREATE POLICY "Authenticated users can manage consultations" ON consultations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Consultation Notes policies
CREATE POLICY "Authenticated users can manage consultation notes" ON consultation_notes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Voice Transcriptions policies
CREATE POLICY "Authenticated users can manage voice transcriptions" ON voice_transcriptions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create triggers for updated_at columns
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON visits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medical_history_updated_at BEFORE UPDATE ON medical_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clinic_settings_updated_at BEFORE UPDATE ON clinic_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();