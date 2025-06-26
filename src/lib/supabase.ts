import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not configured. Some features may not work properly.');
  console.warn('Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set correctly.');
}

// Create a fallback client even if env vars are missing to prevent app crashes
const fallbackUrl = 'https://placeholder.supabase.co';
const fallbackKey = 'placeholder-key';

export const supabase = createClient(
  supabaseUrl || fallbackUrl, 
  supabaseAnonKey || fallbackKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: {
        'X-Client-Info': 'haaman-network-web'
      }
    }
  }
);

// Export a function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== fallbackUrl);
};