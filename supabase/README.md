# WhiskeyLazy Finance - Supabase Setup Guide

This directory contains the database schema and migration files for the WhiskeyLazy Finance application using Supabase.

## Setting Up Supabase

1. Create a Supabase account and project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from the API settings page

### Environment Configuration

Add the following environment variables to your Netlify/Vercel deployment:

```
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

For local development, add these to a `.env` file in the frontend directory.

## Database Setup

You have two options for setting up the database:

### Option 1: Using the Supabase Web UI

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the `schema.sql` script to create the base tables
4. Run the migration scripts in the `migrations` directory in numerical order

### Option 2: Using the Supabase CLI

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Link to your remote project:
   ```bash
   supabase login
   supabase link --project-ref your-project-ref
   ```

3. Run migrations:
   ```bash
   supabase db push
   ```

## Schema Structure

The database includes the following key tables:

- `user_profiles`: Extended user information
- `accounts`: Bank accounts connected via Plaid
- `transactions`: Financial transactions from connected accounts
- `budget_categories`: Custom budget categories
- `budgets`: Monthly budget targets
- `plaid_tokens`: Secure storage for Plaid access tokens

## Migrations

- `01_add_plaid_token_columns.sql`: Creates the plaid_tokens table and adds related columns to the accounts table

## Security

All tables have Row Level Security (RLS) policies that ensure users can only access their own data. These policies are automatically applied by Supabase.

## Next Steps

After setting up Supabase:

1. Update your frontend code to use the Supabase client for authentication
2. Replace API calls with Supabase queries
3. Use Supabase auth UI components for login/registration

For Plaid integration, update your application to store Plaid tokens in the `plaid_tokens` table with proper encryption. 