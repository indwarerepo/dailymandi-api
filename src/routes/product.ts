import { Request, Response, Router } from 'express';
import { ICustomRequest } from '../types/common';
import { HttpStatusCode } from '../helpers/http-status-codes';
// import config from 'config';
// import moment from 'moment';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import xlsx from 'xlsx';
// const { PDFDocument } = require('pdf-lib');
import { imageUpload } from '../helpers/util';
import asyncHandler from '../middlewares/asyncHandler';
import CustomError from '../middlewares/customError';
import { customer } from '../middlewares/customer';
import { auth } from '../middlewares/auth';
import { isAdmin } from '../middlewares/admin';
import pool from '../helpers/connection';
const router = Router();

import {
  ProductModel,
  ProductVariantModel,
  ProductInventoryModel,
  ProductInventoryHistoryModel,
  ProductCategoryModel,
  CartMasterModel,
  TaxMasterModel,
  VariantMasterModel,
  ProductBrandModel,
} from '../model/models';
import { IAddProduct, IUpdateProduct, IAddProductVariant } from '../types/product';

// Multer Upload Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const baseUrl = path.dirname(__dirname);
    cb(null, baseUrl + '/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });

/**
 * Create new product
 */
router.post(
  '/',
  [auth, isAdmin],
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as IAddProduct;

    // Validate request body
    const { error } = ProductModel().addProduct(body);
    if (error) throw new CustomError(error?.message, HttpStatusCode.BadRequest);

    // Check if product already exists
    const isExist = await ProductModel().where({ name: body.name, softDelete: false }).findOne();
    if (isExist) throw new CustomError('Product already exists.', HttpStatusCode.Conflict);

    if (body.productImage) {
      const fileUpload = await imageUpload(body.productImage, `productcontainer`);
      if (fileUpload) {
        body.productImage = fileUpload; // Replace base64 with image URL
      } else {
        return res.status(HttpStatusCode.UnsupportedMediaType).send({
          statusCode: HttpStatusCode.UnsupportedMediaType,
          message: 'Only png, jpg & jpeg file types supported.',
        });
      }
    }

    // Create the main product record
    let product = await ProductModel()
      .select('id, name')
      .createOne({
        name: body.name,
        description: body.description,
        specification: body.specification,
        manufacturer: body.manufacturer,
        productMethod: true,
        categoryId: body.categoryId,
        brandId: body.brandId,
        productImage: body.productImage,
        isNewProduct: body.isNewProduct,
        isBestSeller: body.isBestSeller,
        isFeatured: body.isFeatured,
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
        warrantyPolicy: body.warrantyPolicy,
        paymentTerm: body.paymentTerm,
        createdBy: (req as any).user.id,
      });

    if (product) {
      const productId = product.id;
      let imgUpload;
      let imgUploadArr = [];
      // Insert product variants
      if (body.productVariant && Array.isArray(body.productVariant)) {
        for (const variant of body.productVariant) {
          const imgUploadArr: string[] = []; // Initialize for each variant

          // Image upload handling
          if (variant.productVariantImage && variant.productVariantImage.length > 0) {
            for (const variantImg of variant.productVariantImage) {
              if (variantImg) {
                const fileUpload = await imageUpload(variantImg, 'productcontainer');
                if (fileUpload) {
                  imgUploadArr.push(fileUpload); // Collect uploaded URLs
                } else {
                  return res.status(HttpStatusCode.UnsupportedMediaType).send({
                    statusCode: HttpStatusCode.UnsupportedMediaType,
                    message: 'Only png, jpg & jpeg file types supported.',
                  });
                }
              }
            }
          }

          // Insert product variant
          const productVarientId = await ProductVariantModel()
            .select('id')
            .createOne({
              productId: productId, // Foreign key to the Product table
              variantId: variant.variantId,
              categoryId: body.categoryId,
              skuNo: variant.skuNo,
              qrCode: variant.qrCode,
              taxId: variant.taxId,
              offerPrice: variant.offerPrice,
              isReturnable: variant.isReturnable,
              returnDaysLimit: variant.returnDaysLimit,
              productVariantImage: imgUploadArr, // Uploaded images
              purchaseCost: variant.purchaseCost,
              mrp: variant.mrp,
              sellingPrice: variant.sellingPrice,
              stock: variant.stock,
              createdBy: (req as any).user.id,
            });

          // Insert product inventory
          if (productVarientId) {
            await ProductInventoryModel()
              .select('id')
              .createOne({
                productId: productId, // Foreign key to the Product table
                productVariantId: productVarientId.id,
                skuNo: variant.skuNo,
                mrp: variant.mrp,
                totalStock: variant.stock,
                costPrice: variant.purchaseCost,
                salesPrice: variant.sellingPrice,
                batchNo: variant.batchNo,
                manufacturingDate: variant.manufacturingDate,
                expiryDate: variant.expiryDate,
                methodFlag: false,
                availableQnt: variant.stock,
                createdBy: (req as any).user.id,
                inventoryStage: 'Running',
                inventorySerial: 0,
              });

            // Insert product inventory history
            await ProductInventoryHistoryModel().createOne({
              productId: productId, // Foreign key to the Product table
              productVariantId: productVarientId.id,
              batchId: variant.batchNo,
              previousStock: variant.stock,
              currentStock: variant.stock,
              changeStock: 0,
              remarks: variant.remarks,
              createdBy: (req as any).user.id,
            });
          }
        }
      }
    }

    res.status(HttpStatusCode.Created).send({
      statusCode: HttpStatusCode.Created,
      message: 'New product created successfully.',
      data: product,
    });
  }),
);

/**
 * Create new product variant
 */
router.post(
  '/create-varinat/',
  [auth, isAdmin],
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as IAddProductVariant;

    // Validate request body
    const { error } = ProductModel().addProductVariant(body);
    if (error) throw new CustomError(error?.message, HttpStatusCode.BadRequest);

    // Check if product already exists
    const isExist = await ProductVariantModel()
      .where({ productId: body.productId, variantId: body.variantId, softDelete: false })
      .findOne();
    if (isExist) throw new CustomError('Product already exists.', HttpStatusCode.Conflict);

    const productId = body.productId;

    const product = await ProductModel()
      .select('categoryId')
      .where({ id: body.productId, softDelete: false })
      .findOne();

    // Insert product variants image
    //console.log(product);
    let imgUploadArr = [];
    if (body.productVariantImage && body.productVariantImage.length > 0) {
      for (const variantImg of body.productVariantImage) {
        if (variantImg) {
          const fileUpload = await imageUpload(variantImg, 'productcontainer');
          if (fileUpload) {
            imgUploadArr.push(fileUpload); // Collect uploaded URLs
          } else {
            return res.status(HttpStatusCode.UnsupportedMediaType).send({
              statusCode: HttpStatusCode.UnsupportedMediaType,
              message: 'Only png, jpg & jpeg file types supported.',
            });
          }
        }
      }
    }

    //product variant
    let productVarientId = await ProductVariantModel()
      .select('id')
      .createOne({
        productId: productId, // Foreign key to the Product table
        variantId: body.variantId,
        categoryId: product.categoryId,
        skuNo: body.skuNo,
        qrCode: body.qrCode,
        taxId: body.taxId,
        offerPrice: body.offerPrice,
        isReturnable: body.isReturnable,
        returnDaysLimit: body.returnDaysLimit,
        productVariantImage: imgUploadArr,
        purchaseCost: body.purchaseCost,
        mrp: body.mrp,
        sellingPrice: body.sellingPrice,
        stock: body.stock,
        createdBy: (req as any).user.id,
      });
    // console.log(productVarientId);
    // return;
    //product inventory
    if (productVarientId) {
      let productInventoryId = await ProductInventoryModel()
        .select('id')
        .createOne({
          productId: productId, // Foreign key to the Product table
          productVariantId: productVarientId.id,
          skuNo: body.skuNo,
          mrp: body.mrp,
          totalStock: body.stock,
          costPrice: body.purchaseCost,
          salesPrice: body.sellingPrice,
          batchNo: body.batchNo,
          manufacturingDate: body.manufacturingDate,
          expiryDate: body.expiryDate,
          methodFlag: false,
          availableQnt: body.stock,
          createdBy: (req as any).user.id,
        });
    }

    //product inventory history
    if (productVarientId) {
      let productInventoryhistoryId = await ProductInventoryHistoryModel().createOne({
        productId: productId, // Foreign key to the Product table
        productVariantId: productVarientId.id,
        batchId: body.batchNo,
        previousStock: body.stock,
        currentStock: body.stock,
        changeStock: 0,
        remarks: body.remarks,
        createdBy: (req as any).user.id,
      });
    }

    res.status(HttpStatusCode.Created).send({
      statusCode: HttpStatusCode.Created,
      message: 'New product variant created successfully.',
      data: productVarientId,
    });
  }),
);

