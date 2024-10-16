import { Request, Response, Router } from 'express';
import { ICustomRequest } from '../types/common';
import { HttpStatusCode } from '../helpers/http-status-codes';
// import config from 'config';
import moment from 'moment';
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

import { BannerModel } from '../model/models';
import { IAddBanner, IUpdateBanner } from '../types/banner';

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
 * Get all web banner
 */
router.get(
  '/web',
  asyncHandler(async (req: Request, res: Response) => {
    const whereClause = { bannerDisplay: 'W', isActive: true, softDelete: false };

    const records = await BannerModel()
      .select('id, name, categoryId, image, bannerType, bannerDisplay')
      .populate('product_category', 'id,name')
      .where(whereClause)
      .find();

    if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);

    const bannerImages = records.reduce((acc: any, record: any, index: number) => {
      acc[`bannerImage${record.bannerType}`] = {
        link: record.image,
        categoryId: record.categoryId || '', // Include categoryId, default to an empty string if not present
      };
      return acc;
    }, {});

    const count = await BannerModel().where(whereClause).countDocuments();

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      count,
      data: bannerImages,
    });
  }),
);

/**
 * Get all mobile banner
 */
router.get(
  '/mobile/',
  asyncHandler(async (req: Request, res: Response) => {
    const whereClause = { bannerDisplay: 'M', isActive: true, softDelete: false };

    const records = await BannerModel()
      .select('id, name, categoryId, image, bannerType, bannerDisplay')
      .populate('product_category', 'id,name')
      .where(whereClause)
      .find();

    if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);

    const bannerImages = records.reduce((acc: any, record: any, index: number) => {
      acc[`bannerImage${record.bannerType}`] = {
        link: record.image,
        categoryId: record.categoryId || '', // Include categoryId, default to an empty string if not present
      };
      return acc;
    }, {});

    const count = await BannerModel().where(whereClause).countDocuments();

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      count,
      data: bannerImages,
    });
  }),
);

/////////////////////////// admin apis ////////////////////////

/**
 * Create new banner
 */
router.post(
  '/',
  [auth, isAdmin],
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as IAddBanner;
    const { error } = BannerModel().addBanner(body);
    if (error) throw new CustomError(error.message, HttpStatusCode.BadRequest);

    const isExist = await BannerModel()
      .where({
        name: body.name,
        bannerType: body.bannerType,
        bannerDisplay: body.bannerDisplay,
        softDelete: false,
      })
      .findOne();
    if (isExist) throw new CustomError(body.name + ' already exists.', HttpStatusCode.Conflict);
    //console.log(isExist);

    //image upload to azure storage container from base64
    let imageUrl: string = '';
    if (body.image) {
      let fileUpload = await imageUpload(body.image, `bannercontainer`);
      if (fileUpload) {
        imageUrl = fileUpload;
      } else {
        return res.status(HttpStatusCode.UnsupportedMediaType).send({
          statusCode: HttpStatusCode.UnsupportedMediaType,
          message: 'Only png, jpg & jpeg filetype supported.',
        });
      }
    }

    let transaction = await BannerModel().createOne({
      name: body.name,
      subTitle: body.subTitle,
      categoryId: body.categoryId,
      image: imageUrl,
      remarks: body.remarks,
      bannerType: body.bannerType,
      bannerDisplay: body.bannerDisplay,
      isHead: false,
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
 * Get all banner
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
    const records = await BannerModel()
      .select(
        'id, name, categoryId, image, remarks, bannerType, bannerDisplay, isActive, createdAt, createdBy',
      )
      .populate('product_category', 'id,name')
      .where(whereClause)
      .pagination(pageIndex, pageSize)
      .sort(sortBy, sortOrder)
      .find();
    if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);

    const mappedRecords = records.map((record: any) => {
      const { product_category, ...rest } = record;
      return {
        ...rest,
        productCategory: product_category, // Map DB field to your desired name
      };
    });

    const count = await BannerModel().where(whereClause).countDocuments();

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      count,
      data: mappedRecords,
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
    // Retrieve the record based on the provided ID
    const isExist = await BannerModel().where({ id: req.params.id }).findOne();

    if (!isExist) {
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);
    }

    const record = await BannerModel()
      .select(
        'id, name, categoryId, image, remarks, bannerType, bannerDisplay, isActive, createdAt, createdBy',
      )
      .populate('product_category', 'id, name') // Populate using the actual DB field name
      .where({ id: req.params.id })
      .findOne();

    if (!record) {
      throw new CustomError('No records found.', HttpStatusCode.NotFound);
    }

    // Ensure the record is a plain object (if it's a Mongoose document, convert it)
    const plainRecord = record.toObject ? record.toObject() : record;

    // Map the database field 'product_category' to 'productCategory' in the output
    const mappedRecord = {
      ...plainRecord,
      productCategory: plainRecord.product_category, // Map DB field to your desired name
    };

    // Optionally, remove the original DB field name from the response
    delete mappedRecord.product_category;

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      data: mappedRecord, // Send the mapped record with 'productCategory'
    });
  }),
);

/**
 * Banner Update by id
 */
router.put(
  '/:id',
  [auth, isAdmin],
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as IUpdateBanner;
    const { error } = BannerModel().updateBanner(body);
    if (error) throw new CustomError(error.message, HttpStatusCode.BadRequest);

    const isExist = await BannerModel().where({ id: req.params.id }).findOne();
    if (!isExist)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    let imageUrl: string = '';
    const imageInputType = checkImageInput(body.image);
    if (imageInputType === 'Base64') {
      let fileUpload = await imageUpload(body.image, `bannercontainer`);
      if (fileUpload) {
        imageUrl = fileUpload;
      } else {
        return res.status(HttpStatusCode.UnsupportedMediaType).send({
          statusCode: HttpStatusCode.UnsupportedMediaType,
          message: 'Only png, jpg & jpeg filetype supported.',
        });
      }
    } else {
      imageUrl = isExist.image;
    }

    let transaction = await BannerModel()
      .where({ id: req.params.id })
      .select('id, name')
      .updateOne({
        name: body.name,
        subTitle: body.subTitle,
        categoryId: body.categoryId,
        image: imageUrl,
        remarks: body.remarks,
        bannerType: body.bannerType,
        bannerDisplay: body.bannerDisplay,
        isHead: false,

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
 * Banner Update by Status
 */
router.put(
  '/status/:id',
  [auth, isAdmin],
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) throw new CustomError('Id is required.', HttpStatusCode.BadRequest);

    const isExist = await BannerModel().where({ id: req.params.id }).findOne();
    if (!isExist)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    await BannerModel()
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
 * Banner Delete
 */
router.delete(
  '/:id',
  [auth, isAdmin],
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) throw new CustomError('Id is required.', HttpStatusCode.BadRequest);

    const delId = await BannerModel().where({ id: req.params.id }).softDelete();
    if (!delId)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    res
      .status(HttpStatusCode.Created)
      .send({ statusCode: HttpStatusCode.Created, message: 'Successfully deleted.' });
  }),
);
export default router;
