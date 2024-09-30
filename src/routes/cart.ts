import { Request, Response, Router } from 'express';
import { ICustomRequest } from '../types/common';
import { HttpStatusCode } from '../helpers/http-status-codes';
// import config from 'config';
// import moment from 'moment';
// import multer from 'multer';
// import path from 'path';
// import fs from 'fs';
// import xlsx from 'xlsx';
// const { PDFDocument } = require('pdf-lib');
import asyncHandler from '../middlewares/asyncHandler';
import CustomError from '../middlewares/customError';
import { auth } from '../middlewares/auth';
import { customer } from '../middlewares/customer';
import { isAdmin } from '../middlewares/admin';
import pool from '../helpers/connection';
const router = Router();

import {
  CartMasterModel,
  ProductModel,
  ProductVariantModel,
  VariantMasterModel,
} from '../model/models';
import { IAddCart, IUpdateCart, IAddWishlist } from '../types/cart';

// Multer Upload Storage
/* const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const baseUrl = path.dirname(__dirname);
    cb(null, baseUrl + '/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage: storage }); */

/**
 * Create new Model
 * Master table for Cart Model
 */
router.post(
  '/',
  [auth, customer],
  asyncHandler(async (req: ICustomRequest, res: Response) => {
    const body = req.body as IAddCart;
    const { error } = CartMasterModel().addCart(body);
    if (error) throw new CustomError(error.message, HttpStatusCode.BadRequest);

    const cartFav = await CartMasterModel()
      .where({
        userId: (req as any).user.id,
        productId: body.productId,
        itemType: 'C',
        softDelete: false,
      })
      .findOne();
    //console.log(cartFav);
    if (cartFav) throw new CustomError('Product already exist in cart.', HttpStatusCode.Conflict);

    const product = await ProductVariantModel()
      .select('id')
      .where({ id: body.productId, softDelete: '0' })
      .findOne();
    if (!product) {
      return res.status(404).send({ message: 'This product is not available.' });
    }
    if (!product || product.stock == '0') {
      return res.status(404).send({ message: 'Product is out of stock' });
    }
    if (body.cartProdQnt > product.stock) {
      return res
        .status(404)
        .send({ message: 'Not enough product is in stock currently, please lower the quantity' });
    }

    let transaction = await CartMasterModel().createOne({
      userId: (req as any).user.id,
      productId: body.productId,
      cartProdQnt: body.cartProdQnt,
      itemType: 'C',

      createdBy: (req as any).user.id,
    });

    res.status(HttpStatusCode.Created).send({
      statusCode: HttpStatusCode.Created,
      message: 'Product added to cart.',
      data: transaction,
    });
  }),
);

// Add to wishlist (Web)
router.post(
  '/web',
  [auth, customer],
  asyncHandler(async (req: ICustomRequest, res: Response) => {
    const body = req.body as IAddWishlist;

    // Validate input
    const { error } = CartMasterModel().addWishlist(body);
    if (error) throw new CustomError(error.message, HttpStatusCode.BadRequest);

    // Check if the product is already in the wishlist
    let wishlist = await CartMasterModel()
      .where({
        userId: (req as any).user.id,
        productId: body.productId,
        itemType: 'W',
        softDelete: false,
      })
      .findOne();

    // If product exists in wishlist, remove it (toggle off)
    if (wishlist) {
      await CartMasterModel()
        .where({
          userId: (req as any).user.id,
          productId: body.productId,
          itemType: 'W',
        })
        .updateOne({ softDelete: true }); // Soft delete or permanent delete based on your business logic

      return res.status(200).send({
        statusCode: 200,
        message: 'Product removed from wishlist.',
      });
    }

    // If product does not exist in wishlist, add it (toggle on)
    let transaction = await CartMasterModel().createOne({
      userId: (req as any).user.id,
      productId: body.productId,
      itemType: 'W',
      createdBy: (req as any).user.id,
    });

    res.status(HttpStatusCode.Created).send({
      statusCode: HttpStatusCode.Created,
      message: 'Product added to wishlist.',
      data: transaction,
    });
  }),
);

