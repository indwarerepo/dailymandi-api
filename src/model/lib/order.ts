import { PoolClient, QueryResult } from 'pg';
import joi from 'joi';
import Model from '../query-builder';
import { IAddOrder } from '../../types/order';

class Order extends Model {
  /**
   *Order Add
   */
  addOrder = (body: IAddOrder) => {
    const schema = joi.object({
      addressId: joi.string().required(),
      deliverySlotId: joi.string().required(),
      couponId: joi.string().allow(''),
      isWalletUsed: joi.boolean().required(),
      cartList: joi.array().items(joi.string()),
    });
    return schema.validate(body);
  };
}

export default Order;
