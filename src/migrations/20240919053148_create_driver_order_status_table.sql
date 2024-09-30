CREATE TABLE driver_order_status
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    "driverId" uuid NOT NULL,
    "orderId" uuid NOT NULL,
    remarks character varying,
    "isActive" boolean DEFAULT true,
    "softDelete" boolean DEFAULT false,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone,
    PRIMARY KEY (id)
        FOREIGN KEY ("driverId")
        REFERENCES public.driver (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID,
    FOREIGN KEY ("orderId")
        REFERENCES public.orders (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
);
);