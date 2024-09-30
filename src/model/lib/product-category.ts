import { PoolClient, QueryResult } from 'pg';
import joi from 'joi';
import Model from '../query-builder';
import { IAddProductCategory, IUpdateProductCategory } from '../../types/product-category';

class ProductCategory extends Model {
  /**
   * Category Add
   */
  addProductCategory = (body: IAddProductCategory) => {
    const schema = joi.object({
      name: joi.string().max(255).required(),
      coverImage: joi.string().allow('').optional(),
      coverVideo: joi.string().max(255).allow('').optional(),
      description: joi.string().max(255).allow('').optional(),
      displayOrder: joi.number().required(),
      isFeatured: joi.boolean().allow('').optional(),
      isTopMenu: joi.boolean().allow('').optional(),
      metaTitle: joi.string().allow('').optional(),
      metaDescription: joi.string().allow('').optional(),
    });
    return schema.validate(body);
  };
  /**
   * Category Update
   */
  updateProductCategory = (body: IUpdateProductCategory) => {
    const schema = joi.object({
      name: joi.string().max(255).required(),
      coverImage: joi.string().allow('').optional(),
      coverVideo: joi.string().max(255).allow('').optional(),
      description: joi.string().max(255).allow('').optional(),
      displayOrder: joi.number().required(),
      isFeatured: joi.boolean().allow('').optional(),
      isTopMenu: joi.boolean().allow('').optional(),
      metaTitle: joi.string().allow('').optional(),
      metaDescription: joi.string().allow('').optional(),
    });
    return schema.validate(body);
  };
}

export default ProductCategory;
