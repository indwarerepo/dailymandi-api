import { PoolClient, QueryResult } from 'pg';
import joi from 'joi';
import Model from '../query-builder';
import { IAddZone, IUpdateZone } from '../../types/zone';

class Zone extends Model {
  /**
   *Zone Add
   */
  addZone = (body: IAddZone) => {
    const schema = joi.object({
      zoneName: joi.string().max(255).required(),
      area: joi.string().max(255).allow('').optional(),
      district: joi.string().max(255).allow('').optional(),
      deliveryCharge: joi.number().required(),
    });
    return schema.validate(body);
  };
  /**
   *Zone Update
   */
  updateZone = (body: IUpdateZone) => {
    const schema = joi.object({
      zoneName: joi.string().max(255).required(),
      area: joi.string().max(255).allow('').optional(),
      district: joi.string().max(255).allow('').optional(),
      deliveryCharge: joi.number().required(),
    });
    return schema.validate(body);
  };
}

export default Zone;
