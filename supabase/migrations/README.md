# Supabase Migrations

This directory contains SQL migration files for setting up the complete database schema for the Clinic Token & Queue Management System.

## Migration Files

1. **001_initial_schema.sql** - Creates all required tables, indexes, RLS policies, and triggers
2. **002_default_data.sql** - Inserts default departments, clinic settings, and sample data

## How to Apply Migrations

### Option 1: Using Supabase CLI (Recommended)
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Apply migrations
supabase db push
```

### Option 2: Manual Application via Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of each migration file in order
4. Execute each migration file

### Option 3: Using psql (Advanced)
```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Apply migrations
\i supabase/migrations/001_initial_schema.sql
\i supabase/migrations/002_default_data.sql
```

## Tables Created

- **patients** - Patient information with permanent UIDs
- **visits** - Visit/booking records with token numbers (STN)
- **departments** - Medical departments configuration
- **doctors** - Doctor profiles and availability
- **clinic_settings** - System configuration settings
- **medical_history** - Patient medical records
- **payment_transactions** - Payment processing records
- **appointments** - Appointment scheduling
- **notifications** - System notifications
- **audit_logs** - Security audit trail
- **consultations** - Doctor consultation sessions
- **consultation_notes** - Notes from consultations
- **doctor_sessions** - Doctor session management
- **voice_transcriptions** - Voice note transcriptions

## Security

All tables have Row Level Security (RLS) enabled with appropriate policies for:
- Public access for booking and queue viewing
- Authenticated access for admin operations
- Proper data isolation and security

## Default Data

The migrations include default data for:
- 4 medical departments (General, Cardiology, Orthopedics, Pediatrics)
- Basic clinic settings and configuration
- Sample doctor profile for testing

After applying these migrations, your application should work without the table not found errors.