/**
 * Update product variant
 */
router.put(
  '/update-variant/:id',
  [auth, isAdmin],
  asyncHandler(async (req: Request, res: Response) => {
    const variantId = req.params.id;
    const body = req.body as IAddProductVariant;

    // Validate request body
    const { error } = ProductModel().updateProductVariant(body);
    if (error) throw new CustomError(error?.message, HttpStatusCode.BadRequest);

    // Check if the product variant exists
    const productVariant = await ProductVariantModel()
      .where({ id: variantId, softDelete: false })
      .findOne();

    if (!productVariant)
      throw new CustomError('Product variant not found.', HttpStatusCode.NotFound);

    // Update product variant images (if provided)
    let imgUploadArr = productVariant.productVariantImage || [];
    if (body.productVariantImage && body.productVariantImage.length > 0) {
      imgUploadArr = [];
      for (const variantImg of body.productVariantImage) {
        if (variantImg) {
          const fileUpload = await imageUpload(variantImg, 'productcontainer');
          if (fileUpload) {
            imgUploadArr.push(fileUpload); // Collect uploaded URLs
          } else {
            return res.status(HttpStatusCode.UnsupportedMediaType).send({
              statusCode: HttpStatusCode.UnsupportedMediaType,
              message: 'Only png, jpg & jpeg file types supported.',
            });
          }
        }
      }
    } else {
      imgUploadArr = productVariant.productVariantImage;
    }

    // Update product variant details
    await ProductVariantModel()
      .where({ id: variantId })
      .updateOne({
        skuNo: body.skuNo,
        qrCode: body.qrCode,
        taxId: body.taxId,
        offerPrice: body.offerPrice,
        isReturnable: body.isReturnable,
        returnDaysLimit: body.returnDaysLimit,
        productVariantImage: imgUploadArr,
        purchaseCost: body.purchaseCost,
        mrp: body.mrp,
        sellingPrice: body.sellingPrice,
        stock: body.stock,
        updatedBy: (req as any).user.id,
      });

    // Update product inventory (if necessary)
    let productInventory = await ProductInventoryModel()
      .where({ productVariantId: variantId, batchNo: body.batchNo, softDelete: false })
      .findOne();

    if (productInventory) {
      await ProductInventoryModel()
        .where({ productVariantId: variantId })
        .updateOne({
          skuNo: body.skuNo,
          mrp: body.mrp,
          totalStock: body.stock,
          costPrice: body.purchaseCost,
          salesPrice: body.sellingPrice,
          batchNo: body.batchNo,
          manufacturingDate: body.manufacturingDate,
          expiryDate: body.expiryDate,
          availableQnt: body.stock,
          updatedBy: (req as any).user.id,
        });
    } else {
      await ProductInventoryModel().createOne({
        skuNo: body.skuNo,
        mrp: body.mrp,
        totalStock: body.stock,
        costPrice: body.purchaseCost,
        salesPrice: body.sellingPrice,
        batchNo: body.batchNo,
        manufacturingDate: body.manufacturingDate,
        expiryDate: body.expiryDate,
        availableQnt: body.stock,
        updatedBy: (req as any).user.id,
      });
    }

    // Update product inventory history
    await ProductInventoryHistoryModel().createOne({
      productId: productVariant.productId, // Foreign key to the Product table
      productVariantId: variantId,
      batchId: body.batchNo,
      previousStock: productVariant.stock,
      currentStock: body.stock,
      changeStock: body.stock - productVariant.stock,
      remarks: body.remarks,
      createdBy: (req as any).user.id,
    });

    res.status(HttpStatusCode.Created).send({
      statusCode: HttpStatusCode.Created,
      message: 'Product variant updated successfully.',
      data: { variantId },
    });
  }),
);

/**
 * Get all product for admin
 */
router.get(
  '/',
  [auth, isAdmin],
  asyncHandler(async (req: Request, res: Response) => {
    let pageIndex: number = parseInt((req as any).query.pageNo);
    let pageSize: number = parseInt((req as any).query.pageLimit);
    let sortBy: string = (req as any).query.sortBy;
    let sortOrder: string = (req as any).query.sortOrder;

    const whereClause = { softDelete: false };
    const records = await ProductModel()
      .select(
        'id, name, description, specification, manufacturer, productAttributes, productImage, categoryId, isActive, createdAt, createdBy, isBestSeller, isNewProduct, isFeatured, metaTitle, metaDescription, warrantyPolicy, paymentTerm,brandId',
      )
      .populate('product_category', 'id,name')
      .populate('product_brand', 'id,name')
      .where(whereClause)
      .pagination(pageIndex, pageSize)
      .sort(sortBy, sortOrder)
      .find();
    if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);

    const mappedRecords = await Promise.all(
      records.map(async (record: any) => {
        const { product_category, product_brand, ...rest } = record;

        // Fetch the count of variants for each product
        const countVariant = await ProductVariantModel()
          .where({ productId: record.id })
          .countDocuments();

        return {
          ...rest,
          productCategory: product_category, // Map DB field to your desired name
          brand: product_brand,
          variantCount: countVariant, // Add variant count to the response
        };
      }),
    );

    const count = await ProductModel().where(whereClause).countDocuments();

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      count,
      data: mappedRecords,
    });
  }),
);

/**
 * Get all product for web
 */
router.get(
  '/web',
  asyncHandler(async (req: Request, res: Response) => {
    let pageIndex: number = parseInt((req as any).query.pageNo);
    let pageSize: number = parseInt((req as any).query.pageLimit);
    let sortBy: string = (req as any).query.sortBy;
    let sortOrder = '1';
    if (sortBy) {
      if (sortBy == 'name') {
        sortOrder = '1';
      } else {
        sortOrder = '-1';
      }
    }
    //let sortOrder: string = (req as any).query.sortOrder;
    let customerId = req.query.customerId;
    let whereClause: { [key: string]: any } = {
      softDelete: false,
      isActive: true,
    };

    // Check if `categoryId` is present in the route params
    if (req.query.categoryId) {
      whereClause['categoryId'] = req.query.categoryId;
    }

    if (req.query.brandId) {
      whereClause['brandId'] = req.query.brandId;
    }
    const records = await ProductModel()
      .select(
        'id, name, description, specification, manufacturer, productAttributes, productImage, categoryId, isNewProduct, isBestSeller, isFeatured, metaTitle, metaDescription, warrantyPolicy, paymentTerm,brandId,createdAt',
      )
      .populate('product_category', 'id,name')
      .populate('product_brand', 'id,name')
      .where(whereClause)
      .pagination(pageIndex, pageSize)
      .sort(sortBy, sortOrder)
      .find();

    if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);

    const mappedRecords = await Promise.all(
      records.map(async (record: any) => {
        const { product_category, product_brand, ...rest } = record;

        // Fetch the count of variants for each product
        const countVariant = await ProductVariantModel()
          .where({ productId: record.id, softDelete: false, isActive: true })
          .countDocuments();

        const productVariant = await ProductVariantModel()
          .select(
            'id,productId,categoryId,variantId,skuNo,qrCode,purchaseCost,mrp,sellingPrice,offerPrice,taxId,stock,isReturnable,returnDaysLimit,productVariantImage',
          )
          .populate('variant_master', 'id,variantName')
          .where({ productId: record.id, softDelete: false, isActive: true })
          .find();

        // Loop through each variant and check for cart and wishlist status
        const updatedProductVariants = await Promise.all(
          productVariant.map(async (variant: any) => {
            let isCart = false;
            let isWishlist = false;
            let cartProdQnt = 0;
            if (customerId) {
              const cartWhereClause = {
                softDelete: false,
                itemType: 'C', // 'C' for cart items
                productId: variant['id'],
                userId: customerId,
              };
              const cart = await CartMasterModel()
                .select('id,cartProdQnt')
                .where(cartWhereClause)
                .find();

              const wishlistWhereClause = {
                softDelete: false,
                itemType: 'W', // 'W' for wishlist items
                productId: variant['id'],
                userId: customerId,
              };
              const wishlist = await CartMasterModel()
                .select('id,cartProdQnt')
                .where(wishlistWhereClause)
                .find();

              // Set flags if cart or wishlist items are found
              if (cart && cart.length > 0) {
                isCart = true;
                cartProdQnt = cart[0].cartProdQnt;
              }
              if (wishlist && wishlist.length > 0) {
                isWishlist = true;
              }
            }

            // Return the updated variant with the isCart and isWishlist flags
            const { variant_master, ...otherVariantFields } = variant;
            return {
              ...otherVariantFields,
              variantMaster: variant_master, // Map 'variant_master' to 'variantMaster'
              isCart: isCart,
              isWishlist: isWishlist,
              cartProdQnt: cartProdQnt,
            };
          }),
        );

        return {
          ...rest,
          productCategory: product_category, // Map DB field to your desired name
          productBrand: product_brand,
          variantCount: countVariant, // Add variant count to the response
          productVariant: updatedProductVariants, // Use the updated productVariant array
        };
      }),
    );

    const count = await ProductModel().where(whereClause).countDocuments();

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      count,
      data: mappedRecords,
    });
  }),
);

