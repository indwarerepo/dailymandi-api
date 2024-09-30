export interface Cart {
  id: string;
  userId: string;
  productId: string;
  cartProdQnt: number;
  // itemType: cartType;

  isActive: boolean;
  softDelete: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: String;
}
export type cartType = 'C' | 'W';

export type IAddCart = Pick<Cart, 'userId' | 'productId' | 'cartProdQnt'>;
export type IUpdateCart = Pick<Cart, 'userId' | 'productId' | 'cartProdQnt'>;

export type IAddWishlist = Pick<Cart, 'userId' | 'productId'>;
export type IUpdateWishlist = Pick<Cart, 'userId' | 'productId'>;
