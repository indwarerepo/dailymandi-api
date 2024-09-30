import { PoolClient, QueryResult } from 'pg';
import joi from 'joi';
import Model from '../query-builder';
import { IAddProduct, IUpdateProduct, IAddProductVariant } from '../../types/product';

class Product extends Model {
  /**
   * Product Add
   */
  addProduct = (body: IAddProduct) => {
    const schema = joi.object({
      name: joi.string().required(),
      description: joi.string().required(),
      specification: joi.string().required(),
      manufacturer: joi.string().required(),
      productAttributes: joi.string().allow('').optional(),
      categoryId: joi.string().required(),
      brandId: joi.string().required(),
      productImage: joi.string().required(),
      isNewProduct: joi.boolean().required(),
      isBestSeller: joi.boolean().required(),
      isFeatured: joi.boolean().required(),
      metaTitle: joi.string().allow('').optional(),
      metaDescription: joi.string().allow('').optional(),
      warrantyPolicy: joi.string().allow('').optional(),
      paymentTerm: joi.string().allow('').optional(),

      // Modify to validate an array of objects for productVariant
      productVariant: joi
        .array()
        .items(
          joi.object({
            variantId: joi.string().required(),
            skuNo: joi.string().required(),
            qrCode: joi.string().required(),
            purchaseCost: joi.number().required(),
            mrp: joi.number().required(),
            sellingPrice: joi.number().required(),
            offerPrice: joi.number().required(),
            taxId: joi.string().required(),
            stock: joi.number().required(),
            isReturnable: joi.boolean().required(),
            returnDaysLimit: joi.number().required(),
            productVariantImage: joi.array().required(),
            batchNo: joi.string().required(),
            manufacturingDate: joi.date().required(),
            expiryDate: joi.date().required(),
            remarks: joi.string().required(),
          }),
        )
        .required(),
    });

    return schema.validate(body);
  };

  /**
   * Product Update
   */
  updateProduct = (body: IUpdateProduct) => {
    const schema = joi.object({
      name: joi.string().required(),
      description: joi.string().required(),
      specification: joi.string().required(),
      manufacturer: joi.string().required(),
      productAttributes: joi.string().allow('').optional(),
      categoryId: joi.string().required(),
      brandId: joi.string().required(),
      productImage: joi.string().allow('').optional(),
      isNewProduct: joi.boolean().required(),
      isBestSeller: joi.boolean().required(),
      isFeatured: joi.boolean().required(),
      metaTitle: joi.string().allow('').optional(),
      metaDescription: joi.string().allow('').optional(),
      warrantyPolicy: joi.string().allow('').optional(),
      paymentTerm: joi.string().allow('').optional(),
    });
    return schema.validate(body);
  };

  /**
   * Add Product Variant
   */
  addProductVariant = (body: IAddProductVariant) => {
    const schema = joi.object({
      productId: joi.string().required(),
      variantId: joi.string().required(),
      skuNo: joi.string().required(),
      qrCode: joi.string().required(),
      purchaseCost: joi.number().required(),
      mrp: joi.number().required(),
      sellingPrice: joi.number().required(),
      offerPrice: joi.number().required(),
      taxId: joi.string().required(),
      stock: joi.number().required(),
      isReturnable: joi.boolean().required(),
      returnDaysLimit: joi.number().required(),
      productVariantImage: joi.array().required(),
      batchNo: joi.string().required(),
      manufacturingDate: joi.date().required(),
      expiryDate: joi.date().required(),
      remarks: joi.string().required(),
    });
    return schema.validate(body);
  };

  /**
   * Update Product Variant
   */
  updateProductVariant = (body: IAddProductVariant) => {
    const schema = joi.object({
      productId: joi.string().required(),
      variantId: joi.string().required(),
      skuNo: joi.string().required(),
      qrCode: joi.string().required(),
      purchaseCost: joi.number().required(),
      mrp: joi.number().required(),
      sellingPrice: joi.number().required(),
      offerPrice: joi.number().required(),
      taxId: joi.string().required(),
      stock: joi.number().required(),
      isReturnable: joi.boolean().required(),
      returnDaysLimit: joi.number().required(),
      productVariantImage: joi.array().required(),
      batchNo: joi.string().required(),
      manufacturingDate: joi.date().required(),
      expiryDate: joi.date().required(),
      remarks: joi.string().required(),
    });
    return schema.validate(body);
  };
}

export default Product;