/**
 * Get all featured  product for web
 */
router.get(
  '/web/featuredProduct/',
  asyncHandler(async (req: Request, res: Response) => {
    let sortBy: string = (req as any).query.sortBy;
    let sortOrder: string = (req as any).query.sortOrder;
    let customerId = req.query.customerId;
    let whereClause: { [key: string]: any } = {
      softDelete: false,
      isActive: true,
      isFeatured: true,
    };

    const records = await ProductModel()
      .select(
        'id, name, description, specification, manufacturer, productAttributes, productImage, categoryId',
      )
      .populate('product_category', 'id,name')
      .where(whereClause)
      .pagination(0, 6)
      .sort(sortBy, sortOrder)
      .find();

    if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);

    const mappedRecords = await Promise.all(
      records.map(async (record: any) => {
        const { product_category, ...rest } = record;

        // Fetch the count of variants for each product
        const countVariant = await ProductVariantModel()
          .where({ productId: record.id, softDelete: false, isActive: true })
          .countDocuments();

        const productVariant = await ProductVariantModel()
          .select(
            'id,productId,categoryId,variantId,skuNo,qrCode,purchaseCost,mrp,sellingPrice,offerPrice,taxId,stock,isReturnable,returnDaysLimit,productVariantImage',
          )
          .populate('variant_master', 'id,variantName')
          .where({ productId: record.id, softDelete: false, isActive: true })
          .find();

        // Loop through each variant and check for cart and wishlist status
        const updatedProductVariants = await Promise.all(
          productVariant.map(async (variant: any) => {
            let isCart = false;
            let isWishlist = false;
            let cartProdQnt = 0;
            if (customerId) {
              const cartWhereClause = {
                softDelete: false,
                itemType: 'C', // 'C' for cart items
                productId: variant['id'],
                userId: customerId,
              };
              const cart = await CartMasterModel()
                .select('id,cartProdQnt')
                .where(cartWhereClause)
                .find();

              const wishlistWhereClause = {
                softDelete: false,
                itemType: 'W', // 'W' for wishlist items
                productId: variant['id'],
                userId: customerId,
              };
              const wishlist = await CartMasterModel()
                .select('id,cartProdQnt')
                .where(wishlistWhereClause)
                .find();

              // Set flags if cart or wishlist items are found
              if (cart && cart.length > 0) {
                isCart = true;
                cartProdQnt = cart[0].cartProdQnt;
              }
              if (wishlist && wishlist.length > 0) {
                isWishlist = true;
              }
            }

            // Return the updated variant with the isCart and isWishlist flags
            const { variant_master, ...otherVariantFields } = variant;
            return {
              ...otherVariantFields,
              variantMaster: variant_master, // Map 'variant_master' to 'variantMaster'
              isCart: isCart,
              isWishlist: isWishlist,
              cartProdQnt: cartProdQnt,
            };
          }),
        );

        return {
          ...rest,
          productCategory: product_category, // Map DB field to your desired name
          variantCount: countVariant, // Add variant count to the response
          productVariant: updatedProductVariants, // Use the updated productVariant array
        };
      }),
    );

    const count = records.length;

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      count,
      data: mappedRecords,
    });
  }),
);

/**
 * Get all new  product for web
 */
router.get(
  '/web/newProduct/',
  asyncHandler(async (req: Request, res: Response) => {
    let sortBy: string = (req as any).query.sortBy;
    let sortOrder: string = (req as any).query.sortOrder;
    let customerId = req.query.customerId;
    let whereClause: { [key: string]: any } = {
      softDelete: false,
      isActive: true,
      isNewProduct: true,
    };

    const records = await ProductModel()
      .select(
        'id, name, description, specification, manufacturer, productAttributes, productImage, categoryId',
      )
      .populate('product_category', 'id,name')
      .where(whereClause)
      .pagination(0, 8)
      .sort(sortBy, sortOrder)
      .find();
    // console.log(records);
    if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);

    const mappedRecords = await Promise.all(
      records.map(async (record: any) => {
        const { product_category, ...rest } = record;

        // Fetch the count of variants for each product
        const countVariant = await ProductVariantModel()
          .where({ productId: record.id, softDelete: false, isActive: true })
          .countDocuments();

        const productVariant = await ProductVariantModel()
          .select(
            'id,productId,categoryId,variantId,skuNo,qrCode,purchaseCost,mrp,sellingPrice,offerPrice,taxId,stock,isReturnable,returnDaysLimit,productVariantImage',
          )
          .populate('variant_master', 'id,variantName')
          .where({ productId: record.id, softDelete: false, isActive: true })
          .find();

        // Loop through each variant and check for cart and wishlist status
        const updatedProductVariants = await Promise.all(
          productVariant.map(async (variant: any) => {
            let isCart = false;
            let isWishlist = false;
            let cartProdQnt = 0;
            if (customerId) {
              const cartWhereClause = {
                softDelete: false,
                itemType: 'C', // 'C' for cart items
                productId: variant['id'],
                userId: customerId,
              };
              const cart = await CartMasterModel()
                .select('id,cartProdQnt')
                .where(cartWhereClause)
                .find();

              const wishlistWhereClause = {
                softDelete: false,
                itemType: 'W', // 'W' for wishlist items
                productId: variant['id'],
                userId: customerId,
              };
              const wishlist = await CartMasterModel()
                .select('id,cartProdQnt')
                .where(wishlistWhereClause)
                .find();

              // Set flags if cart or wishlist items are found
              if (cart && cart.length > 0) {
                isCart = true;
                cartProdQnt = cart[0].cartProdQnt;
              }
              if (wishlist && wishlist.length > 0) {
                isWishlist = true;
              }
            }

            // Return the updated variant with the isCart and isWishlist flags
            const { variant_master, ...otherVariantFields } = variant;
            return {
              ...otherVariantFields,
              variantMaster: variant_master, // Map 'variant_master' to 'variantMaster'
              isCart: isCart,
              isWishlist: isWishlist,
              cartProdQnt: cartProdQnt,
            };
          }),
        );

        return {
          ...rest,
          productCategory: product_category, // Map DB field to your desired name
          variantCount: countVariant, // Add variant count to the response
          productVariant: updatedProductVariants, // Use the updated productVariant array
        };
      }),
    );

    const count = 8;

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      count,
      data: mappedRecords,
    });
  }),
);

router.get(
  '/web/newProduct/v1/',
  asyncHandler(async (req: Request, res: Response) => {
    let pageIndex: number = parseInt((req as any).query.pageNo);
    let pageSize: number = parseInt((req as any).query.pageLimit);
    let sortBy: string = (req as any).query.sortBy;
    let sortOrder: string = (req as any).query.sortOrder;

    const whereClause = { softDelete: false, isActive: true, isNewProduct: true };
    const records = await ProductModel()
      .select(
        'id, name, description, specification, manufacturer, productAttributes, productImage, categoryId, isActive, createdAt, createdBy',
      )
      .populate('product_category', 'id,name')
      .where(whereClause)
      .pagination(pageIndex, pageSize)
      .sort(sortBy, sortOrder)
      .find();
    if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);

    const mappedRecords = await Promise.all(
      records.map(async (record: any) => {
        const { product_category, ...rest } = record;

        // Fetch the count of variants for each product
        const countVariant = await ProductVariantModel()
          .where({ productId: record.id, softDelete: false, isActive: true })
          .countDocuments();

        return {
          ...rest,
          productCategory: product_category, // Map DB field to your desired name
          variantCount: countVariant, // Add variant count to the response
        };
      }),
    );

    const count = await ProductModel().where(whereClause).countDocuments();

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      count,
      data: mappedRecords,
    });
  }),
);

/**
 * Get all related product for web
 */
