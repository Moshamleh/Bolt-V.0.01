-- Stripe Webhook Enhancement Migration
-- Created: 2025-06-21
-- Adds enhanced payment processing tables and security features

-- =====================================================
-- PAYMENT AUDIT & PROCESSING TABLES
-- =====================================================

-- Payment audit log for security and compliance
CREATE TABLE IF NOT EXISTS payment_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_session_id TEXT,
    stripe_payment_intent_id TEXT,
    user_id UUID REFERENCES profiles(id),
    amount INTEGER, -- Amount in cents
    currency TEXT NOT NULL DEFAULT 'usd',
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'expired', 'cancelled')),
    event_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes for fast lookups
    UNIQUE(stripe_session_id),
    INDEX idx_payment_audit_user (user_id, created_at DESC),
    INDEX idx_payment_audit_status (status, created_at DESC),
    INDEX idx_payment_audit_stripe_session (stripe_session_id),
    INDEX idx_payment_audit_event_type (event_type, created_at DESC)
);

-- Enhanced purchases table for marketplace transactions
CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    part_id UUID NOT NULL REFERENCES parts(id),
    buyer_id UUID NOT NULL REFERENCES profiles(id),
    seller_id UUID NOT NULL REFERENCES profiles(id),
    amount INTEGER NOT NULL, -- Amount in cents
    currency TEXT NOT NULL DEFAULT 'usd',
    stripe_session_id TEXT,
    stripe_payment_intent_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'shipped', 'delivered', 'cancelled', 'refunded')),
    shipping_address JSONB,
    tracking_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_purchases_buyer (buyer_id, created_at DESC),
    INDEX idx_purchases_seller (seller_id, created_at DESC),
    INDEX idx_purchases_part (part_id),
    INDEX idx_purchases_status (status, created_at DESC),
    INDEX idx_purchases_stripe_session (stripe_session_id)
);

-- Service payments table for mechanic services
CREATE TABLE IF NOT EXISTS service_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES services(id),
    appointment_id UUID REFERENCES appointments(id),
    video_call_id UUID REFERENCES video_calls(id),
    mechanic_id UUID NOT NULL REFERENCES mechanics(id),
    customer_id UUID NOT NULL REFERENCES profiles(id),
    amount INTEGER NOT NULL, -- Amount in cents
    currency TEXT NOT NULL DEFAULT 'usd',
    stripe_session_id TEXT,
    stripe_payment_intent_id TEXT,
    service_type TEXT NOT NULL CHECK (service_type IN ('diagnostic', 'repair', 'consultation', 'video_call', 'remote_support')),
    duration_minutes INTEGER,
    hourly_rate DECIMAL(10,2),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    platform_fee INTEGER NOT NULL DEFAULT 0,
    mechanic_payout INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_service_payments_mechanic (mechanic_id, created_at DESC),
    INDEX idx_service_payments_customer (customer_id, created_at DESC),
    INDEX idx_service_payments_status (status, created_at DESC),
    INDEX idx_service_payments_stripe_session (stripe_session_id)
);

-- Enhanced payment intents tracking
CREATE TABLE IF NOT EXISTS payment_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_payment_intent_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES profiles(id),
    amount INTEGER NOT NULL, -- Amount in cents
    currency TEXT NOT NULL DEFAULT 'usd',
    status TEXT NOT NULL CHECK (status IN ('requires_payment_method', 'requires_confirmation', 'requires_action', 'processing', 'requires_capture', 'cancelled', 'succeeded')),
    failure_reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_payment_intents_user (user_id, created_at DESC),
    INDEX idx_payment_intents_status (status, created_at DESC),
    INDEX idx_payment_intents_stripe_id (stripe_payment_intent_id)
);

-- Payouts tracking for mechanics
CREATE TABLE IF NOT EXISTS payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mechanic_id UUID NOT NULL REFERENCES mechanics(id),
    stripe_payout_id TEXT UNIQUE NOT NULL,
    stripe_account_id TEXT NOT NULL,
    amount INTEGER NOT NULL, -- Amount in cents
    currency TEXT NOT NULL DEFAULT 'usd',
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_transit', 'paid', 'failed', 'cancelled')),
    arrival_date DATE,
    failure_reason TEXT,
    service_payment_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_payouts_mechanic (mechanic_id, created_at DESC),
    INDEX idx_payouts_status (status, created_at DESC),
    INDEX idx_payouts_stripe_id (stripe_payout_id)
);

