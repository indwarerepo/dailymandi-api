CREATE TABLE zone
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    "zoneName" character varying NOT NULL,
    area character varying(500),
    district character varying(500),
    "deliveryCharge" integer,
    "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" uuid NOT NULL,
    "updatedAt" timestamp without time zone,
    "updatedBy" uuid,
    "isActive" boolean NOT NULL DEFAULT true,
    "softDelete" boolean NOT NULL DEFAULT false,
    PRIMARY KEY (id)
);