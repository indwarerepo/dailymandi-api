CREATE TABLE delivery_slots
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    "timeFrom" timestamp without time zone,
    "timeTo" timestamp without time zone,
    "displayContent" character varying,
    "isActive" boolean DEFAULT true,
    "softDelete" boolean DEFAULT false,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "createdBy" uuid NOT NULL,
    "updatedAt" timestamp without time zone,
    "updatedBy" uuid,
    PRIMARY KEY (id)
);