router.get(
  '/web/related-product/',
  asyncHandler(async (req: Request, res: Response) => {
    let sortBy: string = (req as any).query.sortBy;
    let sortOrder: string = (req as any).query.sortOrder;
    let customerId = req.query.customerId;
    let productId = req.query.productId;
    let categoryId = req.query.categoryId;
    const limit = 10;
    const records = await pool.query(
      `SELECT id, name, description, "specification", "manufacturer", 
              "productAttributes", "productImage", "categoryId" 
       FROM product 
       WHERE id != $1 
       AND "softDelete" = false 
       AND "categoryId" = $2
       LIMIT $3`,
      [productId, categoryId, limit], // Array of parameter values
    );
    // const records = result.rows[0];
    const recordsArray = records.rows || [];
    //console.log(records);
    // return;
    // const records = await ProductModel()
    //   .select(
    //     'id, name, description, specification, manufacturer, productAttributes, productImage, categoryId',
    //   )
    //   .populate('product_category', 'id,name')
    //   .where(whereClause)
    //   .pagination(0, 8)
    //   .sort(sortBy, sortOrder)
    //   .find();
    // console.log(records);
    if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);

    const mappedRecords = await Promise.all(
      recordsArray.map(async (record: any) => {
        const { product_category, ...rest } = record;

        // Fetch the count of variants for each product
        const countVariantResult = await pool.query(
          `SELECT COUNT(*) 
           FROM product_variant 
           WHERE "productId" = $1 AND "softDelete" = false AND "isActive" = true`,
          [record.id],
        );
        const countVariant = countVariantResult.rows[0].count;

        // Fetch the product variants and their associated variant master details
        const productVariantResult = await pool.query(
          `SELECT pv.id, pv."productId", pv."categoryId", pv."variantId", pv."skuNo", pv."qrCode", 
                  pv."purchaseCost", pv."mrp", pv."sellingPrice", pv."offerPrice", pv."taxId", 
                  pv."stock", pv."isReturnable", pv."returnDaysLimit", pv."productVariantImage", 
                  vm.id as "variantMasterId", vm."variantName" 
           FROM product_variant pv 
           LEFT JOIN variant_master vm ON pv."variantId" = vm.id 
           WHERE pv."productId" = $1 AND pv."softDelete" = false AND pv."isActive" = true`,
          [record.id],
        );
        const productVariants = productVariantResult.rows;

        // Loop through each variant and check for cart and wishlist status
        const updatedProductVariants = await Promise.all(
          productVariants.map(async (variant: any) => {
            let isCart = false;
            let isWishlist = false;
            let cartProdQnt = 0;

            if (customerId) {
              // Check if the variant is in the cart
              const cartResult = await pool.query(
                `SELECT id, "cartProdQnt" 
                 FROM user_cart 
                 WHERE "softDelete" = false AND "itemType" = 'C' 
                 AND "productId" = $1 AND "userId" = $2`,
                [variant.id, customerId],
              );
              const cart = cartResult.rows;

              // Check if the variant is in the wishlist
              const wishlistResult = await pool.query(
                `SELECT id 
                 FROM user_cart 
                 WHERE "softDelete" = false AND "itemType" = 'W' 
                 AND "productId" = $1 AND "userId" = $2`,
                [variant.id, customerId],
              );
              const wishlist = wishlistResult.rows;

              // Set flags if cart or wishlist items are found
              if (cart.length > 0) {
                isCart = true;
                cartProdQnt = cart[0].cartProdQnt;
              }
              if (wishlist.length > 0) {
                isWishlist = true;
              }
            }

            return {
              ...variant,
              variantMaster: {
                id: variant.variantMasterId,
                variantName: variant.variantName,
              },
              isCart: isCart,
              isWishlist: isWishlist,
              cartProdQnt: cartProdQnt,
            };
          }),
        );

        return {
          ...rest,
          productCategory: product_category,
          variantCount: countVariant, // Add variant count to the response
          productVariant: updatedProductVariants, // Use the updated productVariant array
        };
      }),
    );

    const count = recordsArray.length;

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      count,
      data: mappedRecords,
    });
  }),
);

/**
 * Get all product for web by id
 */
router.get(
  '/web/byid/:id',
  asyncHandler(async (req: Request, res: Response) => {
    let pageIndex: number = parseInt((req as any).query.pageNo);
    let pageSize: number = parseInt((req as any).query.pageLimit);
    let sortBy: string = (req as any).query.sortBy;
    let sortOrder: string = (req as any).query.sortOrder;
    let customerId = req.query.customerId;
    let whereClause: { [key: string]: any } = {
      softDelete: false,
      isActive: true,
    };

    // Check if `categoryId` is present in the route params
    if (req.query.categoryId) {
      whereClause['categoryId'] = req.query.categoryId;
    }
    whereClause['id'] = req.params.id;
    const records = await ProductModel()
      .select(
        'id, name, description, specification, warrantyPolicy,paymentTerm, manufacturer, productAttributes, productImage, categoryId',
      )
      .populate('product_category', 'id,name')
      .where(whereClause)
      .pagination(pageIndex, pageSize)
      .sort(sortBy, sortOrder)
      .find();

    if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);

    const mappedRecords = await Promise.all(
      records.map(async (record: any) => {
        const { product_category, ...rest } = record;

        // Fetch the count of variants for each product
        const countVariant = await ProductVariantModel()
          .where({ productId: record.id, softDelete: false, isActive: true })
          .countDocuments();

        const productVariant = await ProductVariantModel()
          .select(
            'id,productId,categoryId,variantId,skuNo,qrCode,purchaseCost,mrp,sellingPrice,offerPrice,taxId,stock,isReturnable,returnDaysLimit,productVariantImage',
          )
          .populate('variant_master', 'id,variantName')
          .where({ productId: record.id, softDelete: false, isActive: true })
          .find();

        // Loop through each variant and check for cart and wishlist status
        const updatedProductVariants = await Promise.all(
          productVariant.map(async (variant: any) => {
            let isCart = false;
            let isWishlist = false;
            let cartProdQnt = 0;
            if (customerId) {
              const cartWhereClause = {
                softDelete: false,
                itemType: 'C', // 'C' for cart items
                productId: variant['id'],
                userId: customerId,
              };
              const cart = await CartMasterModel()
                .select('id,cartProdQnt')
                .where(cartWhereClause)
                .find();

              const wishlistWhereClause = {
                softDelete: false,
                itemType: 'W', // 'W' for wishlist items
                productId: variant['id'],
                userId: customerId,
              };
              const wishlist = await CartMasterModel()
                .select('id,cartProdQnt')
                .where(wishlistWhereClause)
                .find();

              // Set flags if cart or wishlist items are found
              if (cart && cart.length > 0) {
                isCart = true;
                cartProdQnt = cart[0].cartProdQnt;
              }
              if (wishlist && wishlist.length > 0) {
                isWishlist = true;
              }
            }

            // Return the updated variant with the isCart and isWishlist flags
            const { variant_master, ...otherVariantFields } = variant;
            return {
              ...otherVariantFields,
              variantMaster: variant_master, // Map 'variant_master' to 'variantMaster'
              isCart: isCart,
              isWishlist: isWishlist,
              cartProdQnt: cartProdQnt,
            };
          }),
        );

        return {
          ...rest,
          productCategory: product_category, // Map DB field to your desired name
          variantCount: countVariant, // Add variant count to the response
          productVariant: updatedProductVariants, // Use the updated productVariant array
        };
      }),
    );

    const count = await ProductModel().where(whereClause).countDocuments();

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      count,
      data: mappedRecords[0],
    });
  }),
);

/**
 * Get all best seller  product for web
 */
