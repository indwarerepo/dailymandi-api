import { PoolClient, QueryResult } from 'pg';
import joi from 'joi';
import Model from '../query-builder';
import { IAddTaxMaster, IUpdateTaxMaster } from '../../types/taxMaster';

class TaxMaster extends Model {
  /**
   *TaxMaster Add
   */
  addTaxMaster = (body: IAddTaxMaster) => {
    const schema = joi.object({
      taxHead: joi.string().max(50).required(),
      slab: joi.string().max(50).required(),
      percentage: joi.number().required(),
    });
    return schema.validate(body);
  };
  /**
   *TaxMaster Update
   */
  updateTaxMaster = (body: IUpdateTaxMaster) => {
    const schema = joi.object({
      taxHead: joi.string().max(50).required(),
      slab: joi.string().max(50).required(),
      percentage: joi.number().required(),
    });
    return schema.validate(body);
  };
}

export default TaxMaster;
