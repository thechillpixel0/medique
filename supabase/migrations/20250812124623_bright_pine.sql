/*
  # Insert Default Data

  1. Default Departments
    - General Medicine
    - Cardiology
    - Orthopedics
    - Pediatrics

  2. Default Clinic Settings
    - Basic clinic configuration
    - Payment settings
    - Queue settings

  3. Sample Doctor
    - Default doctor for testing
*/

-- Insert default departments
INSERT INTO departments (name, display_name, description, consultation_fee, average_consultation_time, color_code, is_active) VALUES
('general', 'General Medicine', 'General medical consultation and treatment', 500, 15, '#3B82F6', true),
('cardiology', 'Cardiology', 'Heart and cardiovascular system treatment', 800, 20, '#EF4444', true),
('orthopedics', 'Orthopedics', 'Bone, joint, and muscle treatment', 700, 18, '#10B981', true),
('pediatrics', 'Pediatrics', 'Child healthcare and treatment', 600, 20, '#F59E0B', true)
ON CONFLICT (name) DO NOTHING;

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
('enable_online_payments', 'true', 'payment', 'Enable online payment processing')
ON CONFLICT (setting_key) DO NOTHING;

-- Insert a default doctor
INSERT INTO doctors (name, specialization, qualification, experience_years, consultation_fee, available_days, available_hours, max_patients_per_day, status) VALUES
('Dr. John Smith', 'general', 'MBBS, MD', 10, 500, ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], '{"start": "09:00", "end": "17:00"}'::jsonb, 50, 'active')
ON CONFLICT DO NOTHING;