router.get(
  '/web/bestSeller/',
  asyncHandler(async (req: Request, res: Response) => {
    let pageIndex: number = parseInt((req as any).query.pageNo);
    let pageSize: number = parseInt((req as any).query.pageLimit);
    let sortBy: string = (req as any).query.sortBy;
    let sortOrder: string = (req as any).query.sortOrder;
    let customerId = req.query.customerId;
    let whereClause: { [key: string]: any } = {
      softDelete: false,
      isActive: true,
      isBestSeller: true,
    };

    const records = await ProductModel()
      .select(
        'id, name, description, specification, manufacturer, productAttributes, productImage, categoryId',
      )
      .populate('product_category', 'id,name')
      .where(whereClause)
      .pagination(pageIndex, pageSize)
      .sort(sortBy, sortOrder)
      .find();

    if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);

    const mappedRecords = await Promise.all(
      records.map(async (record: any) => {
        const { product_category, ...rest } = record;

        // Fetch the count of variants for each product
        const countVariant = await ProductVariantModel()
          .where({ productId: record.id, softDelete: false, isActive: true })
          .countDocuments();

        const productVariant = await ProductVariantModel()
          .select(
            'id,productId,categoryId,variantId,skuNo,qrCode,purchaseCost,mrp,sellingPrice,offerPrice,taxId,stock,isReturnable,returnDaysLimit,productVariantImage',
          )
          .populate('variant_master', 'id,variantName')
          .where({ productId: record.id, softDelete: false, isActive: true })
          .find();

        // Loop through each variant and check for cart and wishlist status
        const updatedProductVariants = await Promise.all(
          productVariant.map(async (variant: any) => {
            let isCart = false;
            let isWishlist = false;
            let cartProdQnt = 0;
            if (customerId) {
              const cartWhereClause = {
                softDelete: false,
                itemType: 'C', // 'C' for cart items
                productId: variant['id'],
                userId: customerId,
              };
              const cart = await CartMasterModel()
                .select('id,cartProdQnt')
                .where(cartWhereClause)
                .find();

              const wishlistWhereClause = {
                softDelete: false,
                itemType: 'W', // 'W' for wishlist items
                productId: variant['id'],
                userId: customerId,
              };
              const wishlist = await CartMasterModel()
                .select('id,cartProdQnt')
                .where(wishlistWhereClause)
                .find();

              // Set flags if cart or wishlist items are found
              if (cart && cart.length > 0) {
                isCart = true;
                cartProdQnt = cart[0].cartProdQnt;
              }
              if (wishlist && wishlist.length > 0) {
                isWishlist = true;
              }
            }

            // Return the updated variant with the isCart and isWishlist flags
            const { variant_master, ...otherVariantFields } = variant;
            return {
              ...otherVariantFields,
              variantMaster: variant_master, // Map 'variant_master' to 'variantMaster'
              isCart: isCart,
              isWishlist: isWishlist,
              cartProdQnt: cartProdQnt,
            };
          }),
        );

        return {
          ...rest,
          productCategory: product_category, // Map DB field to your desired name
          variantCount: countVariant, // Add variant count to the response
          productVariant: updatedProductVariants, // Use the updated productVariant array
        };
      }),
    );

    const count = await ProductModel().where(whereClause).countDocuments();

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      count,
      data: mappedRecords,
    });
  }),
);

router.get(
  '/web/bestSeller/v1/',
  asyncHandler(async (req: Request, res: Response) => {
    let pageIndex: number = parseInt((req as any).query.pageNo);
    let pageSize: number = parseInt((req as any).query.pageLimit);
    let sortBy: string = (req as any).query.sortBy;
    let sortOrder: string = (req as any).query.sortOrder;

    const whereClause = { softDelete: false, isActive: true, isBestSeller: true };
    const records = await ProductModel()
      .select(
        'id, name, description, specification, manufacturer, productAttributes, productImage, categoryId, isActive, createdAt, createdBy',
      )
      .populate('product_category', 'id,name')
      .where(whereClause)
      .pagination(pageIndex, pageSize)
      .sort(sortBy, sortOrder)
      .find();
    if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);

    const mappedRecords = await Promise.all(
      records.map(async (record: any) => {
        const { product_category, ...rest } = record;

        // Fetch the count of variants for each product
        const countVariant = await ProductVariantModel()
          .where({ productId: record.id, softDelete: false, isActive: true })
          .countDocuments();

        return {
          ...rest,
          productCategory: product_category, // Map DB field to your desired name
          variantCount: countVariant, // Add variant count to the response
        };
      }),
    );

    const count = await ProductModel().where(whereClause).countDocuments();

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      count,
      data: mappedRecords,
    });
  }),
);

/**
 * Get product variant by category id for web
 */
router.get(
  '/web/cat/:id',
  asyncHandler(async (req: Request, res: Response) => {
    let pageIndex: number = parseInt((req as any).query.pageNo);
    let pageSize: number = parseInt((req as any).query.pageLimit);
    let sortBy: string = (req as any).query.sortBy;
    let sortOrder: string = (req as any).query.sortOrder;

    const whereClause = { softDelete: false, isActive: true, categoryId: req.params.id };
    const records = await ProductModel()
      .select(
        'id, name, description, specification, manufacturer, productAttributes, productImage, categoryId, isActive, createdAt, createdBy',
      )
      .populate('product_category', 'id,name')
      .where(whereClause)
      .pagination(pageIndex, pageSize)
      .sort(sortBy, sortOrder)
      .find();
    if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);

    const mappedRecords = await Promise.all(
      records.map(async (record: any) => {
        const { product_category, ...rest } = record;

        // Fetch the count of variants for each product
        const countVariant = await ProductVariantModel()
          .where({
            softDelete: false,
            isActive: true,
            categoryId: req.params.id,
            productId: record.id,
          })
          .countDocuments();

        return {
          ...rest,
          productCategory: product_category, // Map DB field to your desired name
          variantCount: countVariant, // Add variant count to the response
        };
      }),
    );

    const count = await ProductModel().where(whereClause).countDocuments();

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      count,
      data: mappedRecords,
    });
  }),
);

/**
 * Get all product variant by product id for admin
 */
router.get(
  '/product-variant-by-pid/:id',
  [auth, isAdmin],
  asyncHandler(async (req: Request, res: Response) => {
    const whereClause = { softDelete: false, productId: req.params.id };
    const records = await ProductVariantModel()
      .select(
        'id, productId, skuNo, qrCode, purchaseCost, mrp, sellingPrice, offerPrice, taxId, stock, isReturnable, returnDaysLimit, productVariantImage, isActive, createdAt, createdBy',
      )
      .populate('variant_master', 'id, variantName')
      .populate('product_category', 'id,name')
      .populate('tax_master', 'id,slab')
      .where(whereClause)
      .find();

    if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);

    const mappedRecords = await Promise.all(
      records.map(async (record: any) => {
        const { product_category, variant_master, tax_master, ...rest } = record;

        // Fetch inventory for the product variant
        const inventory = await ProductInventoryModel()
          .select('batchNo, manufacturingDate, expiryDate')
          .where({ productVariantId: record.id })
          .findOne();

        // Merge inventory into variant_master
        const variantMasterWithInventory = {
          ...variant_master,
          batchNo: inventory?.batchNo,
          manufacturingDate: inventory?.manufacturingDate,
          expiryDate: inventory?.expiryDate,
        };

        return {
          ...rest,
          productCategory: product_category, // Map DB field to your desired name
          taxMaster: tax_master,
          variantMaster: variantMasterWithInventory, // Add the variant master with inventory
        };
      }),
    );

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      data: mappedRecords, // Send the mapped record with inventory inside variantMaster
    });
  }),
);

/**
 * Get all product variant by product id for web
 */
router.get(
  '/product-variant-by-pid/web/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const whereClause = { softDelete: false, productId: req.params.id, isActive: true };
    const records = await ProductVariantModel()
      .select(
        'id, productId, categoryId, variantId, skuNo, qrCode, purchaseCost, mrp, sellingPrice, offerPrice, taxId, stock, isReturnable, returnDaysLimit, productVariantImage, isActive, createdAt, createdBy',
      )
      .populate('variant_master', 'id, variantName')
      .populate('product_category', 'id,name')
      .where(whereClause)
      .find();
    if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);

    const mappedRecords = await Promise.all(
      records.map(async (record: any) => {
        const { product_category, variant_master, ...rest } = record;

        return {
          ...rest,
          productCategory: product_category, // Map DB field to your desired name
          variantMaster: variant_master,
        };
      }),
    );

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      data: mappedRecords, // Send the mapped record with 'productCategory'
    });
  }),
);

/**
 * Get all product variant by variant id for web
 */
router.get(
  '/product-variant/web/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const whereClause = { softDelete: false, id: req.params.id, isActive: true };
    const record = await ProductVariantModel()
      .select(
        'id, productId, categoryId, variantId, skuNo, qrCode, purchaseCost, mrp, sellingPrice, offerPrice, taxId, stock, isReturnable, returnDaysLimit, productVariantImage, isActive, createdAt, createdBy',
      )
      .populate('variant_master', 'id, variantName')
      .populate('product_category', 'id,name')
      .populate('tax_master', 'id,slab')
      .where(whereClause)
      .findOne();
    if (!record) throw new CustomError('No records found.', HttpStatusCode.NotFound);

    const plainRecord = record.toObject ? record.toObject() : record;
    const mappedRecord = {
      ...plainRecord,
      productCategory: plainRecord.product_category, // Map DB field to your desired name
      variantMaster: plainRecord.variant_master,
      taxMaster: plainRecord.tax_master,
    };

    // Optionally, remove the original DB field name from the response
    delete mappedRecord.product_category;
    delete mappedRecord.variant_master;
    delete mappedRecord.tax_master;

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      data: mappedRecord, // Send the mapped record with 'productCategory'
    });
  }),
);

/**
 * Get all product variant dropdown by product id for web
 */
router.get(
  '/drop-down/web/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const records = await ProductVariantModel()
      .select('id, variantId, productVariantImage, skuNo, qrCode')
      .where({
        //createdBy: (req as any).user.id,
        softDelete: false,
        productId: req.params.id,
        isActive: true,
      })
      .populate('variant_master', 'id, variantName')
      .find();
    if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);

    const mappedRecords = await Promise.all(
      records.map(async (record: any) => {
        const { variant_master, ...rest } = record;

        return {
          ...rest,
          variantMaster: variant_master, // Map DB field to your desired name
        };
      }),
    );

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      data: mappedRecords,
    });
  }),
);

