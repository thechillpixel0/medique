/*
  # Doctor Room System Database Schema

  1. New Tables
    - `doctor_sessions` - Track active doctor sessions/rooms
    - `consultations` - Track ongoing consultations between doctors and patients
    - `consultation_notes` - Store doctor's notes and observations
    - `voice_transcriptions` - Store voice-to-text transcriptions

  2. Enhanced Tables
    - Update `medical_history` with consultation references
    - Add indexes for better performance

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for doctors and admins
*/

-- Create doctor_sessions table
CREATE TABLE IF NOT EXISTS doctor_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  session_status text NOT NULL DEFAULT 'active' CHECK (session_status IN ('active', 'inactive', 'break')),
  room_name text NOT NULL,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  current_patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create consultations table
CREATE TABLE IF NOT EXISTS consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  visit_id uuid NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES doctor_sessions(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('waiting', 'in_progress', 'completed', 'cancelled')),
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  duration_minutes integer,
  priority_level text DEFAULT 'normal' CHECK (priority_level IN ('low', 'normal', 'high', 'urgent')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create consultation_notes table
CREATE TABLE IF NOT EXISTS consultation_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  note_type text NOT NULL DEFAULT 'general' CHECK (note_type IN ('general', 'symptoms', 'diagnosis', 'prescription', 'follow_up', 'voice_note')),
  content text NOT NULL,
  is_voice_generated boolean DEFAULT false,
  voice_confidence_score decimal(3,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create voice_transcriptions table
CREATE TABLE IF NOT EXISTS voice_transcriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  original_audio_url text,
  transcribed_text text NOT NULL,
  confidence_score decimal(3,2),
  language_code text DEFAULT 'en-US',
  processing_status text DEFAULT 'completed' CHECK (processing_status IN ('processing', 'completed', 'failed')),
  created_at timestamptz DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_doctor_sessions_doctor_id ON doctor_sessions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_sessions_status ON doctor_sessions(session_status);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor_id ON consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultations_patient_id ON consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_visit_id ON consultations(visit_id);
CREATE INDEX IF NOT EXISTS idx_consultations_session_id ON consultations(session_id);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);
CREATE INDEX IF NOT EXISTS idx_consultation_notes_consultation_id ON consultation_notes(consultation_id);
CREATE INDEX IF NOT EXISTS idx_consultation_notes_type ON consultation_notes(note_type);
CREATE INDEX IF NOT EXISTS idx_voice_transcriptions_consultation_id ON voice_transcriptions(consultation_id);

-- Enable RLS
ALTER TABLE doctor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_transcriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for doctor_sessions
CREATE POLICY "Doctors can manage their own sessions"
  ON doctor_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid()::text IN (SELECT id::text FROM doctors WHERE id = doctor_id))
  WITH CHECK (auth.uid()::text IN (SELECT id::text FROM doctors WHERE id = doctor_id));

CREATE POLICY "Admins can view all doctor sessions"
  ON doctor_sessions
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for consultations
CREATE POLICY "Doctors can manage their consultations"
  ON consultations
  FOR ALL
  TO authenticated
  USING (auth.uid()::text IN (SELECT id::text FROM doctors WHERE id = doctor_id))
  WITH CHECK (auth.uid()::text IN (SELECT id::text FROM doctors WHERE id = doctor_id));

CREATE POLICY "Admins can view all consultations"
  ON consultations
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for consultation_notes
CREATE POLICY "Doctors can manage their consultation notes"
  ON consultation_notes
  FOR ALL
  TO authenticated
  USING (auth.uid()::text IN (SELECT id::text FROM doctors WHERE id = doctor_id))
  WITH CHECK (auth.uid()::text IN (SELECT id::text FROM doctors WHERE id = doctor_id));

CREATE POLICY "Admins can view all consultation notes"
  ON consultation_notes
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for voice_transcriptions
CREATE POLICY "Doctors can manage their voice transcriptions"
  ON voice_transcriptions
  FOR ALL
  TO authenticated
  USING (auth.uid()::text IN (SELECT id::text FROM doctors WHERE id = doctor_id))
  WITH CHECK (auth.uid()::text IN (SELECT id::text FROM doctors WHERE id = doctor_id));

CREATE POLICY "Admins can view all voice transcriptions"
  ON voice_transcriptions
  FOR SELECT
  TO authenticated
  USING (true);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_doctor_sessions_updated_at
  BEFORE UPDATE ON doctor_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultations_updated_at
  BEFORE UPDATE ON consultations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultation_notes_updated_at
  BEFORE UPDATE ON consultation_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically start consultation when patient is checked in
CREATE OR REPLACE FUNCTION auto_start_consultation()
RETURNS TRIGGER AS $$
DECLARE
  active_session_id uuid;
  doctor_id_var uuid;
BEGIN
  -- Only proceed if status changed to 'in_service' and doctor_id is set
  IF NEW.status = 'in_service' AND NEW.doctor_id IS NOT NULL AND 
     (OLD.status IS NULL OR OLD.status != 'in_service') THEN
    
    -- Get active session for the doctor
    SELECT id INTO active_session_id
    FROM doctor_sessions
    WHERE doctor_id = NEW.doctor_id 
      AND session_status = 'active'
    ORDER BY started_at DESC
    LIMIT 1;
    
    -- If doctor has active session, create consultation
    IF active_session_id IS NOT NULL THEN
      INSERT INTO consultations (
        doctor_id,
        patient_id,
        visit_id,
        session_id,
        status,
        started_at
      ) VALUES (
        NEW.doctor_id,
        NEW.patient_id,
        NEW.id,
        active_session_id,
        'in_progress',
        now()
      );
      
      -- Update doctor session with current patient
      UPDATE doctor_sessions
      SET current_patient_id = NEW.patient_id,
          updated_at = now()
      WHERE id = active_session_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto consultation start
CREATE TRIGGER trigger_auto_start_consultation
  AFTER UPDATE ON visits
  FOR EACH ROW
  EXECUTE FUNCTION auto_start_consultation();

-- Function to complete consultation when visit is completed
CREATE OR REPLACE FUNCTION auto_complete_consultation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status changed to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Complete any active consultations for this visit
    UPDATE consultations
    SET status = 'completed',
        completed_at = now(),
        duration_minutes = EXTRACT(EPOCH FROM (now() - started_at))/60,
        updated_at = now()
    WHERE visit_id = NEW.id 
      AND status = 'in_progress';
    
    -- Clear current patient from doctor session
    UPDATE doctor_sessions
    SET current_patient_id = NULL,
        updated_at = now()
    WHERE current_patient_id = NEW.patient_id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto consultation completion
CREATE TRIGGER trigger_auto_complete_consultation
  AFTER UPDATE ON visits
  FOR EACH ROW
  EXECUTE FUNCTION auto_complete_consultation();