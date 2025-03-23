// Supabase client for serverless API functions
const { createClient } = require('@supabase/supabase-js');

// Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Get user by ID from Supabase
 * @param {string} userId - The user ID to look up
 * @returns {Promise<object>} User data or null
 */
const getUserById = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (err) {
    console.error('Error getting user by ID:', err);
    return null;
  }
};

/**
 * Store a Plaid token in the database
 * @param {string} userId - The user ID
 * @param {string} accessToken - Plaid access token
 * @param {string} itemId - Plaid item ID
 * @param {string} institutionName - Financial institution name
 * @returns {Promise<object>} Result of the operation
 */
const storePlaidToken = async (userId, accessToken, itemId, institutionName) => {
  try {
    const { data, error } = await supabase
      .from('plaid_tokens')
      .insert([
        {
          user_id: userId,
          access_token: accessToken,
          item_id: itemId,
          institution_name: institutionName
        }
      ])
      .select();
    
    if (error) {
      throw error;
    }
    
    return { success: true, tokenId: data[0].id };
  } catch (err) {
    console.error('Error storing Plaid token:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Get Plaid token by item ID
 * @param {string} userId - The user ID
 * @param {string} itemId - Plaid item ID
 * @returns {Promise<object>} Plaid token data
 */
const getPlaidTokenByItemId = async (userId, itemId) => {
  try {
    const { data, error } = await supabase
      .from('plaid_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .single();
    
    if (error) {
      throw error;
    }
    
    return { success: true, token: data };
  } catch (err) {
    console.error('Error getting Plaid token:', err);
    return { success: false, error: err.message };
  }
};

module.exports = {
  supabase,
  getUserById,
  storePlaidToken,
  getPlaidTokenByItemId
}; 