-- Services table if it doesn't exist (for service payments)
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mechanic_id UUID NOT NULL REFERENCES mechanics(id),
    customer_id UUID NOT NULL REFERENCES profiles(id),
    title TEXT NOT NULL,
    description TEXT,
    service_type TEXT NOT NULL CHECK (service_type IN ('diagnostic', 'repair', 'consultation', 'inspection', 'maintenance')),
    status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'accepted', 'in_progress', 'completed', 'cancelled')),
    estimated_duration INTEGER, -- in minutes
    actual_duration INTEGER, -- in minutes
    hourly_rate DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    location_type TEXT CHECK (location_type IN ('mobile', 'shop', 'remote')),
    service_address TEXT,
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_services_mechanic (mechanic_id, created_at DESC),
    INDEX idx_services_customer (customer_id, created_at DESC),
    INDEX idx_services_status (status, created_at DESC),
    INDEX idx_services_scheduled (scheduled_at)
);

-- =====================================================
-- SECURITY & MONITORING TABLES
-- =====================================================

-- Webhook security log for monitoring suspicious activity
CREATE TABLE IF NOT EXISTS webhook_security_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address TEXT NOT NULL,
    user_agent TEXT,
    request_method TEXT NOT NULL,
    request_path TEXT NOT NULL,
    request_headers JSONB,
    response_status INTEGER NOT NULL,
    signature_valid BOOLEAN NOT NULL,
    rate_limited BOOLEAN NOT NULL DEFAULT false,
    blocked_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes for security monitoring
    INDEX idx_webhook_security_ip (ip_address, created_at DESC),
    INDEX idx_webhook_security_status (response_status, created_at DESC),
    INDEX idx_webhook_security_blocked (blocked_reason, created_at DESC) WHERE blocked_reason IS NOT NULL
);

-- Rate limiting table for webhook protection
CREATE TABLE IF NOT EXISTS webhook_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address TEXT NOT NULL UNIQUE,
    request_count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    blocked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_webhook_rate_limits_ip (ip_address),
    INDEX idx_webhook_rate_limits_blocked (blocked_until) WHERE blocked_until IS NOT NULL
);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all new tables
ALTER TABLE payment_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_security_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_rate_limits ENABLE ROW LEVEL SECURITY;

-- Payment audit log policies
CREATE POLICY "Admins can view all payment audit logs" ON payment_audit_log
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Users can view their payment audit logs" ON payment_audit_log
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert payment audit logs" ON payment_audit_log
    FOR INSERT WITH CHECK (true); -- Allow system inserts

-- Purchases policies
CREATE POLICY "Buyers can view their purchases" ON purchases
    FOR SELECT USING (buyer_id = auth.uid());

CREATE POLICY "Sellers can view their sales" ON purchases
    FOR SELECT USING (seller_id = auth.uid());

CREATE POLICY "Buyers can update purchase status" ON purchases
    FOR UPDATE USING (buyer_id = auth.uid());

CREATE POLICY "System can manage purchases" ON purchases
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );

-- Service payments policies
CREATE POLICY "Mechanics can view their service payments" ON service_payments
    FOR SELECT USING (mechanic_id IN (
        SELECT id FROM mechanics WHERE user_id = auth.uid()
    ));

CREATE POLICY "Customers can view their service payments" ON service_payments
    FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "System can manage service payments" ON service_payments
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );

-- Payment intents policies
CREATE POLICY "Users can view their payment intents" ON payment_intents
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can manage payment intents" ON payment_intents
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );

-- Payouts policies
CREATE POLICY "Mechanics can view their payouts" ON payouts
    FOR SELECT USING (mechanic_id IN (
        SELECT id FROM mechanics WHERE user_id = auth.uid()
    ));

CREATE POLICY "System can manage payouts" ON payouts
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );

-- Services policies
CREATE POLICY "Mechanics can manage their services" ON services
    FOR ALL USING (mechanic_id IN (
        SELECT id FROM mechanics WHERE user_id = auth.uid()
    ));

CREATE POLICY "Customers can view and update their services" ON services
    FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "Customers can update service status" ON services
    FOR UPDATE USING (customer_id = auth.uid());

-- Security log policies (admin only)
CREATE POLICY "Admins can view security logs" ON webhook_security_log
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "System can insert security logs" ON webhook_security_log
    FOR INSERT WITH CHECK (true);

