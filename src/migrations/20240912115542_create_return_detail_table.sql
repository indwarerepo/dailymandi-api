CREATE TABLE IF NOT EXISTS return_detail
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    "returnId" uuid,
    "productId" uuid,
    quantity numeric,
    "orderPrice" double precision,
    "subTotal" double precision,
    "isTaxable" boolean DEFAULT false,
    "taxRate" double precision,
    "taxAmt" double precision,
    "totalAmt" double precision,
    "isSupplied" boolean DEFAULT false,
    "isReturned" boolean DEFAULT false,
    "returnedDateLimit" timestamp without time zone,
    returned_status boolean DEFAULT false,
    "returnedRemarks" character varying COLLATE pg_catalog."default",
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "createdBy" uuid NOT NULL,
    "updatedAt" timestamp without time zone,
    "updatedBy" uuid,
    "isActive" boolean DEFAULT true,
    "softDelete" boolean DEFAULT false,
    CONSTRAINT return_detail_pkey PRIMARY KEY (id),
     CONSTRAINT "returnProductWithVariant" FOREIGN KEY ("productId")
        REFERENCES product_variant (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
    CONSTRAINT "reurnDetail" FOREIGN KEY ("returnId")
        REFERENCES order_return (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)