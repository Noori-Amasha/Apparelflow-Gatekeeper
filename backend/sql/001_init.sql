CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'user_role'
    ) THEN
        CREATE TYPE user_role AS ENUM (
            'cutting_supervisor',
            'cutting_verifier',
            'sewing_supervisor'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'cutting_order_status'
    ) THEN
        CREATE TYPE cutting_order_status AS ENUM (
            'CUTTING_IN_PROGRESS',
            'PENDING_VERIFICATION',
            'REJECTED',
            'VERIFIED'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'verification_status'
    ) THEN
        CREATE TYPE verification_status AS ENUM (
            'GREEN',
            'YELLOW',
            'RED'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'verification_decision'
    ) THEN
        CREATE TYPE verification_decision AS ENUM (
            'APPROVED',
            'REJECTED'
        );
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    std_fabric_yards NUMERIC(10,2) NOT NULL CHECK (std_fabric_yards > 0),
    wastage_cap NUMERIC(5,2) NOT NULL CHECK (wastage_cap >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipe_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    component_name VARCHAR(255) NOT NULL,
    pieces_per_garment INTEGER NOT NULL CHECK (pieces_per_garment > 0),
    image_url TEXT,
    UNIQUE (recipe_id, component_name)
);

CREATE TABLE IF NOT EXISTS cutting_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_no VARCHAR(50) UNIQUE NOT NULL,
    recipe_id UUID NOT NULL REFERENCES recipes(id),
    target_qty INTEGER NOT NULL CHECK (target_qty > 0),
    fabric_roll_id VARCHAR(100) NOT NULL,
    actual_fabric_yds NUMERIC(10,2) NOT NULL CHECK (actual_fabric_yds >= 0),
    status cutting_order_status NOT NULL DEFAULT 'CUTTING_IN_PROGRESS',
    created_by UUID NOT NULL REFERENCES users(id),
    sewing_started_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES cutting_orders(id) ON DELETE CASCADE,
    component_id UUID NOT NULL REFERENCES recipe_components(id),
    expected_qty INTEGER NOT NULL CHECK (expected_qty >= 0),
    actual_qty INTEGER CHECK (actual_qty >= 0),
    status verification_status,
    UNIQUE (order_id, component_id)
);

CREATE TABLE IF NOT EXISTS verification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES cutting_orders(id),
    verifier_id UUID NOT NULL REFERENCES users(id),
    decision verification_decision NOT NULL,
    rejection_note TEXT,
    wastage_pct NUMERIC(8,4),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cutting_orders_status
    ON cutting_orders(status);

CREATE INDEX IF NOT EXISTS idx_cutting_orders_created_by
    ON cutting_orders(created_by);

CREATE INDEX IF NOT EXISTS idx_verification_items_order_id
    ON verification_items(order_id);

CREATE INDEX IF NOT EXISTS idx_verification_logs_order_id
    ON verification_logs(order_id);