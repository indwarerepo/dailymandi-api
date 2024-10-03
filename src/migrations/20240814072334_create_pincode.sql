CREATE TABLE pincode
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    "zoneId" uuid NOT NULL,
    pincode integer,
    area character varying(500),
    district character varying(500),
    "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" uuid NOT NULL,
    "updatedAt" timestamp without time zone,
    "updatedBy" uuid,
    "isActive" boolean NOT NULL DEFAULT true,
    "softDelete" boolean NOT NULL DEFAULT false,
    PRIMARY KEY (id),
    CONSTRAINT "zonePincodeFkey" FOREIGN KEY ("zoneId")
    REFERENCES "zone" (id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE
    NOT VALID
);
