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

import { OrderStatusModel } from '../model/models';
import { IAddOrderStatus, IUpdateOrderStatus } from '../types/order-status';

/* ****************************WEB API********************************* */

/**
 * Get all records for dropdown
 */
router.get(
  '/dropdown/list',
  asyncHandler(async (req: Request, res: Response) => {
    const isExist = await OrderStatusModel().rawSql(
      `SELECT * FROM order_status WHERE "isActive" = true AND "softDelete" = false AND id IN ('c2f959f4-8641-4b05-8289-df607b271e5e', 'a4f5a8be-2dad-4a74-ada2-15972f5b0d8c')`,
    );

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      data: isExist['rows'],
    });
  }),
);

/* **************************************ADMIN API******************************************** */
/**
 * Create new Model
 * Master table for OrderStatusModel
 */
router.post(
  '/',
  [auth, isAdmin],
  asyncHandler(async (req: ICustomRequest, res: Response) => {
    const body = req.body as IAddOrderStatus;
    const { error } = OrderStatusModel().addOrderStatus(body);
    if (error) throw new CustomError(error.message, HttpStatusCode.BadRequest);

    const isExist = await OrderStatusModel()
      .where({ statusTitle: body.statusTitle, softDelete: false })
      .findOne();
    if (isExist)
      throw new CustomError(body.statusTitle + ' already exists.', HttpStatusCode.Conflict);

    let transaction = await OrderStatusModel().createOne({
      statusTitle: body.statusTitle,
      remarks: body.remarks,
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
    const records = await OrderStatusModel()
      .where(whereClause)
      .pagination(pageIndex, pageSize)
      .sort(sortBy, sortOrder)
      .find();
    if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);

    const count = await OrderStatusModel().where(whereClause).countDocuments();

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
    const isExist = await OrderStatusModel().where({ id: req.params.id }).findOne();
    if (!isExist)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    const records = await OrderStatusModel()
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
    const body = req.body as IUpdateOrderStatus;
    const { error } = OrderStatusModel().updateOrderStatus(body);
    if (error) throw new CustomError(error.message, HttpStatusCode.BadRequest);

    const isExist = await OrderStatusModel().where({ id: req.params.id }).findOne();
    if (!isExist)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    let transaction = await OrderStatusModel()
      .where({ id: req.params.id })
      .select('id, statusTitle')
      .updateOne({
        statusTitle: body.statusTitle,
        remarks: body.remarks,
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

    const isExist = await OrderStatusModel().where({ id: req.params.id }).findOne();
    if (!isExist)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    await OrderStatusModel()
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

    const delId = await OrderStatusModel().where({ id: req.params.id }).softDelete();
    if (!delId)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    res
      .status(HttpStatusCode.Created)
      .send({ statusCode: HttpStatusCode.Created, message: 'Successfully deleted.' });
  }),
);

export default router;
