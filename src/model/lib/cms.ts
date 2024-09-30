import { PoolClient, QueryResult } from 'pg';
import joi from 'joi';
import Model from '../query-builder';
import { IAddCms, IUpdateCms } from '../../types/cms';

class Cms extends Model {
  /**
   *Cms Add
   */
  addCms = (body: IAddCms) => {
    const schema = joi.object({
      name: joi.string().max(255).required(),
      cmsKey: joi.string().required(),
      url: joi.string().required(),
      description: joi.string().required(),
      icon: joi.string().allow('').optional(),
      metaTitle: joi.string().allow('').optional(),
      metaDescription: joi.string().allow('').optional(),
    });
    return schema.validate(body);
  };
  /**
   *Cms Update
   */
  updateCms = (body: IUpdateCms) => {
    const schema = joi.object({
      name: joi.string().max(255).required(),
      cmsKey: joi.string().max(255).allow('').optional(),
      url: joi.string().max(255).allow('').optional(),
      description: joi.string().required(),
      icon: joi.string().allow('').optional(),
      metaTitle: joi.string().allow('').optional(),
      metaDescription: joi.string().allow('').optional(),
    });
    return schema.validate(body);
  };
}

export default Cms;
