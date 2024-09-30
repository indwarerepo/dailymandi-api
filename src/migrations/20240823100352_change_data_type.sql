ALTER TABLE IF EXISTS users DROP COLUMN IF EXISTS "verificationTimeout";

ALTER TABLE IF EXISTS public.users
    ADD COLUMN "verificationTimeout" timestamp without time zone;
