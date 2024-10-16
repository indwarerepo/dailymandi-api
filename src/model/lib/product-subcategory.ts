import { PoolClient, QueryResult } from 'pg';
import joi from 'joi';
import Model from '../query-builder';
import { IAddProductSubCategory, IUpdateProductSubCategory } from '../../types/product-subcategory';

class ProductSubCategory extends Model {
  /**
   * Sub Category Add
   */
  addProductSubCategory = (body: IAddProductSubCategory) => {
    const schema = joi.object({
      name: joi.string().max(255).required(),
      categoryId: joi.string().required(),
      coverImage: joi.string().allow('').optional(),
      description: joi.string().max(255).allow('').optional(),
      metaTitle: joi.string().allow('').optional(),
      metaDescription: joi.string().allow('').optional(),
    });
    return schema.validate(body);
  };
  /**
   * Sub Category Update
   */
  updateProductSubCategory = (body: IUpdateProductSubCategory) => {
    const schema = joi.object({
      name: joi.string().max(255).required(),
      categoryId: joi.string().required(),
      coverImage: joi.string().allow('').optional(),
      description: joi.string().max(255).allow('').optional(),
      metaTitle: joi.string().allow('').optional(),
      metaDescription: joi.string().allow('').optional(),
    });
    return schema.validate(body);
  };
}

export default ProductSubCategory;
