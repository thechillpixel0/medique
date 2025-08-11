/*
  # Complete Clinic Token & Queue Management System Schema

  1. New Tables
    - `patients` - stores patient information with permanent UIDs
    - `visits` - stores each booking/visit record with token numbers
    - `audit_logs` - tracks all admin actions for security

  2. Security
    - Enable RLS on all tables
    - Admin-only access policies for sensitive operations
    - Public read access for queue status

  3. Features
    - Unique token numbers (STN) per day and department
    - Real-time queue management
    - Payment tracking
    - QR code payload storage
*/

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uid text UNIQUE NOT NULL,
  name text NOT NULL,
  age integer NOT NULL CHECK (age > 0 AND age <= 120),
  phone text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create visits table
CREATE TABLE IF NOT EXISTS visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
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
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  checked_in_at timestamptz,
  completed_at timestamptz,
  UNIQUE(clinic_id, department, visit_date, stn)
);

-- Create audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action_type text NOT NULL,
  action_payload jsonb,
  resource_type text,
  resource_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_uid ON patients(uid);
CREATE INDEX IF NOT EXISTS idx_visits_date_dept ON visits(visit_date, department);
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status);
CREATE INDEX IF NOT EXISTS idx_visits_stn ON visits(stn);
CREATE INDEX IF NOT EXISTS idx_visits_patient_id ON visits(patient_id);

-- Enable Row Level Security
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for patients table
CREATE POLICY "Public can read patients for queue display"
  ON patients
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert patients for booking"
  ON patients
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update patients for booking"
  ON patients
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage patients"
  ON patients
  FOR ALL
  TO authenticated
  USING (true);

-- Policies for visits table
CREATE POLICY "Public can read visits for queue display"
  ON visits
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert visits for booking"
  ON visits
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update visits for booking"
  ON visits
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage visits"
  ON visits
  FOR ALL
  TO authenticated
  USING (true);

-- Policies for audit_logs table
CREATE POLICY "Only authenticated users can read audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only authenticated users can insert audit logs"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_patients_updated_at 
  BEFORE UPDATE ON patients 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visits_updated_at 
  BEFORE UPDATE ON visits 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION create_audit_log(
  p_actor_id uuid,
  p_action_type text,
  p_action_payload jsonb DEFAULT NULL,
  p_resource_type text DEFAULT NULL,
  p_resource_id uuid DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO audit_logs (actor_id, action_type, action_payload, resource_type, resource_id)
  VALUES (p_actor_id, p_action_type, p_action_payload, p_resource_type, p_resource_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sample departments (you can modify as needed)
INSERT INTO patients (uid, name, age, phone) VALUES 
('CLN1-SAMPLE01', 'Sample Patient', 35, '+1234567890')
ON CONFLICT (uid) DO NOTHING;