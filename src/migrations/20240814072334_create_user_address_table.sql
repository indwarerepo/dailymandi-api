CREATE TABLE user_address
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    "userId" uuid NOT NULL,
    company character varying,
    "firstName" character varying,
    "lastName" character varying,
    "addressOne" character varying,
    "addressTwo" character varying,
    city character varying,
    country character varying,
    pincode uuid NOT NULL,
    phone character varying,
    state character varying,
    addressTitle character varying,
    "isActive" boolean NOT NULL DEFAULT true,
    "softDelete" boolean NOT NULL DEFAULT false,
    "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone,
    PRIMARY KEY (id),
    CONSTRAINT "userAddressFkey" FOREIGN KEY ("userId")
        REFERENCES "users" (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID,
    CONSTRAINT "userPincodeFkey" FOREIGN KEY (pincode)
    REFERENCES public.pincode (id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE
    NOT VALID;    
);
