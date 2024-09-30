CREATE TABLE IF NOT EXISTS driver
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name character varying COLLATE pg_catalog."default" NOT NULL,
    phone character varying(20) COLLATE pg_catalog."default" NOT NULL,
    email character varying(100) COLLATE pg_catalog."default" NOT NULL,
    password character varying(256) COLLATE pg_catalog."default" NOT NULL,
    "zoneId" uuid[] NOT NULL,
    address text COLLATE pg_catalog."default",
    landmark character varying COLLATE pg_catalog."default",
    "panNo" character varying COLLATE pg_catalog."default",
    "aadharNo" character varying COLLATE pg_catalog."default",
    "licenseNo" character varying COLLATE pg_catalog."default",
    "driverStatus" boolean NOT NULL DEFAULT true,
    "isActive" boolean NOT NULL DEFAULT true,
    "softDelete" boolean NOT NULL DEFAULT false,
    "createdAt" timestamp(3) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" uuid NOT NULL,
    "updatedAt" timestamp(3) without time zone,
    "updatedBy" uuid,
    CONSTRAINT "driver_pkey()" PRIMARY KEY (id)
)
