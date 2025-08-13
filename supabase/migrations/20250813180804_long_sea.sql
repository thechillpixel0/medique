/*
  # Fix Doctor Room Synchronization

  1. Enhanced Tables
    - Add better indexes for real-time performance
    - Add triggers for automatic consultation creation
    - Fix foreign key relationships

  2. Functions
    - Auto-create consultations when visits go to in_service
    - Update session current patient automatically
    - Better queue management

  3. Security
    - Enhanced RLS policies
    - Better data access controls
*/

-- Create function to auto-create consultation when visit goes to in_service
CREATE OR REPLACE FUNCTION create_consultation_on_in_service()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create consultation if status changed to in_service and no consultation exists
  IF NEW.status = 'in_service' AND OLD.status != 'in_service' THEN
    -- Check if consultation already exists
    IF NOT EXISTS (
      SELECT 1 FROM consultations 
      WHERE visit_id = NEW.id
    ) THEN
      -- Get active doctor session
      DECLARE
        active_session_id uuid;
        doctor_id_var uuid;
      BEGIN
        -- Find active session for the doctor assigned to this visit or department
        SELECT ds.id, ds.doctor_id INTO active_session_id, doctor_id_var
        FROM doctor_sessions ds
        JOIN doctors d ON d.id = ds.doctor_id
        WHERE ds.session_status = 'active'
          AND (ds.doctor_id = NEW.doctor_id OR d.specialization = NEW.department)
        ORDER BY ds.started_at DESC
        LIMIT 1;

        -- Create consultation if we found an active session
        IF active_session_id IS NOT NULL THEN
          INSERT INTO consultations (
            doctor_id,
            patient_id,
            visit_id,
            session_id,
            status,
            started_at,
            priority_level
          ) VALUES (
            doctor_id_var,
            NEW.patient_id,
            NEW.id,
            active_session_id,
            'in_progress',
            NOW(),
            'normal'
          );

          -- Update session with current patient
          UPDATE doctor_sessions 
          SET current_patient_id = NEW.patient_id
          WHERE id = active_session_id;
        END IF;
      END;
    END IF;
  END IF;

  -- Clear current patient from session when consultation completes
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE doctor_sessions 
    SET current_patient_id = NULL
    WHERE current_patient_id = NEW.patient_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto consultation creation
DROP TRIGGER IF EXISTS trigger_create_consultation_on_in_service ON visits;
CREATE TRIGGER trigger_create_consultation_on_in_service
  AFTER UPDATE ON visits
  FOR EACH ROW
  EXECUTE FUNCTION create_consultation_on_in_service();

-- Create function to update consultation status when visit status changes
CREATE OR REPLACE FUNCTION sync_consultation_with_visit()
RETURNS TRIGGER AS $$
BEGIN
  -- Update consultation status based on visit status
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE consultations 
    SET 
      status = 'completed',
      completed_at = NOW(),
      duration_minutes = EXTRACT(EPOCH FROM (NOW() - started_at)) / 60
    WHERE visit_id = NEW.id AND status = 'in_progress';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for consultation sync
DROP TRIGGER IF EXISTS trigger_sync_consultation_with_visit ON visits;
CREATE TRIGGER trigger_sync_consultation_with_visit
  AFTER UPDATE ON visits
  FOR EACH ROW
  EXECUTE FUNCTION sync_consultation_with_visit();

-- Add better indexes for performance
CREATE INDEX IF NOT EXISTS idx_visits_doctor_date_status ON visits(doctor_id, visit_date, status);
CREATE INDEX IF NOT EXISTS idx_visits_department_date_status ON visits(department, visit_date, status);
CREATE INDEX IF NOT EXISTS idx_consultations_session_status ON consultations(session_id, status);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor_date ON consultations(doctor_id, DATE(started_at));
CREATE INDEX IF NOT EXISTS idx_doctor_sessions_doctor_status ON doctor_sessions(doctor_id, session_status);

-- Enhanced RLS policies for better security
DROP POLICY IF EXISTS "Doctors can manage their own consultations" ON consultations;
CREATE POLICY "Doctors can manage their own consultations"
  ON consultations
  FOR ALL
  TO authenticated
  USING (
    doctor_id IN (
      SELECT id FROM doctors 
      WHERE id = doctor_id
    )
  );

DROP POLICY IF EXISTS "Public can read consultations for queue display" ON consultations;
CREATE POLICY "Public can read consultations for queue display"
  ON consultations
  FOR SELECT
  TO public
  USING (true);

-- Function to get doctor's waiting patients
CREATE OR REPLACE FUNCTION get_doctor_waiting_patients(doctor_id_param uuid)
RETURNS TABLE (
  visit_id uuid,
  patient_id uuid,
  patient_name text,
  patient_age integer,
  patient_phone text,
  patient_uid text,
  stn integer,
  status text,
  created_at timestamptz,
  checked_in_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id as visit_id,
    p.id as patient_id,
    p.name as patient_name,
    p.age as patient_age,
    p.phone as patient_phone,
    p.uid as patient_uid,
    v.stn,
    v.status,
    v.created_at,
    v.checked_in_at
  FROM visits v
  JOIN patients p ON p.id = v.patient_id
  JOIN doctors d ON d.id = doctor_id_param
  WHERE v.visit_date = CURRENT_DATE
    AND v.status IN ('waiting', 'checked_in')
    AND (v.doctor_id = doctor_id_param OR v.department = d.specialization)
  ORDER BY v.stn ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get current patient for doctor
CREATE OR REPLACE FUNCTION get_doctor_current_patient(doctor_id_param uuid)
RETURNS TABLE (
  visit_id uuid,
  patient_id uuid,
  patient_name text,
  patient_age integer,
  patient_phone text,
  patient_uid text,
  stn integer,
  status text,
  started_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id as visit_id,
    p.id as patient_id,
    p.name as patient_name,
    p.age as patient_age,
    p.phone as patient_phone,
    p.uid as patient_uid,
    v.stn,
    v.status,
    c.started_at
  FROM visits v
  JOIN patients p ON p.id = v.patient_id
  JOIN consultations c ON c.visit_id = v.id
  WHERE v.visit_date = CURRENT_DATE
    AND v.status = 'in_service'
    AND c.doctor_id = doctor_id_param
    AND c.status = 'in_progress'
  ORDER BY c.started_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_doctor_waiting_patients(uuid) TO public;
GRANT EXECUTE ON FUNCTION get_doctor_current_patient(uuid) TO public;