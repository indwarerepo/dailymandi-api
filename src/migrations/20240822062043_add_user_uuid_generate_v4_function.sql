ALTER TABLE IF EXISTS public.user_address
    ALTER COLUMN id SET DEFAULT uuid_generate_v4();
