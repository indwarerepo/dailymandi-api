CREATE TABLE IF NOT EXISTS tax_master
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    "taxHead" character varying COLLATE pg_catalog."default" NOT NULL,
    slab character varying(50) COLLATE pg_catalog."default" NOT NULL,
    percentage integer NOT NULL,
    "createdAt" timestamp(3) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" uuid NOT NULL,
    "updatedAt" timestamp without time zone,
    "updatedBy" uuid,
    "isActive" boolean NOT NULL DEFAULT true,
    "softDelete" boolean NOT NULL DEFAULT false,
    CONSTRAINT tax_master_pkey PRIMARY KEY (id)
)