import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

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