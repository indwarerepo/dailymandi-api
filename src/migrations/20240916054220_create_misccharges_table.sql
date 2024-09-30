CREATE TABLE IF NOT EXISTS misccharges
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    "defaultDiscountRate" integer,
    "specialDiscountRate" integer,
    "defaultTaxRate" integer,
    "specialTaxRate" integer,
    "defaultDeliveryCharge" integer,
    "specialDeliveryRate" integer,
    "welcomeWalletAmt" integer,
    "walletDeductionRateOnOrder" integer,
    "orderReturnCommRateOA" integer,
    "orderReturnCommRateNOA" integer,
    "refByAddCommRate" integer,
    "isActive" boolean DEFAULT true,
    "softDelete" boolean DEFAULT false,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone,
    "createdBy" uuid NOT NULL,
    "updatedBy" uuid,
    CONSTRAINT misccharges_pkey PRIMARY KEY (id)
)