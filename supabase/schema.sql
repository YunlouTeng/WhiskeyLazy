-- WhiskeyLazy Supabase Schema
-- This schema creates the necessary tables for the WhiskeyLazy Finance Tracker

-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'y6xo5KXYx3IRgC7/FcbS/NeK1sR590/Mxljx+aQpwQPj2gHtgGaeFX1RMZ81YL5BZtIa8cJkFIsaeWx2pIVGEw==';

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Set up RLS policies for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" 
    ON user_profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
    ON user_profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Financial Accounts Table
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users NOT NULL,
    account_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    mask VARCHAR(50),
    type VARCHAR(100) NOT NULL,
    subtype VARCHAR(100),
    institution_name VARCHAR(255),
    current_balance DECIMAL(19,2) DEFAULT 0,
    available_balance DECIMAL(19,2) DEFAULT 0,
    limit_amount DECIMAL(19,2),
    currency_code VARCHAR(3) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, account_id)
);

-- Set up RLS policies for accounts
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own accounts" 
    ON accounts FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own accounts" 
    ON accounts FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts" 
    ON accounts FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts" 
    ON accounts FOR DELETE 
    USING (auth.uid() = user_id);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users NOT NULL,
    account_id VARCHAR(255) NOT NULL,
    transaction_id VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    description VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    amount DECIMAL(19,2) NOT NULL,
    is_pending BOOLEAN DEFAULT FALSE,
    currency_code VARCHAR(3) DEFAULT 'USD',
    merchant_name VARCHAR(255),
    payment_channel VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, transaction_id)
);

-- Set up RLS policies for transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions" 
    ON transactions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" 
    ON transactions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" 
    ON transactions FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions" 
    ON transactions FOR DELETE 
    USING (auth.uid() = user_id);

-- Budget Categories Table
CREATE TABLE IF NOT EXISTS budget_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users NOT NULL,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(7) DEFAULT '#8a4bff',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name)
);

-- Set up RLS policies for budget_categories
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own budget categories" 
    ON budget_categories FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budget categories" 
    ON budget_categories FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budget categories" 
    ON budget_categories FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budget categories" 
    ON budget_categories FOR DELETE 
    USING (auth.uid() = user_id);

-- Monthly Budgets Table
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users NOT NULL,
    category_id UUID REFERENCES budget_categories(id),
    month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    amount DECIMAL(19,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, category_id, month)
);

-- Set up RLS policies for budgets
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own budgets" 
    ON budgets FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budgets" 
    ON budgets FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets" 
    ON budgets FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets" 
    ON budgets FOR DELETE 
    USING (auth.uid() = user_id);

-- Triggers to update 'updated_at' timestamps
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_timestamp BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_accounts_timestamp BEFORE UPDATE ON accounts
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_budgets_timestamp BEFORE UPDATE ON budgets
FOR EACH ROW EXECUTE FUNCTION update_modified_column(); 