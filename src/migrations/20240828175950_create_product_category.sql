CREATE TABLE product_category
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name character varying(50),
    "coverImage" character varying(50),
    "coverVideo" character varying,
    description text,
     "metaTitle" character varying,
    "metaDescription" text,
    "displayOrder" integer NOT NULL DEFAULT 1,
    "isFeatured" boolean NOT NULL DEFAULT false,
    "isTopMenu" boolean NOT NULL DEFAULT false,
    "isActive" boolean NOT NULL DEFAULT true,
    "softDelete" boolean NOT NULL DEFAULT false,
    "createdAt" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp with time zone,
    "createdBy" uuid NOT NULL,
    "updatedBy" uuid,
    PRIMARY KEY (id)
);
