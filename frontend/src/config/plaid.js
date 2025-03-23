/**
 * Plaid API Configuration
 * This file contains configuration settings for Plaid API integration
 */

// Plaid environments
export const PLAID_ENV = {
  SANDBOX: 'sandbox',
  DEVELOPMENT: 'development',
  PRODUCTION: 'production'
};

// Current Plaid environment - change to PRODUCTION when ready
export const CURRENT_PLAID_ENV = process.env.NODE_ENV === 'production' 
  ? PLAID_ENV.PRODUCTION 
  : PLAID_ENV.SANDBOX;

// Plaid product types needed for your application
export const PLAID_PRODUCTS = [
  'transactions',
  'auth',
  'identity',
  'assets',
  'investments'
];

// Countries supported
export const PLAID_COUNTRY_CODES = ['US'];

// Plaid language preference
export const PLAID_LANGUAGE = 'en';

// Webhook for handling Plaid events (use your actual backend URL)
export const PLAID_WEBHOOK = process.env.NODE_ENV === 'production'
  ? 'https://api.personalfinance.yourdomain.com/api/plaid/webhook'
  : 'http://localhost:8000/api/plaid/webhook';

/**
 * Plaid Link token request configuration
 * @param {string} userId - The user's ID for associating linked accounts
 * @returns {object} Plaid Link configuration object
 */
export const getLinkTokenConfig = (userId) => ({
  user: {
    client_user_id: userId.toString()
  },
  client_name: 'Personal Finance Tracker',
  products: PLAID_PRODUCTS,
  country_codes: PLAID_COUNTRY_CODES,
  language: PLAID_LANGUAGE,
  webhook: PLAID_WEBHOOK
}); 