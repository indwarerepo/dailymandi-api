
CREATE TABLE IF NOT EXISTS public.variant_master
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    "variantName" character varying(50) COLLATE pg_catalog."default" NOT NULL,
    description text COLLATE pg_catalog."default",
    "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" uuid NOT NULL,
    "updatedAt" timestamp without time zone,
    "updatedBy" uuid,
    "isActive" boolean NOT NULL DEFAULT true,
    "softDelete" boolean NOT NULL DEFAULT false,
    CONSTRAINT variant_master_pkey PRIMARY KEY (id),
    CONSTRAINT variant_master_variantname_key UNIQUE ("variantName")
)