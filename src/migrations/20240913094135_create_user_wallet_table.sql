CREATE TABLE user_wallet
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    "userId" uuid NOT NULL,
    "upiId" character varying,
    "walletAmount" integer DEFAULT 0,
    "accountNumber" character varying,
    "ifscCode" character varying,
    "panNumber" character varying,
    "bankName" character varying,
    "bankBranch" character varying,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "createdBy" uuid NOT NULL,
    "updatedAt" timestamp without time zone,
    "updatedBy" uuid,
    "isActive" boolean,
    "softDelete" boolean,
    PRIMARY KEY (id),
    CONSTRAINT "userAccount" FOREIGN KEY ("userId")
        REFERENCES users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
);