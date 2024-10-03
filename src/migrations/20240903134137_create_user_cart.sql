CREATE TABLE user_cart
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    "userId" uuid,
    "productId" uuid,
    "cartProdQnt" integer,
    "itemType" "cartType" NOT NULL,
    "isActive" boolean NOT NULL DEFAULT true,
    "softDelete" boolean NOT NULL DEFAULT false,
    "createdBy" uuid,
    "createdAt" timestamp without time zone,
    "updatedBy" uuid,
    "updatedAt" timestamp without time zone,
    PRIMARY KEY (id),
    CONSTRAINT "productCartFkey" FOREIGN KEY ("productId")
    REFERENCES public.product_variant (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID,
    CONSTRAINT "userCartFkey" FOREIGN KEY ("userId")
    REFERENCES public.users (id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE
    NOT VALID
);
