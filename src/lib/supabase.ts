import { createClient } from '@supabase/supabase-js';

export const hasSupabaseConfig = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-anon-key';
export const isPhoneOtpEnabled = import.meta.env.VITE_ENABLE_PHONE_OTP === 'true';
export const isMockPhoneOtpEnabled = import.meta.env.VITE_ENABLE_MOCK_PHONE_OTP === 'true';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});
