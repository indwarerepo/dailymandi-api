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

import { DeliverySlotModel } from '../model/models';
import { IAddDeliverySlot, IUpdateDeliverySlot } from '../types/delivery-slot';

/**
 * Create new Delivery Slots
 */
router.post(
  '/',
  [auth, isAdmin],
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as IAddDeliverySlot;
    const { error } = DeliverySlotModel().addDeliverySlot(body);
    if (error) throw new CustomError(error.message, HttpStatusCode.BadRequest);

    const isExist = await DeliverySlotModel()
      .where({
        displayContent: body.displayContent,
        isActive: true,
        softDelete: false,
      })
      .findOne();
    if (isExist)
      throw new CustomError(body.displayContent + ' already exists.', HttpStatusCode.Conflict);
    //console.log(isExist);

    let transaction = await DeliverySlotModel().createOne({
      displayContent: body.displayContent,
      timeFrom: body.timeFrom,
      timeTo: body.timeTo,
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
    const records = await DeliverySlotModel()
      .select('id, displayContent, timeFrom,timeTo, isActive, createdAt, createdBy')
      .where(whereClause)
      .pagination(pageIndex, pageSize)
      .sort(sortBy, sortOrder)
      .find();
    if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);

    const count = await DeliverySlotModel().where(whereClause).countDocuments();

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
    const isExist = await DeliverySlotModel().where({ id: req.params.id }).findOne();

    if (!isExist) {
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);
    }

    const record = await DeliverySlotModel()
      .select('id, displayContent, timeFrom,timeTo,isActive, createdAt, createdBy')
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
    const body = req.body as IUpdateDeliverySlot;
    const { error } = DeliverySlotModel().updateDeliverySlot(body);
    if (error) throw new CustomError(error.message, HttpStatusCode.BadRequest);

    const isExist = await DeliverySlotModel().where({ id: req.params.id }).findOne();
    if (!isExist)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    let transaction = await DeliverySlotModel()
      .where({ id: req.params.id })
      .select('id')
      .updateOne({
        displayContent: body.displayContent,
        timeFrom: body.timeFrom,
        timeTo: body.timeTo,
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

    const isExist = await DeliverySlotModel().where({ id: req.params.id }).findOne();
    if (!isExist)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    await DeliverySlotModel()
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

    const delId = await DeliverySlotModel().where({ id: req.params.id }).softDelete();
    if (!delId)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    res
      .status(HttpStatusCode.Created)
      .send({ statusCode: HttpStatusCode.Created, message: 'Successfully deleted.' });
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
    const records = await DeliverySlotModel()
      .select('id,  displayContent, timeFrom,timeTo')
      .where(whereClause)
      .find();
    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      data: records,
    });
  }),
);

export default router;