/**
 * Get all product variant by variant id for admin
 */
router.get(
  '/product-variant/:id',
  [auth, isAdmin],
  asyncHandler(async (req: Request, res: Response) => {
    const whereClause = { softDelete: false, id: req.params.id };
    const record = await ProductVariantModel()
      .select(
        'id, productId, categoryId, variantId, skuNo, qrCode, purchaseCost, mrp, sellingPrice, offerPrice, taxId, stock, isReturnable, returnDaysLimit, productVariantImage, isActive, createdAt, createdBy',
      )
      .populate('variant_master', 'id, variantName')
      .populate('product_category', 'id,name')
      .populate('tax_master', 'id,slab')
      .where(whereClause)
      .findOne();
    if (!record) throw new CustomError('No records found.', HttpStatusCode.NotFound);

    const plainRecord = record.toObject ? record.toObject() : record;

    const inventory = await ProductInventoryModel()
      .select('batchNo, manufacturingDate, expiryDate')
      .where({ productVariantId: record.id })
      .findOne();
    const mappedRecord = {
      ...plainRecord,
      batchNo: inventory.batchNo,
      manufacturingDate: inventory.manufacturingDate,
      expiryDate: inventory.expiryDate,
      productCategory: plainRecord.product_category, // Map DB field to your desired name
      variantMaster: plainRecord.variant_master,
      taxMaster: plainRecord.tax_master,
    };

    // Optionally, remove the original DB field name from the response
    delete mappedRecord.product_category;
    delete mappedRecord.variant_master;
    delete mappedRecord.tax_master;

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      data: mappedRecord, // Send the mapped record with 'productCategory'
    });
  }),
);

/**
 * Get all product variant dropdown by product id for admin
 */
router.get(
  '/drop-down/:id',
  [auth, isAdmin],
  asyncHandler(async (req: Request, res: Response) => {
    const records = await ProductVariantModel()
      .select('id, variantId, productVariantImage, skuNo, qrCode')
      .where({
        //createdBy: (req as any).user.id,
        softDelete: false,
        productId: req.params.id,
      })
      .populate('variant_master', 'id, variantName')
      .find();
    if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);

    const mappedRecords = await Promise.all(
      records.map(async (record: any) => {
        const { variant_master, ...rest } = record;

        return {
          ...rest,
          variantMaster: variant_master, // Map DB field to your desired name
        };
      }),
    );

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      data: mappedRecords,
    });
  }),
);

/**
 * Get records by id of product
 */
router.get(
  '/:id',
  [auth, isAdmin],
  asyncHandler(async (req: Request, res: Response) => {
    //console.log(req.params.id);
    const isExist = await ProductModel().where({ id: req.params.id }).findOne();
    if (!isExist)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    const record = await ProductModel()
      .select(
        'id, name, description, specification, manufacturer, categoryId, productImage, isBestSeller, isNewProduct,isFeatured, metaTitle, metaDescription, warrantyPolicy, paymentTerm, isActive, createdAt, createdBy,brandId',
      )
      .populate('product_category', 'id,name')
      .populate('product_brand', 'id,name')
      .where({ id: req.params.id })
      .findOne();

    if (!record) throw new CustomError('No records found.', HttpStatusCode.NotFound);

    const plainRecord = record.toObject ? record.toObject() : record;
    const mappedRecord = {
      ...plainRecord,
      productCategory: plainRecord.product_category, // Map DB field to your desired name
      brand: plainRecord.product_brand,
    };

    // Optionally, remove the original DB field name from the response
    delete mappedRecord.product_category;

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      data: mappedRecord,
    });
  }),
);

/**
 * Product Update by id
 */
router.put(
  '/:id',
  [auth, isAdmin],
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as IUpdateProduct;
    const { error } = ProductModel().updateProduct(body);
    if (error) throw new CustomError(error.message, HttpStatusCode.BadRequest);

    const isExist = await ProductModel().where({ id: req.params.id }).findOne();
    if (!isExist)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    let imageUrl: string = '';
    if (body.productImage) {
      if (body.productImage !== isExist.productImage) {
        let fileUpload = await imageUpload(body.productImage, `productcontainer`);
        if (fileUpload) {
          imageUrl = fileUpload;
        } else {
          return res.status(HttpStatusCode.UnsupportedMediaType).send({
            statusCode: HttpStatusCode.UnsupportedMediaType,
            message: 'Only png, jpg & jpeg filetype supported.',
          });
        }
      } else {
        imageUrl = isExist.productImage;
      }
    } else {
      imageUrl = isExist.productImage;
    }

    let transaction = await ProductModel()
      .where({ id: req.params.id })
      .select('id, name')
      .updateOne({
        name: body.name,
        productImage: imageUrl,
        description: body.description,
        specification: body.specification,
        manufacturer: body.manufacturer,
        productMethod: true,
        isNewProduct: body.isNewProduct,
        isBestSeller: body.isBestSeller,
        isFeatured: body.isFeatured,
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
        warrantyPolicy: body.warrantyPolicy,
        paymentTerm: body.paymentTerm,
        categoryId: body.categoryId,
        brandId: body.brandId,

        updatedBy: (req as any).user.id,
        updatedAt: new Date(),
      });

    res.status(HttpStatusCode.Created).send({
      statusCode: HttpStatusCode.Created,
      message: 'Successfully updated record.',
      data: transaction,
    });
  }),
);

/**
 * Product Update by Status
 */
/* router.put(
  '/status/:id',
  [auth, isAdmin],
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) throw new CustomError('Id is required.', HttpStatusCode.BadRequest);

    const isExist = await ProductModel().where({ id: req.params.id }).findOne();
    if (!isExist)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    await ProductModel()
      .where({ id: req.params.id })
      .updateOne({
        isActive: isExist.isActive == true ? false : true,
      });

    res
      .status(HttpStatusCode.Created)
      .send({ statusCode: HttpStatusCode.Created, message: 'Successfully changed status.' });
  }),
); */

/**
 * Product Delete
 */
/* router.delete(
  '/:id',
  [auth, isAdmin],
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) throw new CustomError('Id is required.', HttpStatusCode.BadRequest);

    const delId = await ProductModel().where({ id: req.params.id }).softDelete();
    if (!delId)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);
    res
      .status(HttpStatusCode.Created)
      .send({ statusCode: HttpStatusCode.Created, message: 'Successfully deleted.' });
  }),
); */

/**
 * Featured Product Update
 */
router.put(
  '/featured-status/:id',
  [auth, isAdmin],
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) throw new CustomError('Id is required.', HttpStatusCode.BadRequest);

    const isExist = await ProductModel().where({ id: req.params.id }).findOne();
    if (!isExist)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    await ProductModel()
      .where({ id: req.params.id })
      .updateOne({
        isFeatured: isExist.isFeatured == true ? false : true,
      });

    res
      .status(HttpStatusCode.Created)
      .send({ statusCode: HttpStatusCode.Created, message: 'Successfully changed status.' });
  }),
);

/**
 * New Product Update
 */
router.put(
  '/newproduct-status/:id',
  [auth, isAdmin],
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) throw new CustomError('Id is required.', HttpStatusCode.BadRequest);

    const isExist = await ProductModel().where({ id: req.params.id }).findOne();
    if (!isExist)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    await ProductModel()
      .where({ id: req.params.id })
      .updateOne({
        isNewProduct: isExist.isNewProduct == true ? false : true,
      });

    res
      .status(HttpStatusCode.Created)
      .send({ statusCode: HttpStatusCode.Created, message: 'Successfully changed status.' });
  }),
);

/**
 * BestSeller Product Update
 */
router.put(
  '/bestseller-status/:id',
  [auth, isAdmin],
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) throw new CustomError('Id is required.', HttpStatusCode.BadRequest);

    const isExist = await ProductModel().where({ id: req.params.id }).findOne();
    if (!isExist)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    await ProductModel()
      .where({ id: req.params.id })
      .updateOne({
        isBestSeller: isExist.isBestSeller == true ? false : true,
      });

    res
      .status(HttpStatusCode.Created)
      .send({ statusCode: HttpStatusCode.Created, message: 'Successfully changed status.' });
  }),
);

/**
 * Bulk Product Upload
 */
