CREATE TABLE variant_master (
    id uuid PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
    variantName VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" uuid NOT NULL,
    "updatedAt" timestamp without time zone,
    "updatedBy" uuid,
    "isActive" boolean NOT NULL DEFAULT true,
    "softDelete" boolean NOT NULL DEFAULT false
);
