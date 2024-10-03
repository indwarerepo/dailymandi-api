CREATE TABLE banner
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name character varying(50),
    "subTitle" character varying(50),
    "categoryId" uuid,
    image character varying,
    remarks character varying(50),
    "isHead" boolean NOT NULL DEFAULT false,
    "displayOrder" bigint,
    "bannerType" "bannerPosition",
    "bannerDisplay" "bannerCategory",
    "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" uuid,
    "updatedAt" timestamp with time zone,
    "updatedBy" uuid,
    "isActive" boolean NOT NULL DEFAULT true,
    "softDelete" boolean NOT NULL DEFAULT false,
    PRIMARY KEY (id),
    CONSTRAINT "bannerCategoryFkey" FOREIGN KEY ("categoryId")
    REFERENCES product_category (id) MATCH SIMPLE
);
