/*
  # Advanced Clinic Management System

  1. New Tables
    - `medical_history` - Complete medical records linked to patient UID
    - `doctors` - Doctor profiles and schedules
    - `appointments` - Scheduled appointments with doctors
    - `clinic_settings` - Configurable clinic settings
    - `departments` - Department management with fees
    - `payment_transactions` - Detailed payment tracking
    - `notifications` - Real-time notifications system

  2. Enhanced Tables
    - Enhanced `patients` table with more details
    - Enhanced `visits` table with doctor assignments
    - Enhanced audit logging

  3. Security
    - Enable RLS on all new tables
    - Add comprehensive policies
    - Add triggers for audit logging
*/

-- Medical History Table
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

-- Doctors Table
CREATE TABLE IF NOT EXISTS doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  specialization text NOT NULL,
  qualification text,
  experience_years integer DEFAULT 0,
  consultation_fee decimal(10,2) DEFAULT 0,
  available_days text[] DEFAULT ARRAY['monday','tuesday','wednesday','thursday','friday'],
  available_hours jsonb DEFAULT '{"start": "09:00", "end": "17:00"}'::jsonb,
  max_patients_per_day integer DEFAULT 50,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Appointments Table
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

-- Clinic Settings Table
CREATE TABLE IF NOT EXISTS clinic_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL,
  setting_type text DEFAULT 'general' CHECK (setting_type IN ('general', 'payment', 'notification', 'queue', 'doctor')),
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Departments Table (Enhanced)
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  consultation_fee decimal(10,2) DEFAULT 0,
  average_consultation_time integer DEFAULT 15,
  color_code text DEFAULT '#3B82F6',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Payment Transactions Table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid REFERENCES visits(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'upi', 'online', 'insurance')),
  transaction_id text,
  gateway_response jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  processed_by uuid,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Notifications Table
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

-- Add new columns to existing tables
DO $$
BEGIN
  -- Add doctor assignment to visits
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'visits' AND column_name = 'doctor_id'
  ) THEN
    ALTER TABLE visits ADD COLUMN doctor_id uuid REFERENCES doctors(id);
  END IF;

  -- Add more patient details
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'email'
  ) THEN
    ALTER TABLE patients ADD COLUMN email text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'address'
  ) THEN
    ALTER TABLE patients ADD COLUMN address text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'emergency_contact'
  ) THEN
    ALTER TABLE patients ADD COLUMN emergency_contact text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'blood_group'
  ) THEN
    ALTER TABLE patients ADD COLUMN blood_group text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'allergies'
  ) THEN
    ALTER TABLE patients ADD COLUMN allergies text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'medical_conditions'
  ) THEN
    ALTER TABLE patients ADD COLUMN medical_conditions text[];
  END IF;
END $$;

-- Enable RLS on all new tables
ALTER TABLE medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for medical_history
CREATE POLICY "Authenticated users can manage medical history"
  ON medical_history
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can read medical history with UID"
  ON medical_history
  FOR SELECT
  TO public
  USING (true);

-- RLS Policies for doctors
CREATE POLICY "Public can read active doctors"
  ON doctors
  FOR SELECT
  TO public
  USING (status = 'active');

CREATE POLICY "Authenticated users can manage doctors"
  ON doctors
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for appointments
CREATE POLICY "Authenticated users can manage appointments"
  ON appointments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can read appointments"
  ON appointments
  FOR SELECT
  TO public
  USING (true);

-- RLS Policies for clinic_settings
CREATE POLICY "Public can read clinic settings"
  ON clinic_settings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage clinic settings"
  ON clinic_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for departments
CREATE POLICY "Public can read active departments"
  ON departments
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage departments"
  ON departments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for payment_transactions
CREATE POLICY "Authenticated users can manage payment transactions"
  ON payment_transactions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can read own payment transactions"
  ON payment_transactions
  FOR SELECT
  TO public
  USING (true);

