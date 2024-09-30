CREATE TABLE product_brand
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name character varying(50),
    description character varying(255),
    "metaTitle" character varying(255),
    "metaDescription" character varying(255),
    "isActive" boolean DEFAULT true,
    "softDelete" boolean DEFAULT false,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone,
    "createdBy" uuid NOT NULL,
    "updatedBy" uuid,
    PRIMARY KEY (id)
);