router.post(
  '/bulk-upload',
  [auth, isAdmin],
  upload.single('file'),
  async (req: ICustomRequest, res: Response) => {
    if (!req.file) {
      return res
        .status(HttpStatusCode.NotFound)
        .send({ statusCode: HttpStatusCode.NotFound, message: 'No file uploaded.' });
    }

    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData: any[] = xlsx.utils.sheet_to_json(worksheet);

    fs.unlinkSync(filePath);
    const transactionClient = await ProductModel().getClient();
    try {
      await transactionClient.query('BEGIN');
      let pArray: { id: string; name: string; categoryId: string; isParent: 'P' | 'C' }[] = [];
      let i = 1;
      for (const data of jsonData) {
        // console.log('name:' + data.name);
        let isExistCategory = await ProductCategoryModel()
          .select('id, name')
          .where({ name: data.categoryName, softDelete: false, isActive: true })
          .findOne();

        // console.log('category-' + `${isExistCategory.name} not exists on line no ` + i + `.`);
        if (!isExistCategory) {
          return res.status(HttpStatusCode.NotFound).send({
            statusCode: HttpStatusCode.NotFound,
            message: `${isExistCategory.name} not exists.Error in line no ` + i + `.`,
          });
        }

        let isExistBrand = await ProductBrandModel()
          .select('id, name')
          .where({ name: data.brandName, softDelete: false, isActive: true })
          .findOne();

        // console.log('category-' + isExistCategory);
        if (!isExistBrand) {
          return res.status(HttpStatusCode.NotFound).send({
            statusCode: HttpStatusCode.NotFound,
            message: `${isExistBrand.name} not exists. Error on line no ` + i + `.`,
          });
        }

        let isExistTax = await TaxMasterModel()
          .select('id, slab')
          .where({ slab: String(data.taxSlab), softDelete: false, isActive: true })
          .findOne();
        //console.log('Tax-' + isExistCategory);
        if (!isExistTax) {
          return res.status(HttpStatusCode.NotFound).send({
            statusCode: HttpStatusCode.NotFound,
            message: `${isExistTax.name} not exists. Error on line no ` + i + `.`,
          });
        }
        // console.log(isExistTax);
        //console.log(data.variantName);
        let isExistVariantMaster = await VariantMasterModel()
          .select('id, variantName')
          .where({
            variantName: data.variantName,
            softDelete: false,
            isActive: true,
          })
          .findOne();
        //strval($floatValue)
        //console.log('Variant-' + isExistVariantMaster);
        if (!isExistVariantMaster) {
          return res.status(HttpStatusCode.NotFound).send({
            statusCode: HttpStatusCode.NotFound,
            message:
              `${isExistVariantMaster.variantName} variant not exists. Error on line no ` + i + `.`,
          });
        }
        // let isExistProduct;
        if (data.isParent == 'P') {
          //console.log('parent');
          let isExistProduct = await ProductModel()
            .select('id, name')
            .where({
              name: data.name,
              categoryId: isExistCategory.id,
              softDelete: false,
              isActive: true,
            })
            .findOne();

          let productVariant;
          if (isExistProduct) {
            productVariant = await ProductVariantModel()
              .select('id, skuNo')
              .where({
                productId: isExistProduct.id,
                categoryId: isExistCategory.id,
                variantId: isExistVariantMaster.id,
                softDelete: false,
                isActive: true,
              })
              .findOne();
          }
          if (isExistProduct && productVariant) {
            return res.status(HttpStatusCode.Conflict).send({
              statusCode: HttpStatusCode.Conflict,
              message:
                `${isExistProduct.name} & ${isExistVariantMaster.variantName} already exists on line no ` +
                i +
                `.`,
            });
          }
          let payload: any = {
            name: data.name,
            categoryId: isExistCategory.id,
            description: data.description,
            specification: data.specification,
            manufacturer: data.manufacturer,
            // productAttributes: data.productAttributes,
            isNewProduct: data.isNewProduct,
            isBestSeller: data.isBestSeller,
            isFeatured: data.isFeatured,
            warrantyPolicy: data.warrantyPolicy,
            paymentTerm: data.paymentTerm,
            brandId: isExistBrand.id,
            productImage:
              'https://aonemartstorageaccount.blob.core.windows.net/productcontainer/defaultProduct.png',
            createdBy: (req as any).user.id,
          };

          let product = await ProductModel()
            .select('id, name')
            .createOne(payload, transactionClient);

          pArray.push({
            id: product.id,
            name: product.name,
            categoryId: payload.categoryId,
            isParent: 'P',
          });

          let productId = product.id;

          if (productId) {
            //console.log('hereeeeeeeeeeeeeeeeeeeeeeeeee');
            let productVarientId = await ProductVariantModel()
              .select('id')
              .createOne(
                {
                  productId: productId, // Foreign key to the Product table
                  variantId: isExistVariantMaster.id,
                  categoryId: isExistCategory.id,
                  skuNo: data.skuNo,
                  qrCode: data.qrCode,
                  taxId: isExistTax.id,
                  offerPrice: data.offerPrice,
                  isReturnable: data.isReturnable,
                  returnDaysLimit: data.returnDaysLimit,
                  purchaseCost: data.purchaseCost,
                  mrp: data.mrp,
                  sellingPrice: data.sellingPrice,
                  stock: data.stock,
                  productVariantImage:
                    '{https://aonemartstorageaccount.blob.core.windows.net/productcontainer/defaultProduct.png,https://aonemartstorageaccount.blob.core.windows.net/productcontainer/defaultProduct.png}',
                  createdBy: (req as any).user.id,
                },
                transactionClient,
              );

            // Insert product inventory
            if (productVarientId) {
              //console.log(productVarientId.id);
              let inventoryModel = await ProductInventoryModel()
                .select('id')
                .where({
                  productVariantId: productVarientId.id,
                  productId: productId,
                  batchNo: data.batchNo,
                })
                .findOne();
              //console.log(productVarientId.id);
              if (!inventoryModel) {
                await ProductInventoryModel()
                  .select('id')
                  .createOne(
                    {
                      productId: productId, // Foreign key to the Product table
                      productVariantId: productVarientId.id,
                      skuNo: data.skuNo,
                      mrp: data.mrp,
                      totalStock: data.stock,
                      costPrice: data.purchaseCost,
                      salesPrice: data.sellingPrice,
                      batchNo: data.batchNo,
                      manufacturingDate: excelSerialDateToJSDate(data.manufacturingDate),
                      expiryDate: excelSerialDateToJSDate(data.expiryDate),
                      methodFlag: false,
                      availableQnt: data.stock,
                      createdBy: (req as any).user.id,
                      inventoryStage: 'Running',
                      inventorySerial: 0,
                    },
                    transactionClient,
                  );

                // Insert product inventory history
                await ProductInventoryHistoryModel().createOne(
                  {
                    productId: productId, // Foreign key to the Product table
                    productVariantId: productVarientId.id,
                    batchId: data.batchNo,
                    previousStock: 0,
                    currentStock: data.stock,
                    changeStock: 0,
                    remarks: data.remarks,
                    createdBy: (req as any).user.id,
                  },
                  transactionClient,
                );
              }
            }
          }
          // console.log('Prod  ' + productId + '/' + data.name);
          // return;
          /* if (productId) {
            let productVarientId = await ProductVariantModel()
              .select('id')
              .createOne(
                {
                  productId: productId, // Foreign key to the Product table
                  variantId: isExistVariantMaster.id,
                  categoryId: isExistCategory.id,
                  skuNo: data.skuNo,
                  qrCode: data.qrCode,
                  taxId: isExistTax.id,
                  offerPrice: data.offerPrice,
                  isReturnable: data.isReturnable,
                  returnDaysLimit: data.returnDaysLimit,
                  purchaseCost: data.purchaseCost,
                  mrp: data.mrp,
                  sellingPrice: data.sellingPrice,
                  stock: data.stock,
                  createdBy: (req as any).user.id,
                },
                transactionClient,
              );
            //console.log(productVarientId.id);

            // Insert product inventory
            if (productVarientId) {
              //console.log(productVarientId.id);
              let inventoryModel = await ProductInventoryModel()
                .select('id')
                .where({
                  productVariantId: productVarientId.id,
                  productId: productId,
                  batchNo: data.batchNo,
                })
                .findOne();
              //console.log(productVarientId.id);
              if (!inventoryModel) {
                await ProductInventoryModel()
                  .select('id')
                  .createOne(
                    {
                      productId: productId, // Foreign key to the Product table
                      productVariantId: productVarientId.id,
                      skuNo: data.skuNo,
                      mrp: data.mrp,
                      totalStock: data.stock,
                      costPrice: data.purchaseCost,
                      salesPrice: data.sellingPrice,
                      batchNo: data.batchNo,
                      manufacturingDate: excelSerialDateToJSDate(data.manufacturingDate),
                      expiryDate: excelSerialDateToJSDate(data.expiryDate),
                      methodFlag: false,
                      availableQnt: data.stock,
                      createdBy: (req as any).user.id,
                      inventoryStage: 'Running',
                      inventorySerial: 0,
                    },
                    transactionClient,
                  );

                // Insert product inventory history
                await ProductInventoryHistoryModel().createOne(
                  {
                    productId: productId, // Foreign key to the Product table
                    productVariantId: productVarientId.id,
                    batchId: data.batchNo,
                    previousStock: 0,
                    currentStock: data.stock,
                    changeStock: 0,
                    remarks: data.remarks,
                    createdBy: (req as any).user.id,
                  },
                  transactionClient,
                );
              }
            }
          }*/
        } else if (data.isParent == 'C') {
          const isExistProduct = pArray.find(
            (p) => p.name === data.name && p.categoryId === isExistCategory.id,
          );
          // console.log('child/' + isExistProduct);
          //return;

          if (isExistProduct) {
            let productVariant = await ProductVariantModel()
              .select('id, skuNo')
              .where({
                productId: isExistProduct.id,
                categoryId: isExistCategory.id,
                variantId: isExistVariantMaster.id,
                softDelete: false,
                isActive: true,
              })
              .findOne();

            if (productVariant) {
              return res.status(HttpStatusCode.Conflict).send({
                statusCode: HttpStatusCode.Conflict,
                message:
                  `${isExistVariantMaster.variantName} already exists. Error on line no ` + i + `.`,
              });
            }
          }
          //console.log(isExistProduct);

          let productId = isExistProduct?.id;
          // console.log('Prod  ' + productId + '/' + data.name);
          // return;g()
          if (productId) {
            // console.log('hereeeeeeeeeeeeeeeeeeeeeeeeee');
            let productVarientId = await ProductVariantModel()
              .select('id')
              .createOne(
                {
                  productId: productId, // Foreign key to the Product table
                  variantId: isExistVariantMaster.id,
                  categoryId: isExistCategory.id,
                  skuNo: data.skuNo,
                  qrCode: data.qrCode,
                  taxId: isExistTax.id,
                  offerPrice: data.offerPrice,
                  isReturnable: data.isReturnable,
                  returnDaysLimit: data.returnDaysLimit,
                  purchaseCost: data.purchaseCost,
                  mrp: data.mrp,
                  sellingPrice: data.sellingPrice,
                  stock: data.stock,
                  productVariantImage:
                    '{https://aonemartstorageaccount.blob.core.windows.net/productcontainer/defaultProduct.png,https://aonemartstorageaccount.blob.core.windows.net/productcontainer/defaultProduct.png}',
                  createdBy: (req as any).user.id,
                },
                transactionClient,
              );

            // Insert product inventory
            if (productVarientId) {
              //console.log(productVarientId.id);
              let inventoryModel = await ProductInventoryModel()
                .select('id')
                .where({
                  productVariantId: productVarientId.id,
                  productId: productId,
                  batchNo: data.batchNo,
                })
                .findOne();
              //console.log(productVarientId.id);
              if (!inventoryModel) {
                await ProductInventoryModel()
                  .select('id')
                  .createOne(
                    {
                      productId: productId, // Foreign key to the Product table
                      productVariantId: productVarientId.id,
                      skuNo: data.skuNo,
                      mrp: data.mrp,
                      totalStock: data.stock,
                      costPrice: data.purchaseCost,
                      salesPrice: data.sellingPrice,
                      batchNo: data.batchNo,
                      manufacturingDate: excelSerialDateToJSDate(data.manufacturingDate),
                      expiryDate: excelSerialDateToJSDate(data.expiryDate),
                      methodFlag: false,
                      availableQnt: data.stock,
                      createdBy: (req as any).user.id,
                      inventoryStage: 'Running',
                      inventorySerial: 0,
                    },
                    transactionClient,
                  );

                // Insert product inventory history
                await ProductInventoryHistoryModel().createOne(
                  {
                    productId: productId, // Foreign key to the Product table
                    productVariantId: productVarientId.id,
                    batchId: data.batchNo,
                    previousStock: 0,
                    currentStock: data.stock,
                    changeStock: 0,
                    remarks: data.remarks,
                    createdBy: (req as any).user.id,
                  },
                  transactionClient,
                );
              }
            }
          }
        }
        // return;
        i++;
      }

      await transactionClient.query('COMMIT');

      res.status(HttpStatusCode.Created).send({
        statusCode: HttpStatusCode.Created,
        message: 'Successfully inserted record.',
        data: null,
      });
    } catch (error: any) {
      console.log('🛑 Error =>', error);
      res
        .status(HttpStatusCode.InternalServerError)
        .send({ statusCode: HttpStatusCode.InternalServerError, message: error });
    }
  },
);

