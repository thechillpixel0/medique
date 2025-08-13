/*
  # Create Sample Doctors for Testing

  1. Sample Doctors
    - Creates 6 sample doctors with different specializations
    - Each doctor has realistic profiles and schedules
    - All doctors are set to active status

  2. Security
    - Uses existing RLS policies
    - Safe to run multiple times (uses INSERT ... ON CONFLICT)
*/

-- Insert sample doctors for each department
INSERT INTO doctors (
  name,
  specialization,
  qualification,
  experience_years,
  consultation_fee,
  available_days,
  available_hours,
  max_patients_per_day,
  status
) VALUES 
  (
    'Dr. Sarah Johnson',
    'general',
    'MBBS, MD (General Medicine)',
    8,
    500,
    ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    '{"start": "09:00", "end": "17:00"}'::jsonb,
    40,
    'active'
  ),
  (
    'Dr. Michael Chen',
    'cardiology',
    'MBBS, MD (Cardiology), DM',
    12,
    800,
    ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    '{"start": "10:00", "end": "18:00"}'::jsonb,
    30,
    'active'
  ),
  (
    'Dr. Emily Rodriguez',
    'orthopedics',
    'MBBS, MS (Orthopedics)',
    10,
    700,
    ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    '{"start": "08:00", "end": "16:00"}'::jsonb,
    35,
    'active'
  ),
  (
    'Dr. David Kumar',
    'pediatrics',
    'MBBS, MD (Pediatrics)',
    6,
    600,
    ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    '{"start": "09:00", "end": "17:00"}'::jsonb,
    45,
    'active'
  ),
  (
    'Dr. Lisa Thompson',
    'dermatology',
    'MBBS, MD (Dermatology)',
    9,
    650,
    ARRAY['tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    '{"start": "10:00", "end": "18:00"}'::jsonb,
    25,
    'active'
  ),
  (
    'Dr. Robert Wilson',
    'neurology',
    'MBBS, MD (Neurology), DM',
    15,
    900,
    ARRAY['monday', 'wednesday', 'friday'],
    '{"start": "09:00", "end": "15:00"}'::jsonb,
    20,
    'active'
  )
ON CONFLICT (name) DO UPDATE SET
  specialization = EXCLUDED.specialization,
  qualification = EXCLUDED.qualification,
  experience_years = EXCLUDED.experience_years,
  consultation_fee = EXCLUDED.consultation_fee,
  available_days = EXCLUDED.available_days,
  available_hours = EXCLUDED.available_hours,
  max_patients_per_day = EXCLUDED.max_patients_per_day,
  status = EXCLUDED.status,
  updated_at = now();