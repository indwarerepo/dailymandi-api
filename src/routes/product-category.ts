import { Request, Response, Router } from 'express';
import { ICustomRequest } from '../types/common';
import { HttpStatusCode } from '../helpers/http-status-codes';
// import config from 'config';
// import moment from 'moment';
import multer from 'multer';
import path from 'path';
// import fs from 'fs';
// import xlsx from 'xlsx';
// const { PDFDocument } = require('pdf-lib');
import { checkImageInput, imageUpload } from '../helpers/util';
import asyncHandler from '../middlewares/asyncHandler';
import CustomError from '../middlewares/customError';
import { auth } from '../middlewares/auth';
import { isAdmin } from '../middlewares/admin';
const router = Router();

import { ProductCategoryModel } from '../model/models';
import { IAddProductCategory, IUpdateProductCategory } from '../types/product-category';

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

/////////////////////////// web apis ////////////////////////

/**
 * Get all category for web
 */
router.get(
  '/web/',
  asyncHandler(async (req: Request, res: Response) => {
    // let pageIndex: number = parseInt((req as any).query.pageNo);
    // let pageSize: number = parseInt((req as any).query.pageLimit);
    // let sortBy: string = (req as any).query.sortBy;
    // let sortOrder: string = (req as any).query.sortOrder;

    const whereClause = { isActive: true, softDelete: false };
    const records = await ProductCategoryModel()
      .select('id, name, coverImage, description, displayOrder')
      .where(whereClause)
      .find();
    // .sort('displayOrder', '1')
    if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);

    const count = await ProductCategoryModel().where(whereClause).countDocuments();

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      count,
      data: records,
    });
  }),
);

/**
 * Get all category for web home
 */
router.get(
  '/web/home/',
  asyncHandler(async (req: Request, res: Response) => {
    // let pageIndex: number = parseInt((req as any).query.pageNo);
    // let pageSize: number = parseInt((req as any).query.pageLimit);
    // let sortBy: string = (req as any).query.sortBy;
    // let sortOrder: string = (req as any).query.sortOrder;

    const whereClause = { isActive: true, softDelete: false };
    const records = await ProductCategoryModel()
      .select('id, name, coverImage, description, displayOrder')
      .pagination(0, 8)
      .sort('displayOrder', '1')
      .where(whereClause)
      .find();

    if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);

    //const count = await ProductCategoryModel().where(whereClause).countDocuments();

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      //count,
      data: records,
    });
  }),
);

/////////////////////////// admin apis ////////////////////////

/**
 * Create new category
 */
router.post(
  '/',
  [auth, isAdmin],
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as IAddProductCategory;
    const { error } = ProductCategoryModel().addProductCategory(body);
    if (error) throw new CustomError(error?.message, HttpStatusCode.BadRequest);

    const isExist = await ProductCategoryModel()
      .where({ name: body.name, softDelete: false })
      .or({ displayOrder: body.displayOrder, softDelete: false })
      .findOne();
    if (isExist) throw new CustomError('Category already exists.', HttpStatusCode.Conflict);

    //image upload to azure storage container from base64
    let imageUrl: string = '';
    if (body.coverImage) {
      let fileUpload = await imageUpload(body.coverImage, `categorycontainer`);
      if (fileUpload) {
        imageUrl = fileUpload;
      } else {
        return res.status(HttpStatusCode.UnsupportedMediaType).send({
          statusCode: HttpStatusCode.UnsupportedMediaType,
          message: 'Only png, jpg & jpeg filetype supported.',
        });
      }
    }
    //console.log(imageUrl);return;

    let transaction = await ProductCategoryModel()
      .select('id, name')
      .createOne({
        name: body.name,
        coverImage: imageUrl,
        description: body.description,
        isTopMenu: body.isTopMenu,
        isFeatured: body.isFeatured,
        displayOrder: body.displayOrder,
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
        createdBy: (req as any).user.id,
      });

    res.status(HttpStatusCode.Created).send({
      statusCode: HttpStatusCode.Created,
      message: 'New record created successfully.',
      data: transaction,
    });
  }),
);

