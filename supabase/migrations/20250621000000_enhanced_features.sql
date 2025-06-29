-- Enhanced Features Migration: Payment Processing & Location Services
-- Created: 2025-06-21

-- =====================================================
-- PAYMENT PROCESSING TABLES
-- =====================================================

-- Invoices table for billing system
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES appointments(id),
    video_call_id UUID REFERENCES video_calls(id),
    mechanic_id UUID NOT NULL REFERENCES mechanics(id),
    user_id UUID NOT NULL REFERENCES profiles(id),
    amount INTEGER NOT NULL, -- Amount in cents
    hourly_rate DECIMAL(10,2) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    service_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    stripe_payment_intent_id TEXT,
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled')),
    invoice_number TEXT UNIQUE NOT NULL,
    issued_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date TIMESTAMPTZ NOT NULL,
    paid_date TIMESTAMPTZ,
    description TEXT NOT NULL,
    line_items JSONB NOT NULL DEFAULT '[]',
    subtotal INTEGER NOT NULL,
    tax_amount INTEGER DEFAULT 0,
    total_amount INTEGER NOT NULL,
    mechanic_payout_amount INTEGER NOT NULL,
    platform_fee_amount INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice line items (normalized table for better querying)
CREATE TABLE IF NOT EXISTS invoice_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    rate DECIMAL(10,2) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mechanic payouts table
CREATE TABLE IF NOT EXISTS mechanic_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mechanic_id UUID NOT NULL REFERENCES mechanics(id),
    stripe_account_id TEXT NOT NULL,
    amount INTEGER NOT NULL, -- Amount in cents
    currency TEXT NOT NULL DEFAULT 'usd',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
    transfer_id TEXT,
    invoice_ids UUID[] NOT NULL,
    payout_date TIMESTAMPTZ,
    failure_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- LOCATION SERVICES TABLES
-- =====================================================

-- Real-time mechanic locations
CREATE TABLE IF NOT EXISTS mechanic_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mechanic_id UUID NOT NULL REFERENCES mechanics(id) ON DELETE CASCADE,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    accuracy FLOAT, -- GPS accuracy in meters
    is_online BOOLEAN NOT NULL DEFAULT false,
    is_available BOOLEAN NOT NULL DEFAULT false,
    estimated_arrival_time INTEGER, -- in minutes
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(mechanic_id)
);

-- Service areas for mechanics
CREATE TABLE IF NOT EXISTS service_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mechanic_id UUID NOT NULL REFERENCES mechanics(id) ON DELETE CASCADE,
    center_lat DECIMAL(10,8) NOT NULL,
    center_lng DECIMAL(11,8) NOT NULL,
    radius_miles DECIMAL(6,2) NOT NULL,
    pricing_multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Location tracking history (for analytics)
CREATE TABLE IF NOT EXISTS location_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mechanic_id UUID NOT NULL REFERENCES mechanics(id) ON DELETE CASCADE,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    accuracy FLOAT,
    speed FLOAT, -- in mph
    heading FLOAT, -- in degrees
    activity_type TEXT, -- 'stationary', 'walking', 'driving', etc.
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- ENHANCED EXISTING TABLES
-- =====================================================

-- Add new columns to mechanics table
ALTER TABLE mechanics 
ADD COLUMN IF NOT EXISTS availability_schedule JSONB,
ADD COLUMN IF NOT EXISTS service_area_radius DECIMAL(6,2) DEFAULT 25.0,
ADD COLUMN IF NOT EXISTS is_mobile BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8),
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS is_available_for_calls BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS call_rate_per_minute DECIMAL(6,2);

-- Create enhanced appointments table if not exists
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    mechanic_id UUID NOT NULL REFERENCES mechanics(id),
    scheduled_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    service_type TEXT NOT NULL CHECK (service_type IN ('diagnostic', 'repair', 'consultation', 'inspection')),
    estimated_duration INTEGER NOT NULL, -- in minutes
    hourly_rate DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(10,2),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    payment_intent_id TEXT,
    location_type TEXT NOT NULL CHECK (location_type IN ('mobile', 'shop', 'remote')),
    service_location TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create video_calls table if not exists
