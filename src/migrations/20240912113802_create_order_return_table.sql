CREATE TABLE IF NOT EXISTS order_return
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    "orderId" uuid NOT NULL,
    "customerId" uuid NOT NULL,
    "orderStatusId" uuid NOT NULL,
    "orderStatusRecord" uuid[] NOT NULL,
    "refundStatus" boolean DEFAULT false,
    "isCancelled" boolean DEFAULT false,
    "cancelledOn" timestamp without time zone,
    "customerRemarks" character varying COLLATE pg_catalog."default",
    "driverId" uuid,
    "driverAccepted" boolean DEFAULT false,
    "acceptedOn" timestamp without time zone,
    "isDelivered" boolean DEFAULT true,
    "deliveredOn" timestamp without time zone,
    "isReturn" boolean DEFAULT true,
    "returnedOn" timestamp without time zone,
    "deliveryOtp" integer,
    "customerReturnRemarks" character varying COLLATE pg_catalog."default",
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "createdBy" uuid,
    "updatedAt" timestamp without time zone,
    "updatedBy" uuid,
    "isActive" boolean DEFAULT true,
    "softDelete" boolean DEFAULT false,
    CONSTRAINT order_return_pkey PRIMARY KEY (id),
    CONSTRAINT "orderReturnCustomer" FOREIGN KEY ("customerId")
        REFERENCES users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT "orderReturnDriver" FOREIGN KEY ("driverId")
        REFERENCES driver (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT "orderReturnStatus" FOREIGN KEY ("orderStatusId")
        REFERENCES order_status (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT orderreturn FOREIGN KEY ("orderId")
        REFERENCES "order" (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
);