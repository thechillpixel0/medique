import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are properly set
const hasValidConfig = supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== 'your-supabase-project-url' && 
  supabaseAnonKey !== 'your-supabase-anon-key' &&
  supabaseUrl.includes('supabase.co');

if (!hasValidConfig) {
  console.error('❌ Supabase configuration error:');
  console.error('Please check your .env file and ensure you have valid Supabase credentials.');
  console.error('1. Copy .env.example to .env');
  console.error('2. Replace placeholder values with your actual Supabase credentials');
  console.error('3. Restart the development server');
}

// Use environment variables or throw error if invalid
const finalSupabaseUrl = hasValidConfig ? supabaseUrl : 'https://demo.supabase.co';
const finalSupabaseAnonKey = hasValidConfig ? supabaseAnonKey : 'demo-key';

export const supabase = hasValidConfig ? createClient(finalSupabaseUrl, finalSupabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
}) : {
  // Mock client for invalid configuration
  from: () => ({
    select: () => ({ data: null, error: { message: 'Supabase not configured' } }),
    insert: () => ({ data: null, error: { message: 'Supabase not configured' } }),
    update: () => ({ data: null, error: { message: 'Supabase not configured' } }),
    delete: () => ({ data: null, error: { message: 'Supabase not configured' } }),
  }),
  auth: { getSession: () => Promise.resolve({ data: { session: null }, error: null }) },
  channel: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
} as any;

export const isSupabaseConfigured = hasValidConfig;

// Test connection function
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('departments').select('count').limit(1);
    if (error) {
      console.error('Supabase connection test failed:', error);
      if (error.message.includes('Supabase not configured')) {
        console.error('Please configure your Supabase credentials in the .env file');
      }
      return false;
    }
    console.log('Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Supabase connection error:', error);
    console.error('Make sure your .env file contains valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
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