CREATE TABLE IF NOT EXISTS video_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES appointments(id),
    mechanic_id UUID NOT NULL REFERENCES mechanics(id),
    user_id UUID NOT NULL REFERENCES profiles(id),
    call_type TEXT NOT NULL CHECK (call_type IN ('voice', 'video', 'screen_share')),
    status TEXT NOT NULL DEFAULT 'initiating' CHECK (status IN ('initiating', 'ringing', 'active', 'ended', 'failed')),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    duration INTEGER, -- in seconds
    call_rate_per_minute DECIMAL(6,2) NOT NULL,
    total_cost DECIMAL(10,2),
    peer_id TEXT,
    offer TEXT,
    answer TEXT,
    ice_candidates JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Location-based indexes
CREATE INDEX IF NOT EXISTS idx_mechanic_locations_coordinates ON mechanic_locations USING gist (
    ll_to_earth(latitude, longitude)
);
CREATE INDEX IF NOT EXISTS idx_mechanic_locations_online ON mechanic_locations (is_online, is_available);
CREATE INDEX IF NOT EXISTS idx_mechanic_locations_updated ON mechanic_locations (updated_at DESC);

-- Service area indexes
CREATE INDEX IF NOT EXISTS idx_service_areas_center ON service_areas USING gist (
    ll_to_earth(center_lat, center_lng)
);
CREATE INDEX IF NOT EXISTS idx_service_areas_mechanic ON service_areas (mechanic_id, is_active);

