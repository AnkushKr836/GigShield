-- ============================================================
-- GigShield — Database Schema
-- PostgreSQL 14+
-- Matches docs/ER_diagram.png
-- ============================================================

-- Needed for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- ZONE
-- Geographic unit used for both rider location and
-- disruption-event scoping.
-- ============================================================
CREATE TABLE zone (
    zone_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    risk_tier   VARCHAR(20) NOT NULL DEFAULT 'medium'
                CHECK (risk_tier IN ('low', 'medium', 'high')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- RIDER
-- One rider belongs to one zone; can hold multiple policies
-- over time (renewed weekly).
-- ============================================================
CREATE TABLE rider (
    rider_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(150) NOT NULL,
    email         VARCHAR(150) UNIQUE NOT NULL,
    phone         VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    persona_type  VARCHAR(30) NOT NULL
                  CHECK (persona_type IN ('food_delivery', 'ecommerce', 'grocery_qcommerce')),
    zone_id       UUID NOT NULL REFERENCES zone(zone_id) ON DELETE RESTRICT,
    joined_on     DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rider_zone_id ON rider(zone_id);

-- ============================================================
-- POLICY
-- One active weekly policy per rider; stores the computed
-- weekly premium.
-- ============================================================
CREATE TABLE policy (
    policy_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id        UUID NOT NULL REFERENCES rider(rider_id) ON DELETE CASCADE,
    weekly_premium  NUMERIC(10, 2) NOT NULL CHECK (weekly_premium >= 0),
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'expired', 'cancelled')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_policy_dates CHECK (end_date > start_date)
);

CREATE INDEX idx_policy_rider_id ON policy(rider_id);
CREATE INDEX idx_policy_status ON policy(status);

-- ============================================================
-- DISRUPTION_EVENT
-- Objective, API-sourced record of a verified external
-- disruption in a zone.
-- ============================================================
CREATE TABLE disruption_event (
    event_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id          UUID NOT NULL REFERENCES zone(zone_id) ON DELETE RESTRICT,
    disruption_type  VARCHAR(30) NOT NULL
                     CHECK (disruption_type IN ('environmental', 'social')),
    subtype          VARCHAR(50),          -- e.g. 'heavy_rain', 'curfew', 'flood'
    severity         VARCHAR(20) NOT NULL DEFAULT 'moderate'
                     CHECK (severity IN ('low', 'moderate', 'high', 'severe')),
    start_time       TIMESTAMPTZ NOT NULL,
    end_time         TIMESTAMPTZ,
    source           VARCHAR(50) NOT NULL, -- e.g. 'openweathermap', 'mock_traffic', 'admin_seed'
    raw_payload      JSONB,                -- original API response, for audit/debugging
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_event_times CHECK (end_time IS NULL OR end_time > start_time)
);

CREATE INDEX idx_disruption_zone_id ON disruption_event(zone_id);
CREATE INDEX idx_disruption_start_time ON disruption_event(start_time);

-- ============================================================
-- ACTIVITY_LOG
-- Independent GPS/order activity trail used to verify claims
-- and detect fraud.
-- ============================================================
CREATE TABLE activity_log (
    log_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id      UUID NOT NULL REFERENCES rider(rider_id) ON DELETE CASCADE,
    timestamp     TIMESTAMPTZ NOT NULL,
    gps_lat       DOUBLE PRECISION NOT NULL CHECK (gps_lat BETWEEN -90 AND 90),
    gps_lng       DOUBLE PRECISION NOT NULL CHECK (gps_lng BETWEEN -180 AND 180),
    order_status  VARCHAR(20) NOT NULL DEFAULT 'idle'
                  CHECK (order_status IN ('idle', 'en_route', 'delivered', 'cancelled')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_rider_id ON activity_log(rider_id);
CREATE INDEX idx_activity_timestamp ON activity_log(timestamp);

-- ============================================================
-- CREDIBILITY_SCORE
-- Recomputed periodically per rider; feeds the claim decision
-- engine's confidence threshold. History kept, not overwritten.
-- ============================================================
CREATE TABLE credibility_score (
    score_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id      UUID NOT NULL REFERENCES rider(rider_id) ON DELETE CASCADE,
    score_value   NUMERIC(4, 3) NOT NULL CHECK (score_value BETWEEN 0 AND 1),
    computed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    factors       JSONB  -- breakdown of contributing factors, for explainability
);

CREATE INDEX idx_credibility_rider_id ON credibility_score(rider_id);
CREATE INDEX idx_credibility_computed_at ON credibility_score(computed_at);

-- ============================================================
-- CLAIM_TOKEN
-- The central transaction: links Rider + Policy + Disruption
-- Event + claimed amount.
-- ============================================================
CREATE TABLE claim_token (
    token_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id         UUID NOT NULL REFERENCES rider(rider_id) ON DELETE CASCADE,
    policy_id        UUID NOT NULL REFERENCES policy(policy_id) ON DELETE RESTRICT,
    event_id         UUID NOT NULL REFERENCES disruption_event(event_id) ON DELETE RESTRICT,
    claimed_amount   NUMERIC(10, 2) NOT NULL CHECK (claimed_amount >= 0),
    approved_amount  NUMERIC(10, 2) CHECK (approved_amount >= 0),
    status           VARCHAR(20) NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'auto_approved', 'auto_rejected', 'manual_review', 'approved', 'rejected')),
    fraud_flag       BOOLEAN NOT NULL DEFAULT false,
    raised_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    decided_at       TIMESTAMPTZ,

    -- Prevents the same rider double-claiming the same disruption event
    CONSTRAINT uq_claim_rider_event UNIQUE (rider_id, event_id)
);

CREATE INDEX idx_claim_rider_id ON claim_token(rider_id);
CREATE INDEX idx_claim_policy_id ON claim_token(policy_id);
CREATE INDEX idx_claim_event_id ON claim_token(event_id);
CREATE INDEX idx_claim_status ON claim_token(status);

-- ============================================================
-- PAYOUT
-- Optional 1:1 with a Claim Token; created only on approval.
-- ============================================================
CREATE TABLE payout (
    payout_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id      UUID NOT NULL UNIQUE REFERENCES claim_token(token_id) ON DELETE CASCADE,
    amount        NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    channel       VARCHAR(30) NOT NULL DEFAULT 'razorpay_test'
                  CHECK (channel IN ('razorpay_test', 'stripe_sandbox', 'upi_simulator')),
    gateway_ref   VARCHAR(100),  -- transaction/reference id from the payment gateway
    status        VARCHAR(20) NOT NULL DEFAULT 'processing'
                  CHECK (status IN ('processing', 'completed', 'failed')),
    processed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payout_token_id ON payout(token_id);

-- ============================================================
-- Trigger: keep rider.updated_at current on row changes
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_rider_updated_at
    BEFORE UPDATE ON rider
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();