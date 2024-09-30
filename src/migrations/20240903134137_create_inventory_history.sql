CREATE TABLE inventory_history
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    "productVariantId" uuid NOT NULL,
    "productId" uuid,
    "batchId" character varying,
    "previousStock" integer,
    "currentStock" integer,
    "changeStock" integer,
    "remarks" character varying,
    "createdAt" timestamp(3) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" uuid NOT NULL,
    "updatedAt" timestamp(3) without time zone,
    "updatedBy" uuid,
    "isActive" boolean NOT NULL DEFAULT true,
    "softDelete" boolean NOT NULL DEFAULT false,
    PRIMARY KEY (id),
    CONSTRAINT "productFkey" FOREIGN KEY ("productId")
        REFERENCES product (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID,
    CONSTRAINT "productVariantFkey" FOREIGN KEY ("productVariantId")
        REFERENCES product_variant (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
);