/**
 * Get all category
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
    const records = await ProductCategoryModel()
      .select(
        'id, name, coverImage, coverVideo, description, displayOrder,  metaTitle, metaDescription, isActive, createdAt, createdBy',
      )
      .where(whereClause)
      .pagination(pageIndex, pageSize)
      .sort(sortBy, sortOrder)
      .find();
    if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);

    const count = await ProductCategoryModel().where(whereClause).countDocuments();

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      count,
      data: records,
    });
  }),
);

/**
 * Get all records for dropdown
 */
router.get(
  '/drop-down',
  [auth, isAdmin],
  asyncHandler(async (req: Request, res: Response) => {
    const records = await ProductCategoryModel()
      .select('id, name')
      .where({
        //createdBy: (req as any).user.id,
        softDelete: false,
      })
      .find();
    if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);
    const count = await ProductCategoryModel()
      .where({ softDelete: false, isActive: true })
      .countDocuments();
    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      data: records,
      count: count,
    });
  }),
);

/**
 * Get records by id of category
 */
router.get(
  '/:id',
  [auth, isAdmin],
  asyncHandler(async (req: Request, res: Response) => {
    const isExist = await ProductCategoryModel().where({ id: req.params.id }).findOne();
    if (!isExist)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    const records = await ProductCategoryModel()
      .select(
        'id, name, coverImage, coverVideo, description, displayOrder,  metaTitle, metaDescription, isActive, createdAt, createdBy',
      )
      .where({ id: req.params.id })
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
 * Category Update by id
 */
router.put(
  '/:id',
  [auth, isAdmin],
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as IUpdateProductCategory;
    const { error } = ProductCategoryModel().updateProductCategory(body);
    if (error) throw new CustomError(error.message, HttpStatusCode.BadRequest);

    const isExist = await ProductCategoryModel().where({ id: req.params.id }).findOne();
    if (!isExist) {
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);
    }

    //check for other records with same name except current record
    if (isExist.name !== body.name) {
      const isExist2 = await ProductCategoryModel()
        .where({ name: body.name, softDelete: false })
        .findOne();
      if (isExist2) {
        throw new CustomError('A record already exists with this name.', HttpStatusCode.BadRequest);
      }
    }
    //check for other records with same display order except current record
    if (isExist.displayOrder !== body.displayOrder) {
      const isExist2 = await ProductCategoryModel()
        .where({ displayOrder: body.displayOrder, softDelete: false })
        .findOne();
      if (isExist2) {
        throw new CustomError(
          'A record already exists with this display order.',
          HttpStatusCode.BadRequest,
        );
      }
    }

    //check for image input, if exist (base64) then upload else use old image (url)
    let imageUrl: string = '';
    const imageInputType = checkImageInput(body.coverImage);
    if (imageInputType === 'Base64') {
      let fileUpload = await imageUpload(body.coverImage, `categorycontainer`);
      if (fileUpload) {
        imageUrl = fileUpload;
      } else {
        return res.status(HttpStatusCode.UnsupportedMediaType).send({
          statusCode: HttpStatusCode.UnsupportedMediaType,
          message: 'Only png, jpg & jpeg filetype supported.',
        });
      }
    } else {
      imageUrl = isExist.coverImage;
    }

    let transaction = await ProductCategoryModel()
      .where({ id: req.params.id })
      .select('id, name')
      .updateOne({
        name: body.name,
        coverImage: imageUrl,
        description: body.description,
        isTopMenu: body.isTopMenu,
        isFeatured: body.isFeatured,
        displayOrder: body.displayOrder,
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
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
 * Category Update by Status
 */
router.put(
  '/status/:id',
  [auth, isAdmin],
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) throw new CustomError('Id is required.', HttpStatusCode.BadRequest);

    const isExist = await ProductCategoryModel().where({ id: req.params.id }).findOne();
    if (!isExist)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    await ProductCategoryModel()
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
 * Category Delete
 */
router.delete(
  '/:id',
  [auth, isAdmin],
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) throw new CustomError('Id is required.', HttpStatusCode.BadRequest);

    const delId = await ProductCategoryModel().where({ id: req.params.id }).softDelete();
    if (!delId)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);
    res
      .status(HttpStatusCode.Created)
      .send({ statusCode: HttpStatusCode.Created, message: 'Successfully deleted.' });
  }),
);

export default router;