-- Invoice indexes
CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_mechanic ON invoices (mechanic_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices (status, payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe ON invoices (stripe_payment_intent_id);

-- Appointment indexes
CREATE INDEX IF NOT EXISTS idx_appointments_user ON appointments (user_id, scheduled_date DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_mechanic ON appointments (mechanic_id, scheduled_date DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON appointments (scheduled_date, status);

-- Video call indexes
CREATE INDEX IF NOT EXISTS idx_video_calls_participants ON video_calls (mechanic_id, user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_calls_status ON video_calls (status, created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE mechanic_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mechanic_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_calls ENABLE ROW LEVEL SECURITY;

-- Invoice policies
CREATE POLICY "Users can view their own invoices" ON invoices
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Mechanics can view their invoices" ON invoices
    FOR SELECT USING (mechanic_id IN (
        SELECT id FROM mechanics WHERE user_id = auth.uid()
    ));

CREATE POLICY "System can manage invoices" ON invoices
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );

-- Mechanic location policies
CREATE POLICY "Mechanics can update their location" ON mechanic_locations
    FOR ALL USING (mechanic_id IN (
        SELECT id FROM mechanics WHERE user_id = auth.uid()
    ));

CREATE POLICY "Public can view online mechanic locations" ON mechanic_locations
    FOR SELECT USING (is_online = true);

-- Service area policies
CREATE POLICY "Mechanics can manage their service areas" ON service_areas
    FOR ALL USING (mechanic_id IN (
        SELECT id FROM mechanics WHERE user_id = auth.uid()
    ));

CREATE POLICY "Public can view active service areas" ON service_areas
    FOR SELECT USING (is_active = true);

-- Appointment policies
CREATE POLICY "Users can manage their appointments" ON appointments
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Mechanics can view/update their appointments" ON appointments
    FOR SELECT USING (mechanic_id IN (
        SELECT id FROM mechanics WHERE user_id = auth.uid()
    ));

CREATE POLICY "Mechanics can update appointment status" ON appointments
    FOR UPDATE USING (mechanic_id IN (
        SELECT id FROM mechanics WHERE user_id = auth.uid()
    ));

-- Video call policies
CREATE POLICY "Participants can manage their video calls" ON video_calls
    FOR ALL USING (
        user_id = auth.uid() OR 
        mechanic_id IN (SELECT id FROM mechanics WHERE user_id = auth.uid())
    );

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to get nearby mechanics with real-time locations
CREATE OR REPLACE FUNCTION get_nearby_mechanics_with_location(
    user_lat DECIMAL,
    user_lng DECIMAL,
    radius_miles DECIMAL DEFAULT 25
)
RETURNS TABLE (
    mechanic_id UUID,
    full_name TEXT,
    phone TEXT,
    specialties TEXT[],
    hourly_rate DECIMAL,
    latitude DECIMAL,
    longitude DECIMAL,
    distance_miles DECIMAL,
    estimated_arrival_time INTEGER,
    is_online BOOLEAN,
    is_available BOOLEAN,
    last_seen TIMESTAMPTZ
) 
LANGUAGE SQL STABLE
AS $$
    SELECT 
        m.id,
        m.full_name,
        m.phone,
        m.specialties,
        m.hourly_rate,
        ml.latitude,
        ml.longitude,
        ROUND(
            (point(user_lng, user_lat) <@> point(ml.longitude, ml.latitude))::DECIMAL * 69.0, 
            2
        ) as distance_miles,
        ml.estimated_arrival_time,
        ml.is_online,
        ml.is_available,
        ml.updated_at
    FROM mechanics m
    INNER JOIN mechanic_locations ml ON m.id = ml.mechanic_id
    WHERE 
        m.status = 'approved'
        AND ml.is_online = true
        AND (point(user_lng, user_lat) <@> point(ml.longitude, ml.latitude)) * 69.0 <= radius_miles
    ORDER BY distance_miles ASC;
$$;

-- Function to calculate distance-based pricing
CREATE OR REPLACE FUNCTION calculate_distance_pricing(
    base_rate DECIMAL,
    distance_miles DECIMAL
)
RETURNS JSON
LANGUAGE SQL STABLE
AS $$
    SELECT json_build_object(
        'base_rate', base_rate,
        'distance_miles', distance_miles,
        'pricing_tier', 
            CASE 
                WHEN distance_miles <= 10 THEN 'local'
                WHEN distance_miles <= 25 THEN 'extended'
                ELSE 'long_distance'
            END,
        'multiplier',
            CASE 
                WHEN distance_miles <= 10 THEN 1.0
                WHEN distance_miles <= 25 THEN 1.15
                ELSE 1.30
            END,
        'fuel_surcharge',
            CASE 
                WHEN distance_miles <= 10 THEN 0
                WHEN distance_miles <= 25 THEN distance_miles * 0.50
                ELSE distance_miles * 0.75
            END,
        'total_rate',
            CASE 
                WHEN distance_miles <= 10 THEN base_rate
                WHEN distance_miles <= 25 THEN (base_rate * 1.15) + (distance_miles * 0.50)
                ELSE (base_rate * 1.30) + (distance_miles * 0.75)
            END
    );
$$;

-- Function to update mechanic ratings
CREATE OR REPLACE FUNCTION update_mechanic_rating(
    mechanic_id_param UUID,
    new_rating DECIMAL
)
RETURNS VOID
LANGUAGE SQL
AS $$
    UPDATE mechanics 
    SET 
        total_reviews = total_reviews + 1,
        average_rating = ROUND(
            ((average_rating * total_reviews) + new_rating) / (total_reviews + 1), 
            2
        )
    WHERE id = mechanic_id_param;
$$;

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to relevant tables
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mechanic_payouts_updated_at BEFORE UPDATE ON mechanic_payouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_areas_updated_at BEFORE UPDATE ON service_areas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_calls_updated_at BEFORE UPDATE ON video_calls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically update mechanic location timestamp
CREATE TRIGGER update_mechanic_locations_updated_at BEFORE UPDATE ON mechanic_locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();