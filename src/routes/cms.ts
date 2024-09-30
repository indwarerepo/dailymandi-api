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
import { isAdmin } from '../middlewares/admin';
const router = Router();

import { CmsModel } from '../model/models';
import { IAddCms, IUpdateCms } from '../types/cms';

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
 * Master table for CmsModel
 */
router.post(
  '/',
  [auth, isAdmin],
  asyncHandler(async (req: ICustomRequest, res: Response) => {
    const body = req.body as IAddCms;
    const { error } = CmsModel().addCms(body);
    if (error) throw new CustomError(error.message, HttpStatusCode.BadRequest);

    const isExist = await CmsModel().where({ name: body.name, softDelete: false }).findOne();
    if (isExist) throw new CustomError(body.name + ' already exists.', HttpStatusCode.Conflict);

    let transaction = await CmsModel().createOne({
      name: body.name,
      cmsKey: body.cmsKey,
      description: body.description,
      url: body.url,
      icon: body.icon,
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
 * Get web records by cmsKey
 */
router.get(
  '/web/list/:cmsKey',
  asyncHandler(async (req: Request, res: Response) => {
    let cmsKey = req.params.cmsKey;
    const whereClause = { cmsKey: cmsKey, softDelete: false };
    const records = await CmsModel()
      .select('id, name, description, metaTitle, metaDescription, url')
      .where(whereClause)
      .findOne();
    if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);

    const count = await CmsModel().where(whereClause).countDocuments();

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      count,
      data: records,
    });
  }),
);

/**
 * Get all records
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
    const records = await CmsModel()
      .select(
        'id, name, cmsKey, description, url, icon, metaTitle, metaDescription, isActive, createdAt',
      )
      .where(whereClause)
      .pagination(pageIndex, pageSize)
      .sort(sortBy, sortOrder)
      .find();
    if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);

    const count = await CmsModel().where(whereClause).countDocuments();

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
  [auth, isAdmin],
  asyncHandler(async (req: Request, res: Response) => {
    const isExist = await CmsModel().where({ id: req.params.id }).findOne();
    if (!isExist)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    const records = await CmsModel()
      .select(
        'id, name, cmsKey, description, url, icon, metaTitle, metaDescription, isActive, createdAt',
      )
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
router.put(
  '/:id',
  [auth, isAdmin],
  asyncHandler(async (req: ICustomRequest, res: Response) => {
    const body = req.body as IUpdateCms;
    const { error } = CmsModel().updateCms(body);
    if (error) throw new CustomError(error.message, HttpStatusCode.BadRequest);

    const isExist = await CmsModel().where({ id: req.params.id }).findOne();
    if (!isExist)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    let transaction = await CmsModel()
      .where({ id: req.params.id })
      .select('id, name')
      .updateOne({
        name: body.name,
        cmsKey: body.cmsKey,
        description: body.description,
        url: body.url,
        icon: body.icon,
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
 * Change status of model by id
 * Active/Inactive
 */
router.put(
  '/status/:id',
  [auth, isAdmin],
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) throw new CustomError('Id is required.', HttpStatusCode.BadRequest);

    const isExist = await CmsModel().where({ id: req.params.id }).findOne();
    if (!isExist)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    await CmsModel()
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
  '/:id',
  [auth, isAdmin],
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) throw new CustomError('Id is required.', HttpStatusCode.BadRequest);

    const delId = await CmsModel().where({ id: req.params.id }).softDelete();
    if (!delId)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    res
      .status(HttpStatusCode.Created)
      .send({ statusCode: HttpStatusCode.Created, message: 'Successfully deleted.' });
  }),
);

export default router;
