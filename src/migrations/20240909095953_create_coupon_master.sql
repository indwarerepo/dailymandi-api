
  
  CREATE TABLE IF NOT EXISTS coupon_master
    (
        id uuid NOT NULL DEFAULT uuid_generate_v4(),
        name character varying(255) COLLATE pg_catalog."default" NOT NULL,
        "couponCode" character varying(255) COLLATE pg_catalog."default" NOT NULL,
        "minOrderAmount" integer NOT NULL,
        "offerPercentage" integer NOT NULL,
        "couponValidity" integer,
        "useLimit" integer,
        "startDate" timestamp without time zone,
        "expiredDate" timestamp without time zone,
        "description" character varying COLLATE pg_catalog."default",
        policy character varying COLLATE pg_catalog."default",
         "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
        "createdBy" uuid NOT NULL,
        "updatedAt" timestamp(3) without time zone,
        "updatedBy" uuid,
        "isActive" boolean DEFAULT true,
        "softDelete" boolean DEFAULT false,
        CONSTRAINT coupon_master_pkey PRIMARY KEY (id)
    )
  
  