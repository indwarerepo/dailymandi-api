CREATE TABLE public.qrcode
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name character varying(255),
    image character varying,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "createdBy" uuid NOT NULL,
    "updatedAt" timestamp without time zone,
    "updatedBy" uuid,
    "isActive" boolean DEFAULT true,
    "softDelete" boolean DEFAULT false,
    PRIMARY KEY (id)
);