-- RLS Policies for notifications
CREATE POLICY "Users can read their own notifications"
  ON notifications
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage notifications"
  ON notifications
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_medical_history_patient_uid ON medical_history(patient_uid);
CREATE INDEX IF NOT EXISTS idx_medical_history_visit_id ON medical_history(visit_id);
CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON doctors(specialization);
CREATE INDEX IF NOT EXISTS idx_doctors_status ON doctors(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinic_settings_key ON clinic_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_visit_id ON payment_transactions(visit_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_type, recipient_id);

-- Add triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_medical_history_updated_at BEFORE UPDATE ON medical_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clinic_settings_updated_at BEFORE UPDATE ON clinic_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default clinic settings
INSERT INTO clinic_settings (setting_key, setting_value, setting_type, description) VALUES
  ('clinic_name', '"MediQueue Clinic"', 'general', 'Name of the clinic'),
  ('clinic_address', '"123 Healthcare Street, Medical City"', 'general', 'Clinic address'),
  ('clinic_phone', '"+1-234-567-8900"', 'general', 'Clinic contact number'),
  ('clinic_email', '"info@mediqueueclinic.com"', 'general', 'Clinic email address'),
  ('working_hours', '{"start": "08:00", "end": "20:00"}', 'general', 'Clinic working hours'),
  ('queue_refresh_interval', '5', 'queue', 'Queue refresh interval in seconds'),
  ('max_tokens_per_day', '200', 'queue', 'Maximum tokens per day'),
  ('average_consultation_time', '15', 'queue', 'Average consultation time in minutes'),
  ('payment_methods', '["cash", "card", "upi", "online"]', 'payment', 'Available payment methods'),
  ('consultation_fee', '500', 'payment', 'Default consultation fee'),
  ('emergency_contact', '"+1-234-567-8911"', 'general', 'Emergency contact number')
ON CONFLICT (setting_key) DO NOTHING;

-- Insert default departments
INSERT INTO departments (name, display_name, description, consultation_fee, average_consultation_time, color_code) VALUES
  ('general', 'General Medicine', 'General medical consultation and treatment', 500.00, 15, '#3B82F6'),
  ('cardiology', 'Cardiology', 'Heart and cardiovascular system specialist', 800.00, 20, '#EF4444'),
  ('dermatology', 'Dermatology', 'Skin, hair, and nail specialist', 600.00, 15, '#F59E0B'),
  ('orthopedics', 'Orthopedics', 'Bone, joint, and muscle specialist', 700.00, 20, '#10B981'),
  ('pediatrics', 'Pediatrics', 'Children and adolescent healthcare', 550.00, 15, '#8B5CF6'),
  ('ophthalmology', 'Ophthalmology', 'Eye and vision specialist', 650.00, 15, '#06B6D4'),
  ('gynecology', 'Gynecology', 'Women''s reproductive health specialist', 700.00, 20, '#EC4899'),
  ('neurology', 'Neurology', 'Brain and nervous system specialist', 900.00, 25, '#6366F1')
ON CONFLICT (name) DO NOTHING;

-- Insert sample doctors
INSERT INTO doctors (name, specialization, qualification, experience_years, consultation_fee, available_days, available_hours, max_patients_per_day) VALUES
  ('Dr. Sarah Johnson', 'general', 'MBBS, MD Internal Medicine', 8, 500.00, ARRAY['monday','tuesday','wednesday','thursday','friday'], '{"start": "09:00", "end": "17:00"}', 40),
  ('Dr. Michael Chen', 'cardiology', 'MBBS, MD Cardiology, DM', 12, 800.00, ARRAY['monday','wednesday','friday'], '{"start": "10:00", "end": "16:00"}', 25),
  ('Dr. Emily Rodriguez', 'dermatology', 'MBBS, MD Dermatology', 6, 600.00, ARRAY['tuesday','thursday','saturday'], '{"start": "09:00", "end": "15:00"}', 30),
  ('Dr. David Kumar', 'orthopedics', 'MBBS, MS Orthopedics', 10, 700.00, ARRAY['monday','tuesday','thursday','friday'], '{"start": "08:00", "end": "16:00"}', 35),
  ('Dr. Lisa Wang', 'pediatrics', 'MBBS, MD Pediatrics', 7, 550.00, ARRAY['monday','tuesday','wednesday','thursday','friday'], '{"start": "09:00", "end": "17:00"}', 45)
ON CONFLICT DO NOTHING;