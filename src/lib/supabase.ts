import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not found. Using fallback configuration for development.');
}

// Use fallback values for development if env vars are missing
const finalSupabaseUrl = supabaseUrl || 'https://your-project.supabase.co';
const finalSupabaseAnonKey = supabaseAnonKey || 'your-anon-key';

export const supabase = createClient(finalSupabaseUrl, finalSupabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Test connection function
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('departments').select('count').limit(1);
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    console.log('Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Supabase connection error:', error);
    return false;
  }
};

// Database types for better TypeScript support
export interface Database {
  public: {
    Tables: {
      patients: {
        Row: {
          id: string;
          uid: string;
          name: string;
          age: number;
          phone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          uid: string;
          name: string;
          age: number;
          phone: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          uid?: string;
          name?: string;
          age?: number;
          phone?: string;
          updated_at?: string;
        };
      };
      visits: {
        Row: {
          id: string;
          patient_id: string;
          clinic_id: string;
          stn: number;
          department: string;
          visit_date: string;
          status: string;
          payment_status: string;
          payment_provider: string | null;
          payment_ref: string | null;
          qr_payload: string;
          estimated_time: string | null;
          created_at: string;
          updated_at: string;
          checked_in_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          patient_id: string;
          clinic_id?: string;
          stn: number;
          department: string;
          visit_date: string;
          status?: string;
          payment_status?: string;
          payment_provider?: string | null;
          payment_ref?: string | null;
          qr_payload: string;
          estimated_time?: string | null;
          created_at?: string;
          updated_at?: string;
          checked_in_at?: string | null;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          patient_id?: string;
          clinic_id?: string;
          stn?: number;
          department?: string;
          visit_date?: string;
          status?: string;
          payment_status?: string;
          payment_provider?: string | null;
          payment_ref?: string | null;
          qr_payload?: string;
          estimated_time?: string | null;
          updated_at?: string;
          checked_in_at?: string | null;
          completed_at?: string | null;
        };
      };
    };
  };
}