/**
 * Increase Cart
 * Master table for Cart Model
 */
router.put(
  '/quantityIncrease/:id',
  [auth, customer],
  asyncHandler(async (req: ICustomRequest, res: Response) => {
    const body = req.body;

    const cartFav = await CartMasterModel()
      .select('cartProdQnt, productId')
      .where({
        productId: req.params.id,
        userId: (req as any).user.id,
        softDelete: false,
      })
      .findOne();
    console.log(req.params.id + '/' + (req as any).user.id);
    if (!cartFav)
      throw new CustomError('Cart With following Id not found', HttpStatusCode.Conflict);

    const product = await ProductVariantModel()
      .select('id,stock')
      .where({ id: cartFav.productId, softDelete: false })
      .findOne();
    //console.log(product);
    if (!product || product.stock == '0') {
      return res.status(404).send({ message: 'Product is out of stock' });
    }
    if (cartFav.cartProdQnt > product.stock) {
      return res
        .status(404)
        .send({ message: 'Not enough product is in stock currently, please lower the quantity' });
    }
    if (cartFav.cartProdQnt == product.stock) {
      return res.status(404).send({ message: 'Product stock limit reached !' });
    }
    let increaseQnt = cartFav.cartProdQnt + 1;
    let transaction = await CartMasterModel()
      .where({ id: req.params.id })
      .select('id')
      .where({ productId: req.params.id, userId: (req as any).user.id })
      .updateOne({
        cartProdQnt: increaseQnt,

        updatedBy: (req as any).user.id,
        updatedAt: new Date(),
      });

    res.status(HttpStatusCode.Created).send({
      statusCode: HttpStatusCode.Created,
      message: 'Quantity increased Successfully.',
      data: transaction,
    });
  }),
);

/**
 * Decrease Cart
 * Master table for Cart Model
 */
router.put(
  '/quantityDecrease/:id',
  [auth, customer],
  asyncHandler(async (req: ICustomRequest, res: Response) => {
    const body = req.body;

    const cartFav = await CartMasterModel()
      .select('cartProdQnt, productId')
      .where({
        productId: req.params.id,
        userId: (req as any).user.id,
        softDelete: false,
      })
      .findOne();
    // console.log(cartFav);
    if (!cartFav)
      throw new CustomError('Cart With following Id not found', HttpStatusCode.Conflict);

    let transaction;
    if (cartFav.cartProdQnt <= 1) {
      transaction = await CartMasterModel()
        .select('id')
        .where({ productId: req.params.id, userId: (req as any).user.id })
        .updateOne({
          softDelete: true,
          cartProdQnt: cartFav.cartProdQnt - 1,

          updatedBy: (req as any).user.id,
          updatedAt: new Date(),
        });
    } else {
      transaction = await CartMasterModel()
        .where({ id: req.params.id })
        .select('id')
        .where({ productId: req.params.id, userId: (req as any).user.id })
        .updateOne({
          cartProdQnt: cartFav.cartProdQnt - 1,

          updatedBy: (req as any).user.id,
          updatedAt: new Date(),
        });
    }

    res.status(HttpStatusCode.Created).send({
      statusCode: HttpStatusCode.Created,
      message: 'Quantity decreased Successfully.',
      data: transaction,
    });
  }),
);

/**
 * Get all records for cart web
 */
