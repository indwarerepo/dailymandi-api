CREATE TABLE orders
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    "customerId" uuid NOT NULL,
    "orderNumber" character varying(255),
    "orderPrice" character varying(255),
    "isCouponApplied" boolean DEFAULT false,
    "couponId" uuid,
    "orderStatusId" uuid,
    "driverId" uuid,
    "driverAccepted" boolean DEFAULT false,
    "discountedPrice" double precision,
    "subtotalPrice" double precision,
    "taxAmt" double precision,
    "deliveryAmt" double precision,
    "orderTotal" double precision,
    "orderTotalInWord" character varying,
    "finYear" character varying,
    "isWalletUsed" boolean DEFAULT false,
    "amountDeductionFromWallet" double precision,
    "payableAmount" double precision,
    "paidAmount" double precision,
    "dueAmount" double precision,
    "paymentStatus" boolean DEFAULT true,
    "paymentMethod" character varying,
    "paymentDate" timestamp without time zone,
    "dueDate" timestamp without time zone,
    "orderType" character varying,
    "deliveryAddress" character varying,
    "deliveryPincode" character varying,
    "deliveryState" character varying,
    "deliveryCity" character varying,
    "commissionDistributed" boolean DEFAULT false,
    "isReturn" boolean DEFAULT false,
    "isDelivered" boolean DEFAULT false,
    "isCancelled" boolean DEFAULT false,
    "deliverySlotId" uuid NOT NULL,
    "deliveryOtp" integer,
    "acceptedAt" timestamp without time zone,
    "deliveredAt" timestamp without time zone,
    "varient_name" character varying(500),
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "createdBy" uuid,
    "updatedAt" timestamp without time zone,
    "updatedBy" uuid,
    "isActive" boolean DEFAULT true,
    "softDelete" boolean DEFAULT false,
    PRIMARY KEY (id),
    CONSTRAINT "orderCustomer" FOREIGN KEY ("customerId")
        REFERENCES users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID,
        CONSTRAINT "order_driverId_fkey" FOREIGN KEY ("driverId")
        REFERENCES driver (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID,
    FOREIGN KEY ("orderStatusId")
        REFERENCES order_status (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID,
        CONSTRAINT "order_deliverySlot_fkey" FOREIGN KEY ("deliverySlotId")
    REFERENCES delivery_slots (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;
);