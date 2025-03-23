-- Create a dedicated table for storing Plaid tokens
CREATE TABLE IF NOT EXISTS plaid_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    institution_name TEXT NOT NULL,
    access_token TEXT NOT NULL,
    item_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, item_id)
);

-- Add row-level security to plaid_tokens
ALTER TABLE plaid_tokens ENABLE ROW LEVEL SECURITY;

-- Security policies for plaid_tokens
CREATE POLICY "Users can view their own tokens" 
    ON plaid_tokens FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tokens" 
    ON plaid_tokens FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens" 
    ON plaid_tokens FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tokens" 
    ON plaid_tokens FOR DELETE 
    USING (auth.uid() = user_id);

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_plaid_tokens_timestamp BEFORE UPDATE
ON plaid_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add missing columns to accounts table
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS plaid_access_token_id UUID REFERENCES plaid_tokens(id),
ADD COLUMN IF NOT EXISTS plaid_account_id TEXT; 