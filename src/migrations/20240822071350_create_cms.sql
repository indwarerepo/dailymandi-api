CREATE TABLE cms
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name character varying NOT NULL,
    "cmsKey" character varying NOT NULL,
    description text NOT NULL,
    url character varying,
    icon character varying,
    "metaTitle" character varying,
    "metaDescription" text,
    "createdAt" time without time zone DEFAULT CURRENT_TIMESTAMP,
    "createdBy" uuid,
    "updatedAt" time without time zone,
    "updatedBy" uuid,
    "isActive" boolean NOT NULL DEFAULT true,
    "softDelete" boolean NOT NULL DEFAULT false,
    PRIMARY KEY (id)
);
