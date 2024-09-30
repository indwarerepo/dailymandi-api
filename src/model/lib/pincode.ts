import { PoolClient, QueryResult } from 'pg';
import joi from 'joi';
import Model from '../query-builder';
import { IAddPincode, IUpdatePincode } from '../../types/pincode';

class Pincode extends Model {
  /**
   *Pincode Add
   */
  addPincode = (body: IAddPincode) => {
    const schema = joi.object({
      zoneId: joi.string().max(255).required(),
      pincode: joi.number().required(),
      area: joi.string().max(255).allow('').optional(),
      district: joi.string().max(255).allow('').optional(),
    });
    return schema.validate(body);
  };
  /**
   *Pincode Update
   */
  updatePincode = (body: IUpdatePincode) => {
    const schema = joi.object({
      zoneId: joi.string().max(255).required(),
      pincode: joi.number().required(),
      area: joi.string().max(255).allow('').optional(),
      district: joi.string().max(255).allow('').optional(),
    });
    return schema.validate(body);
  };
}

export default Pincode;
