import { PoolClient, QueryResult } from 'pg';
import joi from 'joi';
import Model from '../query-builder';
import { IAddBanner, IUpdateBanner } from '../../types/banner';

class Banner extends Model {
  /**
   * Banner Add
   */
  addBanner = (body: IAddBanner) => {
    const schema = joi.object({
      name: joi.string().max(255).required(),
      subTitle: joi.string().allow('').optional(),
      categoryId: joi.string().required(),
      image: joi.string().allow('').optional(),
      remarks: joi.string().allow('').optional(),
      //isHead: joi.boolean().allow(false).optional(),
      displayOrder: joi.number().allow('').optional(),
      bannerType: joi.number().required(),
      bannerDisplay: joi.string().required(),
    });
    return schema.validate(body);
  };
  /**
   * Banner Update
   */
  updateBanner = (body: IUpdateBanner) => {
    const schema = joi.object({
      name: joi.string().max(255).required(),
      subTitle: joi.string().allow('').optional(),
      categoryId: joi.string().required(),
      image: joi.string().allow('').optional(),
      remarks: joi.string().allow('').optional(),
      //isHead: joi.boolean().allow(false).required(),
      displayOrder: joi.number().allow('').optional(),
      bannerType: joi.number().required(),
      bannerDisplay: joi.string().required(),
    });
    return schema.validate(body);
  };
}

export default Banner;
