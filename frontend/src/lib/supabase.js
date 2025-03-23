// Supabase client configuration
import { createClient } from '@supabase/supabase-js';

// Supabase URL and anon key - these will be provided by Supabase when you create a project
// Support both VITE_ prefix (for local development) and unprefixed (for Netlify)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 
                    process.env.SUPABASE_URL || 
                    '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 
                        process.env.SUPABASE_ANON_KEY || 
                        '';

// Create a single supabase client for the entire app
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export default supabase; 