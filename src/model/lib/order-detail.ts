import { PoolClient, QueryResult } from 'pg';
import joi from 'joi';
import Model from '../query-builder';
import { IAddOrderDetail, IUpdateOrderDetail } from '../../types/order-detail';

class OrderDetail extends Model {
  /**
   *OrderDetail Add
   */
  addOrderDetail = (body: IAddOrderDetail) => {
    const schema = joi.object({
      returnedRemarks: joi.string(),
    });
    return schema.validate(body, { allowUnknown: true });
  };
  /**
   *IAddOrderDetail Update
   */
  updateOrderDetail = (body: IUpdateOrderDetail) => {
    const schema = joi.object({
      returnedRemarks: joi.string(),
    });
    return schema.validate(body, { allowUnknown: true });
  };
}

export default OrderDetail;
