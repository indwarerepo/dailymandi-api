import { PoolClient, QueryResult } from 'pg';
import joi from 'joi';
import Model from '../query-builder';
import { IAddCart, IUpdateCart, IAddWishlist, IUpdateWishlist } from '../../types/cart';

class Cart extends Model {
  /**
   *Cart Add
   */
  addCart = (body: IAddCart) => {
    const schema = joi.object({
      productId: joi.string().required(),
      cartProdQnt: joi.number().required(),
      //itemType: joi.string().required(),
    });
    return schema.validate(body);
  };

  /**
   *Wishlist Add
   */
  addWishlist = (body: IAddWishlist) => {
    const schema = joi.object({
      productId: joi.string().required(),
      cartProdQnt: joi.number().allow().optional(),
      // itemType: joi.string().required(),
    });
    return schema.validate(body);
  };

  /**
   *Cart Update
   */
  updateCart = (body: IUpdateCart) => {
    const schema = joi.object({
      productId: joi.string().required(),
      cartProdQnt: joi.number().required(),
      // itemType: joi.string().required(),
    });
    return schema.validate(body);
  };

  /**
   *Wishlist Update
   */
  updateWishlist = (body: IUpdateWishlist) => {
    const schema = joi.object({
      productId: joi.string().required(),
      cartProdQnt: joi.number().allow().optional(),
      //itemType: joi.string().required(),
    });
    return schema.validate(body);
  };
}

export default Cart;
