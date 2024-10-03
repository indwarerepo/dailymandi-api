CREATE TABLE user_transaction
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    "userId" uuid NOT NULL,
    "orderId" uuid,
    "transactionType" boolean DEFAULT false,
    amount double precision,
    remarks character varying,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "isActive" boolean DEFAULT true,
    "softDelete" boolean DEFAULT false,
    PRIMARY KEY (id),
    CONSTRAINT "userTransaction" FOREIGN KEY ("userId")
        REFERENCES users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID,
    CONSTRAINT "UserTransactionOrder" FOREIGN KEY ("orderId")
    REFERENCES orders (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID
);