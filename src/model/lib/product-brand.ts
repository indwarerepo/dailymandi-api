import { PoolClient, QueryResult } from 'pg';
import joi from 'joi';
import Model from '../query-builder';
import { IAddProductBrand, IUpdateProductBrand } from '../../types/product-brand';

class ProductBrand extends Model {
  /**
   * Brand Add
   */
  addProductBrand = (body: IAddProductBrand) => {
    const schema = joi.object({
      name: joi.string().max(255).required(),
      description: joi.string().max(255).allow('').optional(),
      metaTitle: joi.string().allow('').optional(),
      metaDescription: joi.string().allow('').optional(),
    });
    return schema.validate(body);
  };
  /**
   * Brand Update
   */
  updateProductBrand = (body: IUpdateProductBrand) => {
    const schema = joi.object({
      name: joi.string().max(255).required(),
      description: joi.string().max(255).allow('').optional(),
      metaTitle: joi.string().allow('').optional(),
      metaDescription: joi.string().allow('').optional(),
    });
    return schema.validate(body);
  };
}

export default ProductBrand;