router.get(
  '/web/c/',
  asyncHandler(async (req: Request, res: Response) => {
    // Define the whereClause for filtering CartMaster records
    let customerId = req.query.customerId;
    if (customerId) {
      const whereClause = { softDelete: false, itemType: 'C', userId: customerId };

      // Fetch CartMaster records
      const records = await CartMasterModel()
        .select('id,productId,cartProdQnt,userId') // Ensure you are selecting productId and variantId
        .populate(
          'product_variant',
          'id,productId,productVariantImage,variantId,stock,mrp,purchaseCost,sellingPrice',
        ) // Ensure product_variant is correctly populated
        .where(whereClause)
        .find();
      //console.log(records);
      // Handle case where no records are found
      if (!records || records.length === 0)
        throw new CustomError('No records found.', HttpStatusCode.NotFound);
      let totalPrice = 0;
      // Map over the records and fetch related product and variantMaster data
      const mappedRecords = await Promise.all(
        records.map(async (record: any) => {
          const { product_variant, variantId, ...rest } = record;
          let isCart = false;
          let isWishlist = false;
          let cartProdQnt = 0;
          totalPrice += product_variant
            ? product_variant.sellingPrice * (record.cartProdQnt || 1)
            : 0;

          // Extract the first image from product_variant.productVariantImage array
          //const firstImage = product_variant?.productVariantImage?.[0] || null;

          // Determine if the record is in the cart
          if (record.cartProdQnt) {
            isCart = true;
            cartProdQnt = record.cartProdQnt;
          }

          // Fetch the product details
          const product = await ProductModel()
            .select('id,name,productImage')
            .where({
              id: record.product_variant.productId,
              softDelete: false,
              isActive: true,
            })
            .findOne();

          // Fetch the variant master details
          const variantMaster = await VariantMasterModel()
            .select('id,variantName')
            .where({
              id: record.product_variant.variantId,
              softDelete: false,
              isActive: true,
            })
            .findOne();

          // Check if the product is in the wishlist
          const wishlistWhereClause = {
            softDelete: false,
            itemType: 'W',
            productId: record.productId,
            userId: record.userId,
          };
          const wishlist = await CartMasterModel()
            .select('id,cartProdQnt')
            .where(wishlistWhereClause)
            .find();
          if (wishlist && wishlist.length > 0) {
            isWishlist = true;
          }

          return {
            ...rest,
            productVariant: {
              ...product_variant,
              // Include only the first image from productVariantImage array
              // productVariantImage: firstImage,
            },
            variantMaster: variantMaster || {},
            product: product || {},
            isCart: isCart,
            isWishlist: isWishlist,
            cartProdQnt: cartProdQnt,
          };
        }),
      );

      // Fetch the total count of CartMaster records
      const count = await CartMasterModel().where(whereClause).countDocuments();

      // Send the response
      res.status(HttpStatusCode.Ok).send({
        statusCode: HttpStatusCode.Ok,
        message: 'Successfully found records.',
        totalPrice: totalPrice,
        count,
        data: mappedRecords,
      });
    } else {
      res.status(HttpStatusCode.Ok).send({
        statusCode: HttpStatusCode.Ok,
        message: 'Please login to show and add product in cart.',
      });
    }
  }),
);

router.get(
  '/web/c/v1',
  [auth],
  asyncHandler(async (req: Request, res: Response) => {
    // Define the whereClause for filtering CartMaster records
    const whereClause = { softDelete: false, itemType: 'C', userId: (req as any).user.id };

    // Fetch CartMaster records
    const records = await CartMasterModel()
      .select('id,productId,cartProdQnt') // Ensure you are selecting productId and variantId
      .populate(
        'product_variant',
        'id,productId,variantId,productVariantImage,stock,mrp,purchaseCost,sellingPrice',
      ) // Ensure product_variant is correctly populated
      .where(whereClause)
      .find();

    // Handle case where no records are found
    if (!records || records.length === 0)
      throw new CustomError('No records found.', HttpStatusCode.NotFound);

    // Map over the records and fetch related product and variantMaster data
    const mappedRecords = await Promise.all(
      records.map(async (record: any) => {
        const { product_variant, variantId, ...rest } = record;

        // Fetch the product details
        const product = await ProductModel()
          .select('id,name')
          .where({
            id: record.product_variant.productId, // Ensure productId is correct
            softDelete: false,
            isActive: true,
          })
          .findOne();
        // console.log(record.product_variant.productId);
        // Fetch the variant master details
        const variantMaster = await VariantMasterModel()
          .select('id,variantName')
          .where({
            id: record.product_variant.variantId, // Use variantId from the record
            softDelete: false,
            isActive: true,
          })
          .findOne();

        return {
          ...rest, // Rest of the CartMaster fields
          productVariant: product_variant || {}, // Handle null product_variant
          variantMaster: variantMaster || {}, // Handle null variantMaster
          product: product || {}, // Handle null product
        };
      }),
    );

    // Fetch the total count of CartMaster records
    const count = await CartMasterModel().where(whereClause).countDocuments();

    // Send the response
    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      count,
      data: mappedRecords,
    });
  }),
);

