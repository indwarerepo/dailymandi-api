CREATE TABLE menu
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    title character varying NOT NULL,
    url character varying,
    icon character varying,
    category bigint,
    priority bigint,
    "createdDate" time without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" uuid NOT NULL,
    "modifiedDate" time without time zone,
    "modifiedBy" uuid,
    "isActive" boolean NOT NULL DEFAULT true,
    "softDelete" boolean NOT NULL DEFAULT false,
    PRIMARY KEY (id)
);
