import { PoolClient, QueryResult } from 'pg';
import joi from 'joi';
import Model from '../query-builder';
import { IAddDeliverySlot, IUpdateDeliverySlot } from '../../types/delivery-slot';

class DeliverySlot extends Model {
  /**
   *DeliverySlot Add
   */
  addDeliverySlot = (body: IAddDeliverySlot) => {
    const schema = joi.object({
      timeFrom: joi.date().required(),
      timeTo: joi.date().required(),
      displayContent: joi.string().required(),
    });
    return schema.validate(body, { allowUnknown: true });
  };
  /**
   *DeliverySlot Update
   */
  updateDeliverySlot = (body: IUpdateDeliverySlot) => {
    const schema = joi.object({
      timeFrom: joi.date().required(),
      timeTo: joi.date().required(),
      displayContent: joi.string().required(),
    });
    return schema.validate(body, { allowUnknown: true });
  };
}

export default DeliverySlot;