/**
 * Get all records for wishlist web
 */
router.get(
  '/web/w',
  asyncHandler(async (req: Request, res: Response) => {
    let customerId = req.query.customerId;
    //console.log(customerId);
    if (customerId) {
      const whereClause = { softDelete: false, itemType: 'W', userId: customerId };
      const records = await CartMasterModel()
        .select('id,productId,userId,cartProdQnt') // Ensure you are selecting productId and variantId
        .populate(
          'product_variant',
          'productId,productVariantImage,variantId,stock,mrp,purchaseCost,sellingPrice',
        ) // Ensure product_variant is correctly populated
        .where(whereClause)
        .find();
      if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);
      const mappedRecords = await Promise.all(
        records.map(async (record: any) => {
          const { product_variant, variantId, ...rest } = record;
          let isCart = false;
          let isWishlist = false;
          let cartProdQnt = 0;
          // totalPrice += product_variant
          //   ? product_variant.sellingPrice * (record.cartProdQnt || 1)
          //   : 0;

          // Extract the first image from product_variant.productVariantImage array
          //const firstImage = product_variant?.productVariantImage?.[0] || null;

          // Determine if the record is in the cart
          if (record.cartProdQnt) {
            isCart = true;
            cartProdQnt = record.cartProdQnt;
          }

          // Fetch the product details
          const product = await ProductModel()
            .select('id,name,productImage')
            .where({
              id: record.product_variant.productId,
              softDelete: false,
              isActive: true,
            })
            .findOne();

          // Fetch the variant master details
          const variantMaster = await VariantMasterModel()
            .select('id,variantName')
            .where({
              id: record.product_variant.variantId,
              softDelete: false,
              isActive: true,
            })
            .findOne();

          // Check if the product is in the wishlist
          const wishlistWhereClause = {
            softDelete: false,
            itemType: 'W',
            productId: record.productId,
            userId: record.userId,
          };
          const wishlist = await CartMasterModel()
            .select('id,cartProdQnt')
            .where(wishlistWhereClause)
            .find();
          if (wishlist && wishlist.length > 0) {
            isWishlist = true;
          }

          return {
            ...rest,
            productVariant: {
              ...product_variant,
              // Include only the first image from productVariantImage array
              //productVariantImage: firstImage,
            },
            variantMaster: variantMaster || {},
            product: product || {},
            isCart: isCart,
            isWishlist: isWishlist,
            cartProdQnt: cartProdQnt,
          };
        }),
      );
      const count = await CartMasterModel().where(whereClause).countDocuments();
      //var NewArr = [];
      res.status(HttpStatusCode.Ok).send({
        statusCode: HttpStatusCode.Ok,
        message: 'Successfully found records.',
        count,
        data: mappedRecords,
      });
    } else {
      res.status(HttpStatusCode.Ok).send({
        statusCode: HttpStatusCode.Ok,
        message: 'Please login to show and add product in wishlist.',
      });
    }
  }),
);

/**
 * Get all records for admin
 */
router.get(
  '/',
  [auth, isAdmin],
  asyncHandler(async (req: Request, res: Response) => {
    let pageIndex: number = parseInt((req as any).query.pageNo);
    let pageSize: number = parseInt((req as any).query.pageLimit);
    let sortBy: string = (req as any).query.sortBy;
    let sortOrder: string = (req as any).query.sortOrder;

    const whereClause = { softDelete: false, itemType: 'C' };
    const records = await CartMasterModel()
      // .populate('product_variant', 'variantId')
      .where(whereClause)
      .pagination(pageIndex, pageSize)
      .sort(sortBy, sortOrder)
      .find();
    if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);

    const count = await CartMasterModel().where(whereClause).countDocuments();
    //var NewArr = [];
    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      count,
      data: records,
    });
  }),
);

