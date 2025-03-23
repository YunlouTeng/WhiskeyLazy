// Supabase client configuration
import { createClient } from '@supabase/supabase-js';

// Debug environment variables in the console
console.log('Environment mode:', import.meta.env.MODE);
console.log('Vite env vars available:', 
  Object.keys(import.meta.env)
);

// Supabase URL and anon key - these will be provided by Supabase when you create a project
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// More verbose logging for debugging
console.log('Supabase URL:', supabaseUrl || 'NOT SET');
console.log('Supabase Anon Key:', supabaseAnonKey ? `SET (length: ${supabaseAnonKey.length})` : 'NOT SET');

// Add fallback values for development purposes only
const finalSupabaseUrl = supabaseUrl || 'https://rgquwntogfybmptllbxt.supabase.co';
const finalSupabaseAnonKey = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJncXV3bnRvZ2Z5Ym1wdGxsYnh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDgwMDcxMDYsImV4cCI6MjAyMzU4MzEwNn0.pI0IqPsZnmYa3zz0F9fD-RUjgEPHW8HZIXnJzpjrEII';

// Validate URL to avoid client-side errors
if (!finalSupabaseUrl) {
  console.error('ERROR: Supabase URL is missing. Check your environment variables.');
}

if (!finalSupabaseAnonKey) {
  console.error('ERROR: Supabase Anon Key is missing. Check your environment variables.');
}

// Create a single supabase client for the entire app
const supabase = createClient(finalSupabaseUrl, finalSupabaseAnonKey, {
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