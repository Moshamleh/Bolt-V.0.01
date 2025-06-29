-- Enhanced payment tracking tables for BOLT Auto
-- Security-focused design with proper RLS policies

-- Boost orders table for tracking listing boosts
CREATE TABLE IF NOT EXISTS boost_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL CHECK (amount > 0), -- Amount in cents
    duration_days INTEGER NOT NULL DEFAULT 7 CHECK (duration_days > 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'expired')),
    stripe_session_id TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service payments table for tracking mechanic service payments
CREATE TABLE IF NOT EXISTS service_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    video_call_id UUID REFERENCES video_calls(id) ON DELETE SET NULL,
    mechanic_id UUID NOT NULL REFERENCES mechanics(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL CHECK (amount > 0), -- Total amount in cents
    platform_fee INTEGER NOT NULL DEFAULT 0 CHECK (platform_fee >= 0), -- Platform fee in cents
    mechanic_payout INTEGER NOT NULL CHECK (mechanic_payout >= 0), -- Amount mechanic receives
    service_type TEXT NOT NULL,
    stripe_session_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payout_id UUID REFERENCES mechanic_payouts(id) ON DELETE SET NULL,
    paid_out_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mechanic payouts table for tracking withdrawals
CREATE TABLE IF NOT EXISTS mechanic_payouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mechanic_id UUID NOT NULL REFERENCES mechanics(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL CHECK (amount > 0), -- Amount in cents
    stripe_transfer_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
    invoice_ids UUID[] NOT NULL DEFAULT '{}', -- Array of service_payment IDs
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ
);

-- Payment audit log for security and compliance
CREATE TABLE IF NOT EXISTS payment_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    stripe_session_id TEXT,
    event_type TEXT NOT NULL,
    status TEXT NOT NULL,
    amount INTEGER CHECK (amount >= 0),
    currency TEXT DEFAULT 'usd',
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchases table for tracking part sales
CREATE TABLE IF NOT EXISTS purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL CHECK (amount > 0), -- Amount in cents
    stripe_session_id TEXT,
    stripe_payment_intent_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
    shipping_address JSONB,
    tracking_number TEXT,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to existing tables
DO $$ 
BEGIN 
    -- Add Stripe fields to mechanics table if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mechanics' AND column_name = 'stripe_account_id') THEN
        ALTER TABLE mechanics ADD COLUMN stripe_account_id TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mechanics' AND column_name = 'stripe_onboarding_complete') THEN
        ALTER TABLE mechanics ADD COLUMN stripe_onboarding_complete BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mechanics' AND column_name = 'stripe_account_created_at') THEN
        ALTER TABLE mechanics ADD COLUMN stripe_account_created_at TIMESTAMPTZ;
    END IF;
    
    -- Add payment fields to parts table if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parts' AND column_name = 'buyer_id') THEN
        ALTER TABLE parts ADD COLUMN buyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parts' AND column_name = 'sold_at') THEN
        ALTER TABLE parts ADD COLUMN sold_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parts' AND column_name = 'stripe_payment_intent_id') THEN
        ALTER TABLE parts ADD COLUMN stripe_payment_intent_id TEXT;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_boost_orders_part_id ON boost_orders(part_id);
CREATE INDEX IF NOT EXISTS idx_boost_orders_user_id ON boost_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_boost_orders_status ON boost_orders(status);
CREATE INDEX IF NOT EXISTS idx_boost_orders_expires_at ON boost_orders(expires_at);

CREATE INDEX IF NOT EXISTS idx_service_payments_mechanic_id ON service_payments(mechanic_id);
CREATE INDEX IF NOT EXISTS idx_service_payments_customer_id ON service_payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_payments_status ON service_payments(status);
CREATE INDEX IF NOT EXISTS idx_service_payments_payout_id ON service_payments(payout_id);

CREATE INDEX IF NOT EXISTS idx_mechanic_payouts_mechanic_id ON mechanic_payouts(mechanic_id);
CREATE INDEX IF NOT EXISTS idx_mechanic_payouts_status ON mechanic_payouts(status);

CREATE INDEX IF NOT EXISTS idx_payment_audit_log_user_id ON payment_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_audit_log_event_type ON payment_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_payment_audit_log_created_at ON payment_audit_log(created_at);

CREATE INDEX IF NOT EXISTS idx_purchases_buyer_id ON purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_purchases_seller_id ON purchases(seller_id);
CREATE INDEX IF NOT EXISTS idx_purchases_part_id ON purchases(part_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE boost_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mechanic_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Boost orders policies
CREATE POLICY "Users can view their own boost orders" ON boost_orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own boost orders" ON boost_orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own boost orders" ON boost_orders
    FOR UPDATE USING (auth.uid() = user_id);

-- Service payments policies
CREATE POLICY "Mechanics can view their service payments" ON service_payments
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM mechanics WHERE id = mechanic_id
        )
    );

