CREATE TABLE product_variant
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    "productId" uuid NOT NULL,
    "categoryId" uuid NOT NULL,
    "variantId" uuid NOT NULL,
    "skuNo" character varying,
    "qrCode" character varying NOT NULL,
    "purchaseCost" double precision NOT NULL,
     mrp double precision NOT NULL,
    "sellingPrice" double precision NOT NULL,
    "offerPrice" double precision NOT NULL,
    "taxId" uuid,
    stock integer NOT NULL,
    "isReturnable" boolean,
    "returnDaysLimit" integer,
    "productVariantImage" character varying[],
    "commissionPercentage" numeric NOT NULL DEFAULT 5,
    "createdAt" time without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" uuid,
    "updatedAt" time without time zone,
    "updatedBy" uuid,
    "isActive" boolean NOT NULL DEFAULT true,
    "softDelete" boolean NOT NULL DEFAULT false,
    PRIMARY KEY (id),
    CONSTRAINT "catVariantFkey" FOREIGN KEY ("categoryId")
        REFERENCES product_category (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID,
    CONSTRAINT "productVariantFkey" FOREIGN KEY ("productId")
        REFERENCES product (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID,
    CONSTRAINT "variantMasterFkey" FOREIGN KEY ("variantId")
        REFERENCES variant_master (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID, 
    CONSTRAINT "taxMasterFkey" FOREIGN KEY ("taxId")
        REFERENCES tax_master (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
);
