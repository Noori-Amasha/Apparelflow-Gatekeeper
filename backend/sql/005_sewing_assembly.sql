
BEGIN;

CREATE TABLE IF NOT EXISTS sewing_assemblies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    order_id UUID NOT NULL UNIQUE
        REFERENCES cutting_orders(id) ON DELETE RESTRICT,

    started_by UUID NOT NULL
        REFERENCES users(id) ON DELETE RESTRICT,

    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_sewing_queue
ON cutting_orders(created_at DESC)
WHERE status = 'VERIFIED';

CREATE INDEX IF NOT EXISTS idx_orders_sewing_started
ON cutting_orders(updated_at DESC)
WHERE status = 'SEWING_STARTED';

CREATE INDEX IF NOT EXISTS idx_sewing_assemblies_started_by
ON sewing_assemblies(started_by);

-- Prevent sewing attribution from being rewritten or deleted.
CREATE OR REPLACE FUNCTION prevent_sewing_assembly_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Sewing assembly records are immutable';
END;
$$;

DROP TRIGGER IF EXISTS sewing_assemblies_immutable
ON sewing_assemblies;

CREATE TRIGGER sewing_assemblies_immutable
BEFORE UPDATE OR DELETE ON sewing_assemblies
FOR EACH ROW
EXECUTE FUNCTION prevent_sewing_assembly_change();

COMMIT;