-- Rate limits policies (system only)
CREATE POLICY "System can manage rate limits" ON webhook_rate_limits
    FOR ALL WITH CHECK (true);

-- =====================================================
-- TRIGGERS FOR AUTO-UPDATES
-- =====================================================

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON purchases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_payments_updated_at BEFORE UPDATE ON service_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_intents_updated_at BEFORE UPDATE ON payment_intents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON payouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhook_rate_limits_updated_at BEFORE UPDATE ON webhook_rate_limits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to clean up old audit logs (for GDPR compliance)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(days_to_keep INTEGER DEFAULT 365)
RETURNS INTEGER
LANGUAGE SQL
AS $$
    WITH deleted AS (
        DELETE FROM payment_audit_log 
        WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep
        RETURNING id
    )
    SELECT COUNT(*) FROM deleted;
$$;

-- Function to get payment statistics for a user
CREATE OR REPLACE FUNCTION get_user_payment_stats(target_user_id UUID)
RETURNS JSON
LANGUAGE SQL STABLE
AS $$
    SELECT json_build_object(
        'total_purchases', COALESCE(SUM(CASE WHEN p.buyer_id = target_user_id THEN p.amount END), 0),
        'total_sales', COALESCE(SUM(CASE WHEN p.seller_id = target_user_id THEN p.amount END), 0),
        'total_service_payments', COALESCE(SUM(CASE WHEN sp.customer_id = target_user_id THEN sp.amount END), 0),
        'total_service_earnings', COALESCE(SUM(CASE WHEN sp.mechanic_id IN (
            SELECT id FROM mechanics WHERE user_id = target_user_id
        ) THEN sp.mechanic_payout END), 0),
        'purchase_count', COUNT(CASE WHEN p.buyer_id = target_user_id THEN 1 END),
        'sales_count', COUNT(CASE WHEN p.seller_id = target_user_id THEN 1 END),
        'service_count', COUNT(CASE WHEN sp.customer_id = target_user_id THEN 1 END)
    )
    FROM purchases p
    FULL OUTER JOIN service_payments sp ON false -- This creates a cross join for aggregation
    WHERE p.buyer_id = target_user_id 
       OR p.seller_id = target_user_id 
       OR sp.customer_id = target_user_id
       OR sp.mechanic_id IN (SELECT id FROM mechanics WHERE user_id = target_user_id);
$$;

-- =====================================================
-- INITIAL DATA & CLEANUP
-- =====================================================

-- Create indexes on existing tables if they don't exist
DO $$
BEGIN
    -- Add stripe_payment_intent_id to parts table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'parts' AND column_name = 'stripe_payment_intent_id') THEN
        ALTER TABLE parts ADD COLUMN stripe_payment_intent_id TEXT;
        CREATE INDEX idx_parts_stripe_intent ON parts (stripe_payment_intent_id);
    END IF;
    
    -- Add payment-related columns to parts table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'parts' AND column_name = 'buyer_id') THEN
        ALTER TABLE parts ADD COLUMN buyer_id UUID REFERENCES profiles(id);
        ALTER TABLE parts ADD COLUMN sold_at TIMESTAMPTZ;
        CREATE INDEX idx_parts_buyer ON parts (buyer_id);
        CREATE INDEX idx_parts_sold_at ON parts (sold_at) WHERE sold_at IS NOT NULL;
    END IF;
END $$;

-- Clean up any existing test data (optional)
-- DELETE FROM payment_audit_log WHERE created_at < NOW() - INTERVAL '1 day' AND amount = 0;

-- Insert initial system configuration
INSERT INTO webhook_rate_limits (ip_address, request_count, window_start) 
VALUES ('127.0.0.1', 0, NOW()) 
ON CONFLICT (ip_address) DO NOTHING;

COMMENT ON TABLE payment_audit_log IS 'Comprehensive audit trail for all payment-related activities';
COMMENT ON TABLE purchases IS 'Marketplace purchase transactions';
COMMENT ON TABLE service_payments IS 'Payments for mechanic services including video calls and consultations';
COMMENT ON TABLE payment_intents IS 'Stripe payment intent tracking';
COMMENT ON TABLE payouts IS 'Mechanic payout tracking via Stripe Connect';
COMMENT ON TABLE webhook_security_log IS 'Security monitoring for webhook endpoints';
COMMENT ON TABLE webhook_rate_limits IS 'Rate limiting for webhook protection';