import { PoolClient, QueryResult } from 'pg';
import joi from 'joi';
import Model from '../query-builder';
import { IAddOrderStatus, IUpdateOrderStatus } from '../../types/order-status';

class OrderStatus extends Model {
  /**
   * OrderStatus Add
   */
  addOrderStatus = (body: IAddOrderStatus) => {
    const schema = joi.object({
      statusTitle: joi.string().max(255).required(),
      remarks: joi.string().required(),
    });
    return schema.validate(body);
  };
  /**
   * OrderStatus Update
   */
  updateOrderStatus = (body: IUpdateOrderStatus) => {
    const schema = joi.object({
      statusTitle: joi.string().max(255).required(),
      remarks: joi.string().required(),
    });
    return schema.validate(body);
  };
}

export default OrderStatus;
