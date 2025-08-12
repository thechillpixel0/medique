/*
  # Add foreign key relationship between medical_history and doctors

  1. Changes
    - Add foreign key constraint linking medical_history.doctor_id to doctors.id
    - This enables Supabase to perform joins between medical_history and doctors tables

  2. Security
    - No RLS changes needed as existing policies remain in effect
*/

-- Add foreign key constraint between medical_history and doctors
ALTER TABLE medical_history 
ADD CONSTRAINT medical_history_doctor_id_fkey 
FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL;