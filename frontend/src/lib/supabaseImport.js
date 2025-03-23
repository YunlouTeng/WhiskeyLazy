// Wrapper for Supabase import with error handling

// Define a placeholder client implementation
const createPlaceholderClient = (...args) => {
  console.warn('Using placeholder Supabase client');
  // Return a placeholder client
  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Supabase not loaded yet') }),
      signUp: () => Promise.resolve({ data: null, error: new Error('Supabase not loaded yet') }),
      signOut: () => Promise.resolve({ error: null })
    },
    from: () => ({
      select: () => ({
        order: () => ({
          eq: () => ({
            gte: () => ({
              lte: () => ({
                limit: () => Promise.resolve({ data: [], error: null })
              })
            })
          })
        })
      }),
      insert: () => Promise.resolve({ data: null, error: null })
    })
  };
};

// Initially use the placeholder
let createClient = createPlaceholderClient;

// Try to import Supabase with error logging
try {
  // Import directly for bundled builds
  import('@supabase/supabase-js')
    .then(module => {
      console.log('Supabase imported successfully');
      // Update the createClient function to use the real one
      createClient = module.createClient;
    })
    .catch(error => {
      console.error('Failed to import Supabase:', error);
    });
} catch (error) {
  console.error('Error setting up Supabase import:', error);
}

export { createClient }; 