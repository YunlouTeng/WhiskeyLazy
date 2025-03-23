// Supabase client configuration
import { createClient } from '@supabase/supabase-js';

// Debug environment variables in the console
console.log('Environment mode:', process.env.NODE_ENV);
console.log('Vite env vars available:', 
  Object.keys(import.meta.env)
    .filter(key => key.startsWith('VITE_'))
    .map(key => `${key} is ${typeof import.meta.env[key] === 'string' ? 'set' : 'undefined'}`)
);

// Supabase URL and anon key - these will be provided by Supabase when you create a project
// Support both VITE_ prefix (for local development) and unprefixed (for Netlify)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 
                   '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 
                       '';

console.log('Supabase URL:', supabaseUrl ? 'Set (starts with ' + supabaseUrl.substring(0, 8) + '...)' : 'NOT SET');
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Set (length: ' + supabaseAnonKey.length + ')' : 'NOT SET');

// Create a single supabase client for the entire app
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    // Skip email verification to allow immediate login after signup
    shouldCreateUser: true,
    emailRedirectTo: window.location.origin + '/dashboard'
  }
});

export default supabase; 