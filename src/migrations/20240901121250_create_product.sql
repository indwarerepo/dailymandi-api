CREATE TABLE product
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name character varying NOT NULL,
    description text NOT NULL,
    specification character varying NOT NULL,
    "categoryId" uuid NOT NULL,
    "brandId" uuid NOT NULL,
    manufacturer character varying,
    "productAttributes" character varying,
    "productMethod" boolean NOT NULL DEFAULT true,
    "productImage" character varying,
    "paymentTerm" character varying;
    "warrantyPolicy" character varying;
    "metaTitle" character varying,
    "metaDescription" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
    "createdBy" uuid,
    "updatedAt" timestamp(3) without time zone,
    "updatedBy" uuid,
    "isActive" boolean NOT NULL DEFAULT true,
    "softDelete" boolean NOT NULL DEFAULT false,
    PRIMARY KEY (id),
    CONSTRAINT "productCatFkey" FOREIGN KEY ("categoryId")
    REFERENCES product_category (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID
    CONSTRAINT "productBrandFkey" FOREIGN KEY ("brandId")
    REFERENCES product_brand (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID
);
