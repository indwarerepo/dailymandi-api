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
const router = Router();

import { UserAddressModel } from '../model/models';
import { IAddUserAddress, IUpdateUserAddress } from '../types/user-address';

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
 * Master table for UserAddressModel
 */
router.post(
  '/',
  [auth, customer],
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as IAddUserAddress;
    const { error } = UserAddressModel().validateAddUserAddress(body);
    if (error) throw new CustomError(error.message, HttpStatusCode.BadRequest);

    const isExist = await UserAddressModel()
      .where({ pincode: body.pincode, userId: (req as any).user.id, softDelete: false })
      .findOne();
    if (isExist) throw new CustomError('pincode already exists.', HttpStatusCode.Conflict);

    let transaction = await UserAddressModel().createOne({
      userId: (req as any).user.id,
      pincode: body.pincode,
      company: body.company,
      firstName: body.firstName,
      lastName: body.lastName,
      addressOne: body.addressOne,
      addressTwo: body.addressTwo,
      city: body.city,
      state: body.state,
      addressTitle: body.addressTitle,
      country: body.country,
      phone: body.phone,
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
  [auth, customer],
  asyncHandler(async (req: Request, res: Response) => {
    let pageIndex: number = parseInt((req as any).query.pageNo);
    let pageSize: number = parseInt((req as any).query.pageLimit);
    let sortBy: string = (req as any).query.sortBy;
    let sortOrder: string = (req as any).query.sortOrder;

    const whereClause = { userId: (req as any).user.id, softDelete: false };
    const records = await UserAddressModel()
      .select(
        'id, pincode, company, firstName, lastName, addressOne, addressTwo, phone, city,state,addressTitle, country, isActive, createdAt',
      )
      .populate('pincode', 'id, pincode')
      .where(whereClause)
      .pagination(pageIndex, pageSize)
      .sort(sortBy, sortOrder)
      .find();
    if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);

    const count = await UserAddressModel().where(whereClause).countDocuments();

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      count,
      data: records,
    });
  }),
);

/**
 * Get all records by Customer in Admin
 */
router.get(
  '/bycustomer/:id',
  [auth, isAdmin],
  asyncHandler(async (req: Request, res: Response) => {
    let pageIndex: number = parseInt((req as any).query.pageNo);
    let pageSize: number = parseInt((req as any).query.pageLimit);
    let sortBy: string = (req as any).query.sortBy;
    let sortOrder: string = (req as any).query.sortOrder;

    const whereClause = { userId: req.params.id, softDelete: false };
    const records = await UserAddressModel()
      .select(
        'id, pincode, company, firstName, lastName, addressOne, addressTwo, phone, city,state,addressTitle, country, isActive, createdAt',
      )
      .populate('pincode', 'id, pincode')
      .where(whereClause)
      .pagination(pageIndex, pageSize)
      .sort(sortBy, sortOrder)
      .find();
    if (!records) throw new CustomError('No records found.', HttpStatusCode.NotFound);

    const count = await UserAddressModel().where(whereClause).countDocuments();

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
  '/drop-down/',
  [auth, customer],
  asyncHandler(async (req: Request, res: Response) => {
    const whereClause = { userId: (req as any).user.id, softDelete: false };
    const records = await UserAddressModel().select('id, pincode').where(whereClause).find();

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Successfully found records.',
      data: records,
    });
  }),
);

/**
 * Get records by id
 */
router.get(
  '/:id',
  [auth, customer],
  asyncHandler(async (req: Request, res: Response) => {
    const isExist = await UserAddressModel().where({ id: req.params.id }).findOne();
    if (!isExist)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    const records = await UserAddressModel()
      .select(
        'id, pincode, userId, company, firstName, lastName, addressOne, addressTwo, phone, city, state,addressTitle, country, isActive, createdAt',
      )
      .where({ id: req.params.id, softDelete: false })
      .populate('pincode', 'id, pincode')
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
  [auth, customer],
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as IUpdateUserAddress;
    const { error } = UserAddressModel().validateUpdateUserAddress(body);
    if (error) throw new CustomError(error.message, HttpStatusCode.BadRequest);

    const isExist = await UserAddressModel().where({ id: req.params.id }).findOne();
    if (!isExist)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    //check for other records with same pincode except current record
    if (isExist.pincode !== body.pincode) {
      const isExist2 = await UserAddressModel()
        .where({ pincode: body.pincode, softDelete: false })
        .findOne();
      if (isExist2) {
        throw new CustomError(
          'A record already exists with this pincode',
          HttpStatusCode.BadRequest,
        );
      }
    }

    let transaction = await UserAddressModel()
      .where({ id: req.params.id })
      .select('id, firstName, company, pincode, addressOne, city')
      .updateOne({
        pincode: body.pincode,
        company: body.company,
        firstName: body.firstName,
        lastName: body.lastName,
        addressOne: body.addressOne,
        addressTwo: body.addressTwo,
        city: body.city,
        state: body.state,
        addressTitle: body.addressTitle,
        country: body.country,
        phone: body.phone,

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
  [auth, customer],
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) throw new CustomError('Id is required.', HttpStatusCode.BadRequest);

    const isExist = await UserAddressModel().where({ id: req.params.id }).findOne();
    if (!isExist)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    await UserAddressModel()
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
  [auth, customer],
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) throw new CustomError('Id is required.', HttpStatusCode.BadRequest);

    const delId = await UserAddressModel().where({ id: req.params.id }).softDelete();
    if (!delId)
      throw new CustomError('Record not available with this id.', HttpStatusCode.NotFound);

    res
      .status(HttpStatusCode.Created)
      .send({ statusCode: HttpStatusCode.Created, message: 'Successfully deleted.' });
  }),
);

export default router;
