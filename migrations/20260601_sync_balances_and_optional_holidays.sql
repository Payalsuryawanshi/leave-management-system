-- One-time cleanup for existing databases.
-- App code now keeps LEAVE_BALANCE.total synced with LEAVE_TYPES.quota_per_year,
-- but this migration fixes already-seeded rows and known optional holiday flags.

UPDATE LEAVE_BALANCE lb
SET lb.total = (
    SELECT lt.quota_per_year
    FROM LEAVE_TYPES lt
    WHERE lt.type_id = lb.type_id
)
WHERE EXISTS (
    SELECT 1
    FROM LEAVE_TYPES lt
    WHERE lt.type_id = lb.type_id
    AND lt.is_active = 1
);

UPDATE HOLIDAYS
SET is_optional = 1
WHERE UPPER(name) IN ('DIWALI', 'HOLI', 'RAKHI');

COMMIT;
