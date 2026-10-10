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
END $$;


-- 1. USERS

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email VARCHAR(255) NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    role user_role NOT NULL,

    full_name VARCHAR(150) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 2. RECIPES

CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    recipe_code VARCHAR(60) NOT NULL UNIQUE,

    name VARCHAR(150) NOT NULL,

    category VARCHAR(100) NOT NULL,

    std_fabric_yards NUMERIC(12,3) NOT NULL
        CHECK (std_fabric_yards > 0),

    wastage_cap NUMERIC(6,2) NOT NULL
        CHECK (wastage_cap BETWEEN 0 AND 100)
);


-- 3. RECIPE COMPONENTS

CREATE TABLE IF NOT EXISTS recipe_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    recipe_id UUID NOT NULL
        REFERENCES recipes(id) ON DELETE CASCADE,

    component_name VARCHAR(150) NOT NULL,

    pieces_per_garment INTEGER NOT NULL
        CHECK (pieces_per_garment > 0),

    image_url TEXT,

    UNIQUE(recipe_id, component_name)
);


-- 4. CUTTING ORDERS

CREATE TABLE IF NOT EXISTS cutting_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    order_no VARCHAR(60) NOT NULL UNIQUE,

    recipe_id UUID NOT NULL REFERENCES recipes(id),

    target_qty INTEGER NOT NULL
        CHECK (target_qty > 0),

    fabric_roll_id VARCHAR(100) NOT NULL,

    actual_fabric_yds NUMERIC(12,3)
        CHECK (actual_fabric_yds >= 0),

    status VARCHAR(30) NOT NULL DEFAULT 'PENDING'
        CHECK (
            status IN (
                'PENDING',
                'IN_PROGRESS',
                'PENDING_VERIFICATION',
                'VERIFIED',
                'REJECTED',
                'SEWING_STARTED'
            )
        ),
    created_by UUID NOT NULL REFERENCES users(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 5. VERIFICATION ITEMS

CREATE TABLE IF NOT EXISTS verification_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    order_id UUID NOT NULL
        REFERENCES cutting_orders(id) ON DELETE CASCADE,

    component_id UUID NOT NULL
        REFERENCES recipe_components(id),

    expected_qty INTEGER NOT NULL
        CHECK (expected_qty >= 0),

    actual_qty INTEGER
        CHECK (actual_qty >= 0),

    status VARCHAR(10) NOT NULL DEFAULT 'YELLOW'
        CHECK (status IN ('GREEN', 'YELLOW', 'RED')),

    UNIQUE(order_id, component_id)
);


-- 6. VERIFICATION LOGS

CREATE TABLE IF NOT EXISTS verification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    order_id UUID NOT NULL REFERENCES cutting_orders(id),

    verifier_id UUID NOT NULL REFERENCES users(id),

    decision VARCHAR(10) NOT NULL
        CHECK (decision IN ('APPROVED', 'REJECTED')),

    rejection_note TEXT,

    wastage_pct NUMERIC(8,2) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (
        decision <> 'REJECTED'
        OR (
            rejection_note IS NOT NULL
            AND LENGTH(TRIM(rejection_note)) > 0
        )
    )
);


-- INDEXES

CREATE INDEX IF NOT EXISTS idx_components_recipe
ON recipe_components(recipe_id);

CREATE INDEX IF NOT EXISTS idx_orders_recipe
ON cutting_orders(recipe_id);

CREATE INDEX IF NOT EXISTS idx_orders_creator
ON cutting_orders(created_by);

CREATE INDEX IF NOT EXISTS idx_items_order
ON verification_items(order_id);

CREATE INDEX IF NOT EXISTS idx_logs_order
ON verification_logs(order_id);