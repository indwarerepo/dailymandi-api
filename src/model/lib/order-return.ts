import { PoolClient, QueryResult } from 'pg';
import joi from 'joi';
import Model from '../query-builder';
import { IAddOrderReturn } from '../../types/order-return';

class OrderReturn extends Model {
  /**
   *OrderReturn Add
   */
  addOrderReturn = (body: IAddOrderReturn) => {
    const schema = joi.object({
      quantity: joi.number().required(),
      taxAmt: joi.number().optional(),
      totalAmt: joi.number().required(),
    });
    return schema.validate(body, { allowUnknown: true });
  };
}

export default OrderReturn;
