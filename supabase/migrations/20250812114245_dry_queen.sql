/*
  # Complete Payment System Fix

  1. Fix RLS Policies
    - Allow public users to create payments
    - Allow admins to manage all payments
    - Fix patient and visit access

  2. Add Revenue Tracking
    - Create revenue views
    - Add payment analytics

  3. Fix QR Code Scanning
    - Ensure proper visit lookup
    - Fix check-in process
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Allow public payment creation" ON payment_transactions;
DROP POLICY IF EXISTS "Allow admin payment management" ON payment_transactions;
DROP POLICY IF EXISTS "Allow admin payment updates" ON payment_transactions;
DROP POLICY IF EXISTS "Allow public payment reading" ON payment_transactions;

-- Create comprehensive payment policies
CREATE POLICY "Public can create payments"
  ON payment_transactions
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can read payments"
  ON payment_transactions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated can manage payments"
  ON payment_transactions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Fix visit policies for QR scanning
DROP POLICY IF EXISTS "Allow visit updates for payments" ON visits;
CREATE POLICY "Public can update visits for check-in"
  ON visits
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Create revenue tracking view
CREATE OR REPLACE VIEW daily_revenue AS
SELECT 
  DATE(pt.created_at) as date,
  SUM(pt.amount) as total_revenue,
  COUNT(*) as transaction_count,
  AVG(pt.amount) as avg_transaction
FROM payment_transactions pt
WHERE pt.status = 'completed'
GROUP BY DATE(pt.created_at)
ORDER BY date DESC;

-- Create department revenue view
CREATE OR REPLACE VIEW department_revenue AS
SELECT 
  v.department,
  d.display_name,
  SUM(pt.amount) as total_revenue,
  COUNT(*) as transaction_count,
  AVG(pt.amount) as avg_revenue
FROM payment_transactions pt
JOIN visits v ON pt.visit_id = v.id
JOIN departments d ON v.department = d.name
WHERE pt.status = 'completed'
GROUP BY v.department, d.display_name
ORDER BY total_revenue DESC;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_visits_qr_payload ON visits USING gin(qr_payload);

-- Add more clinic settings for customization
INSERT INTO clinic_settings (setting_key, setting_value, setting_type, description) VALUES
('refresh_interval', 15, 'general', 'Auto refresh interval in seconds'),
('show_patient_photos', false, 'general', 'Enable patient photo uploads'),
('enable_sms_notifications', false, 'notification', 'Send SMS notifications to patients'),
('clinic_address', 'Main Street, City', 'general', 'Clinic address for display'),
('clinic_phone', '+91-9876543210', 'general', 'Clinic contact phone number'),
('working_days', '["monday","tuesday","wednesday","thursday","friday","saturday"]', 'general', 'Clinic working days'),
('lunch_break_start', '13:00', 'general', 'Lunch break start time'),
('lunch_break_end', '14:00', 'general', 'Lunch break end time'),
('max_advance_booking_days', 7, 'general', 'Maximum days in advance for booking'),
('enable_online_consultation', false, 'general', 'Enable online consultation feature'),
('consultation_duration_buffer', 5, 'general', 'Buffer time between consultations in minutes'),
('enable_patient_feedback', true, 'general', 'Enable patient feedback system'),
('default_language', 'en', 'general', 'Default language (en/hi)'),
('enable_multi_language', true, 'general', 'Enable multi-language support')
ON CONFLICT (setting_key) DO NOTHING;