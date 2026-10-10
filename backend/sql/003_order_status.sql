BEGIN;

ALTER TABLE cutting_orders
DROP CONSTRAINT IF EXISTS cutting_orders_status_check;

ALTER TABLE cutting_orders
ALTER COLUMN status TYPE VARCHAR(30);

UPDATE cutting_orders
SET status = 'PENDING_VERIFICATION'
WHERE status = 'SUBMITTED';

UPDATE cutting_orders
SET status = 'VERIFIED'
WHERE status = 'APPROVED';

ALTER TABLE cutting_orders
ADD CONSTRAINT cutting_orders_status_check
CHECK (
    status IN (
        'PENDING',
        'IN_PROGRESS',
        'PENDING_VERIFICATION',
        'VERIFIED',
        'REJECTED',
        'SEWING_STARTED'
    )
);

COMMIT;