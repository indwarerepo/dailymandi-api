CREATE TABLE order_detail
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    "orderId" uuid NOT NULL,
    "productId" uuid NOT NULL,
    quantity numeric,
    "orderPrice" double precision,
    "originalPrice" double precision,
    "productTaxId" uuid,
    "productDetailsId" uuid,
    "taxAmt" double precision,
    "totalAmt" double precision,
    "isReturned" boolean DEFAULT false,
    "isSupplied" boolean DEFAULT true,
    "returnedStatus" boolean DEFAULT false,
    "returnedRemarks" character varying,
    "returnedDateLimit" timestamp without time zone,
    order_status order_status_type NOT NULL DEFAULT '0',
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "createdBy" uuid NOT NULL,
    "updatedAt" timestamp without time zone,
    "updatedBy" uuid,
    "isActive" boolean DEFAULT true,
    "softDelete" boolean DEFAULT false,
   PRIMARY KEY (id),
    CONSTRAINT "orderDetailwithOrder" FOREIGN KEY ("orderId")
        REFERENCES orders (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID,
    CONSTRAINT "orderTax_fkey()" FOREIGN KEY ("productTaxId")
        REFERENCES tax_master (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID,
    CONSTRAINT "orderWithProduct_fkey()" FOREIGN KEY ("productDetailsId")
        REFERENCES product (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID,
    CONSTRAINT "orderDetailwithProduct_fkey()" FOREIGN KEY ("productId")
        REFERENCES product_variant (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
);