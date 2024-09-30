
 ALTER TABLE IF EXISTS cms DROP COLUMN IF EXISTS "createdAt";

ALTER TABLE IF EXISTS cms DROP COLUMN IF EXISTS "updatedAt";

ALTER TABLE IF EXISTS cms
    ADD COLUMN "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE IF EXISTS cms
    ADD COLUMN "updatedAt" timestamp(3) without time zone;