/**
 * Search product by name
 */
router.get(
  '/web/search',
  asyncHandler(async (req: Request, res: Response) => {
    const searchKey = req.query.searchKey; //'gold'
    let customerId = req.query.customerId;
    // console.log(searchKey);
    const isExist = await ProductModel().rawSql(
      `SELECT product.id, product."name", product.description, specification, manufacturer, "categoryId", "productImage", 
      "isBestSeller", "isNewProduct", product."isFeatured", product."metaTitle", product."metaDescription", "warrantyPolicy", 
      "paymentTerm" FROM product WHERE product."name"::text ILIKE '%'||$1||'%'`,
      [searchKey],
    );
    // console.log(isExist['rows'].length);
    if (!isExist)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    const result = [];
    //console.log(isExist['rows'].length);
    let productRows = isExist['rows'];
    let count = productRows.length;
    for (var i = 0; i < productRows.length; i++) {
      // Fetch product variant details from ProductVariantModel
      // console.log(productRows[i]);
      const variantCount = await ProductVariantModel()
        .where({ productId: productRows[i].id, softDelete: false, isActive: true })
        .countDocuments();
      const productCategory = await ProductCategoryModel()
        .select('id,name')
        .where({ id: productRows[i].categoryId })
        .findOne();

      //console.log(productCategory);

      const countVariant = await ProductVariantModel()
        .where({ productId: productRows[i].id, softDelete: false, isActive: true })
        .countDocuments();
      const productVariant = await ProductVariantModel()
        .select(
          'id,productId,categoryId,variantId,skuNo,qrCode,purchaseCost,mrp,sellingPrice,offerPrice,taxId,stock,isReturnable,returnDaysLimit,productVariantImage',
        )
        .populate('variant_master', 'id,variantName')
        .where({ productId: productRows[i].id, softDelete: false, isActive: true })
        .find();

      // Loop through each variant and check for cart and wishlist status
      const updatedProductVariants = await Promise.all(
        productVariant.map(async (variant: any) => {
          let isCart = false;
          let isWishlist = false;
          let cartProdQnt = 0;
          if (customerId) {
            const cartWhereClause = {
              softDelete: false,
              itemType: 'C', // 'C' for cart items
              productId: variant['id'],
              userId: customerId,
            };
            const cart = await CartMasterModel()
              .select('id,cartProdQnt')
              .where(cartWhereClause)
              .find();

            const wishlistWhereClause = {
              softDelete: false,
              itemType: 'W', // 'W' for wishlist items
              productId: variant['id'],
              userId: customerId,
            };
            const wishlist = await CartMasterModel()
              .select('id,cartProdQnt')
              .where(wishlistWhereClause)
              .find();

            // Set flags if cart or wishlist items are found
            if (cart && cart.length > 0) {
              isCart = true;
              cartProdQnt = cart[0].cartProdQnt;
            }
            if (wishlist && wishlist.length > 0) {
              isWishlist = true;
            }
          }

          // Return the updated variant with the isCart and isWishlist flags
          const { variant_master, ...otherVariantFields } = variant;
          return {
            ...otherVariantFields,
            variantMaster: variant_master, // Map 'variant_master' to 'variantMaster'
            isCart: isCart,
            isWishlist: isWishlist,
            cartProdQnt: cartProdQnt,
          };
        }),
      );
      // Return the updated variant with the isCart and isWishlist flags
      //const { variant_master, ...otherVariantFields } = variant;
      const plainRecord = productRows[i];
      let mappedRecord = {
        ...plainRecord,
        productCategory: productCategory, // Map DB field to your desired name
        variantCount: countVariant, // Add variant count to the response
        productVariant: updatedProductVariants, // Use the updated productVariant array
      };

      // delete mappedRecord.product_category;

      result.push(mappedRecord);
    }

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      count,
      data: result,
    });
  }),
);

// for convert excel date to pg
function excelSerialDateToJSDate(serial: number): string {
  const epoch = new Date(1900, 0, 1);
  const excelEpoch = new Date(epoch.getTime() + (serial - 2) * 86400000); // Subtract 2 to account for Excel's leap year bug
  return excelEpoch.toISOString().split('T')[0]; // Return in YYYY-MM-DD format
}
export default router;
