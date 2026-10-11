BEGIN;

ALTER TABLE verification_logs
ADD COLUMN IF NOT EXISTS component_snapshot JSONB;

CREATE OR REPLACE FUNCTION prevent_verification_log_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Verification audit logs are immutable';
END;
$$;

DROP TRIGGER IF EXISTS verification_logs_immutable
ON verification_logs;

CREATE TRIGGER verification_logs_immutable
BEFORE UPDATE OR DELETE
ON verification_logs
FOR EACH ROW
EXECUTE FUNCTION prevent_verification_log_change();

COMMIT;