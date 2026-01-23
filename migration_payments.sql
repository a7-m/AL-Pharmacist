-- Add payment columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS plan TEXT CHECK (plan IN ('basic', 'pro')),
ADD COLUMN IF NOT EXISTS paid_until DATE;

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT uuid_generate_v4 () PRIMARY KEY,
    user_id UUID REFERENCES auth.users (id) ON DELETE CASCADE,
    invoice_id TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    plan TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- RLS Policies for payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
CREATE POLICY "Users can view own payments" ON payments FOR
SELECT USING (auth.uid () = user_id);

-- Only service role can insert/update (handled by backend)
-- But if we want to allow insert from authenticated users (not recommended for status),
-- we usually stick to backend for creation to ensure consistency with MyFatoorah.
-- So no INSERT policy for public/authenticated role needed if standard flow is backend-only insert.