CREATE POLICY "Customers can view their service payments" ON service_payments
    FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Service payments can be created by authenticated users" ON service_payments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Mechanics can update their service payments" ON service_payments
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT user_id FROM mechanics WHERE id = mechanic_id
        )
    );

-- Mechanic payouts policies
CREATE POLICY "Mechanics can view their own payouts" ON mechanic_payouts
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM mechanics WHERE id = mechanic_id
        )
    );

CREATE POLICY "Mechanics can create their own payout requests" ON mechanic_payouts
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM mechanics WHERE id = mechanic_id
        )
    );

-- Payment audit log policies (admin/service role only for security)
CREATE POLICY "Only service role can access audit logs" ON payment_audit_log
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Purchases policies
CREATE POLICY "Buyers can view their purchases" ON purchases
    FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Sellers can view their sales" ON purchases
    FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "Purchases can be created by authenticated users" ON purchases
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Buyers and sellers can update purchases" ON purchases
    FOR UPDATE USING (auth.uid() IN (buyer_id, seller_id));

-- Triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_boost_orders_updated_at BEFORE UPDATE ON boost_orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_payments_updated_at BEFORE UPDATE ON service_payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mechanic_payouts_updated_at BEFORE UPDATE ON mechanic_payouts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON purchases 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically expire boost orders
CREATE OR REPLACE FUNCTION expire_boost_orders()
RETURNS void AS $$
BEGIN
    -- Update expired boost orders
    UPDATE boost_orders 
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'paid' 
    AND expires_at < NOW();
    
    -- Update parts to remove boost status
    UPDATE parts 
    SET is_boosted = FALSE, boost_expires_at = NULL, updated_at = NOW()
    WHERE is_boosted = TRUE 
    AND boost_expires_at < NOW();
END;
$$ language 'plpgsql';

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON boost_orders TO authenticated;
GRANT SELECT, INSERT, UPDATE ON service_payments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON mechanic_payouts TO authenticated;
GRANT SELECT, INSERT ON payment_audit_log TO authenticated;
GRANT SELECT, INSERT, UPDATE ON purchases TO authenticated;

-- Comments for documentation
COMMENT ON TABLE boost_orders IS 'Tracks listing boost payments and durations';
COMMENT ON TABLE service_payments IS 'Tracks payments for mechanic services';
COMMENT ON TABLE mechanic_payouts IS 'Tracks payout requests and transfers to mechanics';
COMMENT ON TABLE payment_audit_log IS 'Security audit trail for all payment activities';
COMMENT ON TABLE purchases IS 'Tracks part purchases and sales';

COMMENT ON COLUMN service_payments.platform_fee IS 'Platform fee taken from total amount (typically 15%)';
COMMENT ON COLUMN service_payments.mechanic_payout IS 'Amount paid to mechanic after platform fee';
COMMENT ON COLUMN boost_orders.duration_days IS 'Number of days the listing will be boosted';
COMMENT ON COLUMN payment_audit_log.metadata IS 'Additional data for audit purposes (JSON)';