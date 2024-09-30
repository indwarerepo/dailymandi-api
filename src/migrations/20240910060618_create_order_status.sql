CREATE TABLE public.order_status
(
    id uuid DEFAULT uuid_generate_v4(),
    "statusTitle" character varying,
    remarks character varying,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "createdBy" uuid NOT NULL,
    "updatedAt" timestamp without time zone,
    "updatedBy" uuid,
    "isActive" boolean DEFAULT true,
    "softDelete" boolean DEFAULT false,
    PRIMARY KEY (id)
);