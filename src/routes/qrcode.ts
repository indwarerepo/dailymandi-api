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

import { QrCodeModel } from '../model/models';
import { IAddQrCode, IUpdateQrCode } from '../types/qrcode';

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

/////////////////////////// admin apis ////////////////////////

/**
 * Create new qrcode
 */
router.post(
  '/',
  [auth, isAdmin],
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as IAddQrCode;
    const { error } = QrCodeModel().addQrCode(body);
    if (error) throw new CustomError(error.message, HttpStatusCode.BadRequest);

    const isExist = await QrCodeModel()
      .where({
        name: body.name,
        softDelete: false,
      })
      .findOne();
    if (isExist) throw new CustomError(body.name + ' already exists.', HttpStatusCode.Conflict);
    //console.log(isExist);

    //image upload to azure storage container from base64
    let imageUrl: string = '';
    if (body.image) {
      let fileUpload = await imageUpload(body.image, `qrcodecontainer`);
      if (fileUpload) {
        imageUrl = fileUpload;
      } else {
        return res.status(HttpStatusCode.UnsupportedMediaType).send({
          statusCode: HttpStatusCode.UnsupportedMediaType,
          message: 'Only png, jpg & jpeg filetype supported.',
        });
      }
    }

    let transaction = await QrCodeModel().createOne({
      name: body.name,
      image: imageUrl,
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
 * Get all qrcode
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
    const records = await QrCodeModel()
      .select('id, name, image, isActive, createdAt, createdBy')
      .where(whereClause)
      .pagination(pageIndex, pageSize)
      .sort(sortBy, sortOrder)
      .find();
    if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);

    const count = await QrCodeModel().where(whereClause).countDocuments();

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      count,
      data: records,
    });
  }),
);

/**
 * Get records by id of Qrcode
 */
router.get(
  '/:id',
  [auth, isAdmin],
  asyncHandler(async (req: Request, res: Response) => {
    // Retrieve the record based on the provided ID
    const isExist = await QrCodeModel().where({ id: req.params.id }).findOne();

    if (!isExist) {
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);
    }

    const record = await QrCodeModel()
      .select('id, name,  image, isActive, createdAt, createdBy')
      .where({ id: req.params.id })
      .findOne();

    if (!record) {
      throw new CustomError('No records found.', HttpStatusCode.NotFound);
    }

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      data: record,
    });
  }),
);

/**
 * Qrcode Update by id
 */
router.put(
  '/:id',
  [auth, isAdmin],
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as IUpdateQrCode;
    const { error } = QrCodeModel().updateQrCode(body);
    if (error) throw new CustomError(error.message, HttpStatusCode.BadRequest);

    const isExist = await QrCodeModel().where({ id: req.params.id }).findOne();
    if (!isExist)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    let imageUrl: string = '';
    const imageInputType = checkImageInput(body.image);
    if (imageInputType === 'Base64') {
      let fileUpload = await imageUpload(body.image, `qrcodecontainer`);
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

    let transaction = await QrCodeModel()
      .where({ id: req.params.id })
      .select('id, name')
      .updateOne({
        name: body.name,
        image: imageUrl,
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

/* ****************************WEB API********************************* */

/**
 * Get all records for dropdown
 */
router.get(
  '/web/list',
  asyncHandler(async (req: Request, res: Response) => {
    const whereClause = { isActive: true, softDelete: false };
    const records = await QrCodeModel().select('id, name, image').where(whereClause).findOne();
    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      data: records,
    });
  }),
);

export default router;