/**
 * Get records by id
 */
router.get(
  '/:id',
  [auth],
  asyncHandler(async (req: Request, res: Response) => {
    const isExist = await CartMasterModel().where({ id: req.params.id }).findOne();
    if (!isExist)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    const records = await CartMasterModel()
      .where({ id: req.params.id, softDelete: false })
      .findOne();
    if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      data: records,
    });
  }),
);

/**
 * Update model by id
 */
// router.put(
//   '/:id',
//   [auth],
//   asyncHandler(async (req: ICustomRequest, res: Response) => {
//     const body = req.body as IUpdateCms;
//     const { error } = CartMasterModel().updateCms(body);
//     if (error) throw new CustomError(error.message, HttpStatusCode.BadRequest);

//     const isExist = await CartMasterModel().where({ id: req.params.id }).findOne();
//     if (!isExist)
//       throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

//     let transaction = await CartMasterModel()
//       .where({ id: req.params.id })
//       .select('id, name')
//       .updateOne({
//         name: body.name,
//         cmsKey: body.cmsKey,
//         description: body.description,
//         url: body.url,
//         icon: body.icon,
//         metaTitle: body.metaTitle,
//         metaDescription: body.metaDescription,

//         updatedBy: (req as any).user.id,
//         updatedAt: new Date(),
//       });

//     res.status(HttpStatusCode.Created).send({
//       statusCode: HttpStatusCode.Created,
//       message: 'Successfully updated record.',
//       data: transaction,
//     });
//   }),
// );

/**
 * Change status of model by id
 * Active/Inactive
 */
router.put(
  '/status/:id',
  [auth],
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) throw new CustomError('Id is required.', HttpStatusCode.BadRequest);

    const isExist = await CartMasterModel().where({ id: req.params.id }).findOne();
    if (!isExist)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    await CartMasterModel()
      .where({ id: req.params.id })
      .updateOne({
        isActive: isExist.isActive == true ? false : true,
      });

    res
      .status(HttpStatusCode.Created)
      .send({ statusCode: HttpStatusCode.Created, message: 'Successfully changed status.' });
  }),
);

/**
 * Delete model by id (soft delete)
 */
router.delete(
  '/delete-wishlist/:id',
  [auth],
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) throw new CustomError('Id is required.', HttpStatusCode.BadRequest);

    // Use parameterized query to prevent SQL injection
    const query = `
      DELETE FROM user_cart
      WHERE "itemType" = $1 AND "productId" = $2 AND "userId" = $3
    `;
    const values = ['W', id, (req as any).user.id];

    try {
      const result = await pool.query(query, values);

      if (result.rowCount === 0) {
        throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);
      }

      res.status(HttpStatusCode.Created).send({
        statusCode: HttpStatusCode.Created,
        message: 'Successfully deleted.',
      });
    } catch (error) {
      // Log the error for debugging
      console.error('Error during deletion:', error);
      throw new CustomError('Error deleting the record.', HttpStatusCode.InternalServerError);
    }
  }),
);

router.delete(
  '/delete-cart/:id',
  [auth],
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) throw new CustomError('Id is required.', HttpStatusCode.BadRequest);

    // Use parameterized query to prevent SQL injection
    const query = `
      DELETE FROM user_cart
      WHERE "itemType" = $1 AND "productId" = $2 AND "userId" = $3
    `;
    const values = ['C', id, (req as any).user.id];

    try {
      const result = await pool.query(query, values);

      if (result.rowCount === 0) {
        throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);
      }

      res.status(HttpStatusCode.Created).send({
        statusCode: HttpStatusCode.Created,
        message: 'Successfully deleted.',
      });
    } catch (error) {
      // Log the error for debugging
      console.error('Error during deletion:', error);
      throw new CustomError('Error deleting the record.', HttpStatusCode.InternalServerError);
    }
  }),
);

export default router;
