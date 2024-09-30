import { PoolClient, QueryResult } from 'pg';
import joi from 'joi';
import Model from '../query-builder';
import { IAddVariantMaster, IUpdateVariantMaster } from '../../types/variantMaster';

class VariantMaster extends Model {
  /**
   *VariantMaster Add
   */
  addVariantMaster = (body: IAddVariantMaster) => {
    const schema = joi.object({
      variantName: joi.string().max(50).required(),
      description: joi.string().required(),
    });
    return schema.validate(body);
  };
  /**
   *VariantMaster Update
   */
  updateVariantMaster = (body: IUpdateVariantMaster) => {
    const schema = joi.object({
      variantName: joi.string().max(50).required(),
      description: joi.string().required(),
    });
    return schema.validate(body);
  };
}

export default VariantMaster;
